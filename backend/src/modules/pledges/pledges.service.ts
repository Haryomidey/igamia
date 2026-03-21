import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GamesService } from '../games/games.service';
import { Match, MatchDocument } from './schemas/match.schema';
import { Pledge, PledgeDocument } from './schemas/pledge.schema';
import { CreateMatchDto } from './dto/create-match.dto';
import { PlacePledgeDto } from './dto/place-pledge.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PledgesService implements OnModuleInit {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
    @InjectModel(Pledge.name) private readonly pledgeModel: Model<PledgeDocument>,
    private readonly gamesService: GamesService,
    private readonly walletService: WalletService,
  ) {}

  async onModuleInit() {
    const count = await this.matchModel.estimatedDocumentCount();
    if (count > 0) {
      return;
    }

    const games = await this.gamesService.getGamesForSeeding();
    if (games.length === 0) {
      return;
    }

    await this.matchModel.insertMany(
      games.slice(0, 4).map((game, index) => ({
        gameId: game._id,
        gameTitle: game.title,
        title: `${game.title} Co-op Showdown`,
        scheduledFor: new Date(Date.now() + (index + 1) * 4 * 60 * 60 * 1000),
        prizePool: 5000 + index * 2500,
        minimumStakeUsd: 10 + index * 5,
        maxPlayers: 3,
        status: 'open',
        participants: [],
        mode: 'co-op',
        hostUsername: 'iGamia Arena',
      })),
    );
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
      status: 'open',
      mode: 'co-op',
    });
  }

  async joinMatch(matchId: string, userId: string, username: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const alreadyJoined = match.participants.some((participant) => participant.userId.toString() === userId);
    if (alreadyJoined) {
      return match;
    }

    if (match.participants.length >= match.maxPlayers) {
      throw new BadRequestException('Match is already full');
    }

    match.participants.push({ userId: new Types.ObjectId(userId), username, joinedAt: new Date() });
    await match.save();
    return match;
  }

  async placePledge(matchId: string, userId: string, username: string, dto: PlacePledgeDto) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
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
