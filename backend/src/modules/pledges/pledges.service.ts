import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GamesService } from '../games/games.service';
import { Match, MatchDocument } from './schemas/match.schema';
import { Pledge, PledgeDocument } from './schemas/pledge.schema';
import { CreateMatchDto } from './dto/create-match.dto';
import { PlacePledgeDto } from './dto/place-pledge.dto';
import { WalletService } from '../wallet/wallet.service';
import { PledgesGateway } from './pledges.gateway';
import { RequestJoinMatchDto } from './dto/request-join-match.dto';
import { StreamsService } from '../streams/streams.service';

@Injectable()
export class PledgesService implements OnModuleInit {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
    @InjectModel(Pledge.name) private readonly pledgeModel: Model<PledgeDocument>,
    private readonly gamesService: GamesService,
    private readonly walletService: WalletService,
    private readonly pledgesGateway: PledgesGateway,
    private readonly streamsService: StreamsService,
  ) {}

  async onModuleInit() {
    await this.matchModel.deleteMany({
      hostUserId: { $exists: false },
      hostUsername: 'iGamia Arena',
    });
  }

  listMatches() {
    return this.matchModel.find().sort({ scheduledFor: 1 }).lean();
  }

  getFeaturedActivities() {
    return this.matchModel.find({ status: 'open' }).sort({ scheduledFor: 1 }).limit(8).lean();
  }

  async createMatch(userId: string, username: string, dto: CreateMatchDto) {
    const game = await this.gamesService.getGameById(dto.gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.matchModel.create({
      gameId: new Types.ObjectId(dto.gameId),
      gameTitle: game.title,
      title: dto.title,
      hostUserId: new Types.ObjectId(userId),
      hostUsername: username,
      scheduledFor: new Date(dto.scheduledFor),
      minimumStakeUsd: dto.minimumStakeUsd ?? 10,
      maxPlayers: dto.maxPlayers ?? 3,
      participants: [{ userId: new Types.ObjectId(userId), username, joinedAt: new Date() }],
      pendingRequests: [],
      status: 'open',
      mode: 'co-op',
    });
  }

  async joinMatch(matchId: string, userId: string, username: string, dto: RequestJoinMatchDto) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId?.toString() === userId) {
      throw new BadRequestException('You cannot join your own pledge');
    }

    if (match.status !== 'open') {
      throw new BadRequestException('This pledge is no longer accepting join requests');
    }

    if (dto.amountUsd < match.minimumStakeUsd) {
      throw new BadRequestException(`Minimum stake is $${match.minimumStakeUsd}`);
    }

    const alreadyJoined = match.participants.some((participant) => participant.userId.toString() === userId);
    if (alreadyJoined) {
      return match;
    }

    const alreadyRequested = match.pendingRequests.some((request) => request.userId.toString() === userId);
    if (alreadyRequested) {
      throw new BadRequestException('You have already requested to join this pledge');
    }

    if (match.participants.length >= match.maxPlayers) {
      throw new BadRequestException('Match is already full');
    }

    match.pendingRequests.push({
      userId: new Types.ObjectId(userId),
      username,
      amountUsd: dto.amountUsd,
      requestedAt: new Date(),
    });
    await match.save();

    if (match.hostUserId) {
      this.pledgesGateway.emitJoinNotification(match.hostUserId.toString(), {
        id: `${match.id}:${userId}:${Date.now()}`,
        matchId: match.id,
        title: match.title,
        gameTitle: match.gameTitle,
        hostUserId: match.hostUserId.toString(),
        joinedByUserId: userId,
        joinedByUsername: username,
        amountUsd: dto.amountUsd,
        joinedAt: new Date().toISOString(),
      });
    }

    return {
      message: 'Join request sent. Waiting for the host to accept or reject.',
      match,
    };
  }

  async acceptJoinRequest(matchId: string, requestUserId: string, hostUserId: string, hostUsername: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId?.toString() !== hostUserId) {
      throw new BadRequestException('Only the pledge host can accept join requests');
    }

    const request = match.pendingRequests.find((item) => item.userId.toString() === requestUserId);
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (match.participants.length >= match.maxPlayers) {
      throw new BadRequestException('Match is already full');
    }

    await this.walletService.debitUsd(
      requestUserId,
      request.amountUsd,
      `Pledge for ${match.title}`,
      { matchId },
    );

    await this.pledgeModel.create({
      matchId: new Types.ObjectId(matchId),
      userId: new Types.ObjectId(requestUserId),
      username: request.username,
      amountUsd: request.amountUsd,
      status: 'placed',
    });

    match.prizePool += request.amountUsd;
    match.pendingRequests = match.pendingRequests.filter((item) => item.userId.toString() !== requestUserId);
    match.participants.push({
      userId: new Types.ObjectId(requestUserId),
      username: request.username,
      joinedAt: new Date(),
    });
    match.status = 'live';

    const stream = await this.streamsService.startPledgeStream({
      _id: match._id,
      hostUserId: match.hostUserId?.toString(),
      title: match.title,
      gameTitle: match.gameTitle,
      participants: match.participants.map((participant) => ({
        userId: participant.userId.toString(),
        username: participant.username,
      })),
    });

    match.streamId = new Types.ObjectId(stream._id.toString());
    await match.save();

    this.pledgesGateway.emitJoinAccepted([hostUserId, requestUserId], {
      matchId: match.id,
      title: match.title,
      gameTitle: match.gameTitle,
      action: 'accepted',
      streamId: stream._id.toString(),
      hostUsername,
      joinedByUserId: requestUserId,
      joinedByUsername: request.username,
    });

    return {
      message: 'Join request accepted. Pledge live started.',
      match,
      stream,
    };
  }

  async rejectJoinRequest(matchId: string, requestUserId: string, hostUserId: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId?.toString() !== hostUserId) {
      throw new BadRequestException('Only the pledge host can reject join requests');
    }

    const request = match.pendingRequests.find((item) => item.userId.toString() === requestUserId);
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    match.pendingRequests = match.pendingRequests.filter((item) => item.userId.toString() !== requestUserId);
    await match.save();

    this.pledgesGateway.emitJoinRejected(requestUserId, {
      matchId: match.id,
      title: match.title,
      gameTitle: match.gameTitle,
      action: 'rejected',
      hostUsername: match.hostUsername,
      joinedByUserId: requestUserId,
      joinedByUsername: request.username,
    });

    return {
      message: 'Join request rejected.',
      match,
    };
  }

  async placePledge(matchId: string, userId: string, username: string, dto: PlacePledgeDto) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.hostUserId?.toString() === userId) {
      throw new BadRequestException('You cannot pledge on your own match');
    }

    if (dto.amountUsd < match.minimumStakeUsd) {
      throw new BadRequestException(`Minimum stake is $${match.minimumStakeUsd}`);
    }

    await this.walletService.debitUsd(userId, dto.amountUsd, `Pledge for ${match.title}`, {
      matchId,
    });

    const pledge = await this.pledgeModel.create({
      matchId: new Types.ObjectId(matchId),
      userId: new Types.ObjectId(userId),
      username,
      amountUsd: dto.amountUsd,
      status: 'placed',
    });

    match.prizePool += dto.amountUsd;
    await match.save();

    return {
      message: 'Pledge placed successfully',
      pledge,
      prizePool: match.prizePool,
    };
  }
}
