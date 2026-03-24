import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
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
import { SubmitResultClaimDto } from './dto/submit-result-claim.dto';
import { RespondResultClaimDto } from './dto/respond-result-claim.dto';
import { SendDisputeMessageDto } from './dto/send-dispute-message.dto';

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

  private objectId(value: string) {
    return new Types.ObjectId(value);
  }

  private async requireMatch(matchId: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  private getParticipant(match: MatchDocument, userId: string) {
    return match.participants.find((participant) => participant.userId.toString() === userId);
  }

  private ensureParticipant(match: MatchDocument, userId: string) {
    const participant = this.getParticipant(match, userId);
    if (!participant) {
      throw new ForbiddenException('Only pledge streamers can perform this action');
    }

    return participant;
  }

  private getOpponent(match: MatchDocument, userId: string) {
    return match.participants.find((participant) => participant.userId.toString() !== userId);
  }

  private buildAssistantReply(input: string) {
    const value = input.toLowerCase();

    if (value.includes('disconnect') || value.includes('lag')) {
      return 'Assistant: I logged this as a connection dispute. Share timestamps or a recording so support can review it faster.';
    }

    if (value.includes('cheat') || value.includes('hack')) {
      return 'Assistant: I tagged this as a fair-play dispute. Please explain exactly what happened and when it happened in the stream.';
    }

    if (value.includes('score') || value.includes('win')) {
      return 'Assistant: I tagged this as a score disagreement. Please describe the final score and which player should be credited.';
    }

    return 'Assistant: Your dispute message has been recorded. Both streamer statements and recordings can now be reviewed from this thread.';
  }

  private async settleMatch(match: MatchDocument, outcome: 'win' | 'loss' | 'draw', claimantUserId: string) {
    const pledges = await this.pledgeModel.find({ matchId: match._id });
    const participantIds = match.participants.map((participant) => participant.userId.toString());

    if (outcome === 'draw') {
      await Promise.all(
        pledges.map(async (pledge) => {
          pledge.status = 'refunded';
          await pledge.save();
          await this.walletService.creditUsd(
            pledge.userId.toString(),
            pledge.amountUsd,
            `Draw refund for ${match.title}`,
            { matchId: match.id },
          );
        }),
      );

      await Promise.all(
        participantIds.map((participantUserId) =>
          this.walletService.creditIgc(
            participantUserId,
            15,
            `Draw reward for ${match.title}`,
            { matchId: match.id, rewardType: 'pledge_draw' },
          ),
        ),
      );

      match.winnerUserId = undefined;
      match.loserUserId = undefined;
      match.isDraw = true;
      match.status = 'settled';
      match.settledAt = new Date();
      match.resultClaim = {
        ...match.resultClaim,
        status: 'approved',
        respondedAt: new Date(),
      } as any;
      await match.save();
      return;
    }

    const winnerUserId =
      outcome === 'win'
        ? claimantUserId
        : this.getOpponent(match, claimantUserId)?.userId.toString();

    if (!winnerUserId) {
      throw new BadRequestException('Opponent not found for settlement');
    }

    const loserUserId = participantIds.find((participantUserId) => participantUserId !== winnerUserId);
    if (!loserUserId) {
      throw new BadRequestException('Loser could not be determined');
    }

    await this.walletService.creditUsd(
      winnerUserId,
      match.prizePool,
      `Pledge winnings for ${match.title}`,
      { matchId: match.id },
    );

    await Promise.all(
      pledges.map(async (pledge) => {
        pledge.status = pledge.userId.toString() === winnerUserId ? 'won' : 'lost';
        await pledge.save();
      }),
    );

    await Promise.all([
      this.walletService.creditIgc(
        winnerUserId,
        50,
        `Win reward for ${match.title}`,
        { matchId: match.id, rewardType: 'pledge_win' },
      ),
      this.walletService.creditIgc(
        loserUserId,
        10,
        `Participation reward for ${match.title}`,
        { matchId: match.id, rewardType: 'pledge_participation' },
      ),
    ]);

    match.winnerUserId = this.objectId(winnerUserId);
    match.loserUserId = this.objectId(loserUserId);
    match.isDraw = false;
    match.status = 'settled';
    match.settledAt = new Date();
    match.resultClaim = {
      ...match.resultClaim,
      status: 'approved',
      respondedAt: new Date(),
    } as any;
    await match.save();
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
      gameId: this.objectId(dto.gameId),
      gameTitle: game.title,
      title: dto.title,
      hostUserId: this.objectId(userId),
      hostUsername: username,
      scheduledFor: new Date(dto.scheduledFor),
      minimumStakeUsd: dto.minimumStakeUsd ?? 10,
      maxPlayers: 2,
      participants: [{ userId: this.objectId(userId), username, joinedAt: new Date() }],
      pendingRequests: [],
      status: 'open',
      mode: 'duel',
      dispute: {
        open: false,
        reason: '',
        messages: [],
      },
    });
  }

  async joinMatch(matchId: string, userId: string, username: string, dto: RequestJoinMatchDto) {
    const match = await this.requireMatch(matchId);

    if (match.hostUserId?.toString() === userId) {
      throw new BadRequestException('You cannot join your own pledge');
    }

    if (match.status !== 'open') {
      throw new BadRequestException('This pledge is no longer accepting join requests');
    }

    if (dto.amountUsd < match.minimumStakeUsd) {
      throw new BadRequestException(`Minimum stake is $${match.minimumStakeUsd}`);
    }

    const alreadyJoined = match.participants.some(
      (participant) => participant.userId.toString() === userId,
    );
    if (alreadyJoined) {
      return match;
    }

    const alreadyRequested = match.pendingRequests.some(
      (request) => request.userId.toString() === userId,
    );
    if (alreadyRequested) {
      throw new BadRequestException('You have already requested to join this pledge');
    }

    if (match.participants.length >= 2) {
      throw new BadRequestException('Match is already full');
    }

    match.pendingRequests.push({
      userId: this.objectId(userId),
      username,
      amountUsd: dto.amountUsd,
      requestedAt: new Date(),
    } as any);
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

  async acceptJoinRequest(
    matchId: string,
    requestUserId: string,
    hostUserId: string,
    hostUsername: string,
  ) {
    const match = await this.requireMatch(matchId);

    if (match.hostUserId?.toString() !== hostUserId) {
      throw new BadRequestException('Only the pledge host can accept join requests');
    }

    const request = match.pendingRequests.find((item) => item.userId.toString() === requestUserId);
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (match.participants.length >= 2) {
      throw new BadRequestException('Match is already full');
    }

    const existingHostPledge = await this.pledgeModel.findOne({
      matchId: this.objectId(matchId),
      userId: match.hostUserId,
    });

    if (!match.hostUserId) {
      throw new BadRequestException('Match host is missing');
    }

    if (!existingHostPledge) {
      await this.walletService.debitUsd(
        hostUserId,
        match.minimumStakeUsd,
        `Pledge for ${match.title}`,
        { matchId, role: 'host' },
      );

      await this.pledgeModel.create({
        matchId: this.objectId(matchId),
        userId: match.hostUserId,
        username: match.hostUsername,
        amountUsd: match.minimumStakeUsd,
        status: 'placed',
      });

      match.prizePool += match.minimumStakeUsd;
    }

    await this.walletService.debitUsd(
      requestUserId,
      request.amountUsd,
      `Pledge for ${match.title}`,
      { matchId, role: 'challenger' },
    );

    await this.pledgeModel.create({
      matchId: this.objectId(matchId),
      userId: this.objectId(requestUserId),
      username: request.username,
      amountUsd: request.amountUsd,
      status: 'placed',
    });

    match.prizePool += request.amountUsd;
    match.pendingRequests = match.pendingRequests.filter(
      (item) => item.userId.toString() !== requestUserId,
    );
    match.participants.push({
      userId: this.objectId(requestUserId),
      username: request.username,
      joinedAt: new Date(),
    } as any);
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

    match.streamId = this.objectId(stream._id.toString());
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
    const match = await this.requireMatch(matchId);

    if (match.hostUserId?.toString() !== hostUserId) {
      throw new BadRequestException('Only the pledge host can reject join requests');
    }

    const request = match.pendingRequests.find((item) => item.userId.toString() === requestUserId);
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    match.pendingRequests = match.pendingRequests.filter(
      (item) => item.userId.toString() !== requestUserId,
    );
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
    const match = await this.requireMatch(matchId);
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
      matchId: this.objectId(matchId),
      userId: this.objectId(userId),
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

  async getMatch(matchId: string, userId: string) {
    const match = await this.requireMatch(matchId);
    this.ensureParticipant(match, userId);
    return match.toObject();
  }

  async submitResultClaim(
    matchId: string,
    userId: string,
    username: string,
    dto: SubmitResultClaimDto,
  ) {
    const match = await this.requireMatch(matchId);
    this.ensureParticipant(match, userId);

    if (match.participants.length !== 2) {
      throw new BadRequestException('Pledge result claims require exactly two streamers');
    }

    if (match.status === 'settled') {
      throw new BadRequestException('This pledge has already been settled');
    }

    if (dto.outcome === 'dispute') {
      match.status = 'disputed';
      match.resultClaim = null;
      match.dispute = {
        open: true,
        openedByUserId: this.objectId(userId),
        openedByUsername: username,
        reason: dto.note?.trim() || 'Result disputed by streamer',
        openedAt: new Date(),
        messages: [
          {
            senderUserId: this.objectId(userId),
            senderUsername: username,
            senderRole: 'streamer',
            message: dto.note?.trim() || 'I want to dispute this match result.',
            createdAt: new Date(),
          },
          {
            senderUsername: 'iGamia Assistant',
            senderRole: 'assistant',
            message: 'Assistant: Dispute opened. Share your evidence, scoreline, and the ruling you expect.',
            createdAt: new Date(),
          },
        ],
      } as any;
      await match.save();

      this.pledgesGateway.emitDisputeUpdated(
        match.participants.map((participant) => participant.userId.toString()),
        {
          matchId: match.id,
          title: match.title,
          message: dto.note?.trim() || 'A dispute was opened for this pledge.',
          senderUsername: username,
          senderRole: 'streamer',
        },
      );

      return {
        message: 'Dispute opened successfully',
        match: match.toObject(),
      };
    }

    match.resultClaim = {
      claimedByUserId: this.objectId(userId),
      claimedByUsername: username,
      outcome: dto.outcome,
      status: 'pending',
      note: dto.note?.trim() || '',
      createdAt: new Date(),
    } as any;
    match.status = 'awaiting_confirmation';
    await match.save();

    this.pledgesGateway.emitResultClaimed(
      match.participants.map((participant) => participant.userId.toString()),
      {
        matchId: match.id,
        title: match.title,
        claimedByUserId: userId,
        claimedByUsername: username,
        outcome: dto.outcome,
        note: dto.note?.trim() || '',
      },
    );

    return {
      message: 'Result claim submitted successfully',
      match: match.toObject(),
    };
  }

  async respondToResultClaim(
    matchId: string,
    userId: string,
    username: string,
    dto: RespondResultClaimDto,
  ) {
    const match = await this.requireMatch(matchId);
    this.ensureParticipant(match, userId);

    if (!match.resultClaim?.claimedByUserId || !match.resultClaim.outcome) {
      throw new BadRequestException('No active result claim found');
    }

    if (match.resultClaim.claimedByUserId.toString() === userId) {
      throw new BadRequestException('You cannot respond to your own result claim');
    }

    if (dto.decision === 'reject') {
      match.resultClaim.status = 'rejected';
      match.resultClaim.respondedAt = new Date();
      match.status = 'disputed';
      match.dispute = {
        open: true,
        openedByUserId: this.objectId(userId),
        openedByUsername: username,
        reason: match.resultClaim.note || 'Result claim rejected',
        openedAt: new Date(),
        messages: [
          {
            senderUserId: this.objectId(userId),
            senderUsername: username,
            senderRole: 'streamer',
            message: `I rejected ${match.resultClaim.claimedByUsername}'s ${match.resultClaim.outcome} claim.`,
            createdAt: new Date(),
          },
          {
            senderUsername: 'iGamia Assistant',
            senderRole: 'assistant',
            message: 'Assistant: The match is now in dispute. Both streamers can continue the case here.',
            createdAt: new Date(),
          },
        ],
      } as any;
      await match.save();

      this.pledgesGateway.emitResultResolved(
        match.participants.map((participant) => participant.userId.toString()),
        {
          matchId: match.id,
          title: match.title,
          decision: 'rejected',
          disputed: true,
        },
      );

      return {
        message: 'Result claim rejected. Match moved to dispute.',
        match: match.toObject(),
      };
    }

    await this.settleMatch(
      match,
      match.resultClaim.outcome,
      match.resultClaim.claimedByUserId.toString(),
    );
    const refreshedMatch = await this.requireMatch(matchId);

    this.pledgesGateway.emitResultResolved(
      refreshedMatch.participants.map((participant) => participant.userId.toString()),
      {
        matchId: refreshedMatch.id,
        title: refreshedMatch.title,
        decision: 'approved',
        winnerUserId: refreshedMatch.winnerUserId?.toString(),
        loserUserId: refreshedMatch.loserUserId?.toString(),
        isDraw: refreshedMatch.isDraw,
      },
    );

    return {
      message: 'Result claim approved and match settled.',
      match: refreshedMatch.toObject(),
    };
  }

  async getDispute(matchId: string, userId: string) {
    const match = await this.requireMatch(matchId);
    this.ensureParticipant(match, userId);

    if (!match.dispute?.open) {
      throw new BadRequestException('No active dispute found for this match');
    }

    return {
      match: match.toObject(),
      dispute: match.dispute,
    };
  }

  async sendDisputeMessage(
    matchId: string,
    userId: string,
    username: string,
    dto: SendDisputeMessageDto,
  ) {
    const match = await this.requireMatch(matchId);
    this.ensureParticipant(match, userId);

    if (!match.dispute?.open) {
      throw new BadRequestException('No active dispute found for this match');
    }

    match.dispute.messages.push({
      senderUserId: this.objectId(userId),
      senderUsername: username,
      senderRole: 'streamer',
      message: dto.message.trim(),
      createdAt: new Date(),
    } as any);

    const assistantReply = this.buildAssistantReply(dto.message);
    match.dispute.messages.push({
      senderUsername: 'iGamia Assistant',
      senderRole: 'assistant',
      message: assistantReply,
      createdAt: new Date(),
    } as any);

    await match.save();

    const participantIds = match.participants.map((participant) => participant.userId.toString());
    this.pledgesGateway.emitDisputeUpdated(participantIds, {
      matchId: match.id,
      title: match.title,
      message: dto.message.trim(),
      senderUsername: username,
      senderRole: 'streamer',
    });
    this.pledgesGateway.emitDisputeUpdated(participantIds, {
      matchId: match.id,
      title: match.title,
      message: assistantReply,
      senderUsername: 'iGamia Assistant',
      senderRole: 'assistant',
    });

    return {
      message: 'Dispute messages updated',
      dispute: match.dispute,
    };
  }

  async getLeaderboard() {
    const settledMatches = await this.matchModel.find({ status: 'settled' }).lean();
    const liveStreams = await this.matchModel.db.collection('streams').find({}).toArray();
    const users = await this.matchModel.db.collection('users').find({}).toArray();

    const streamCountByUser = liveStreams.reduce<Record<string, number>>((acc, stream: any) => {
      const hostUserId = stream.hostUserId?.toString?.() ?? String(stream.hostUserId ?? '');
      if (hostUserId) {
        acc[hostUserId] = (acc[hostUserId] ?? 0) + 1;
      }
      return acc;
    }, {});

    const stats = new Map<
      string,
      {
        userId: string;
        username: string;
        avatarUrl: string;
        wins: number;
        losses: number;
        draws: number;
        matches: number;
        winRate: number;
        streamsHosted: number;
        rankPoints: number;
        medals: string[];
        achievements: string[];
      }
    >();

    users.forEach((user: any) => {
      stats.set(String(user._id), {
        userId: String(user._id),
        username: user.username,
        avatarUrl: user.avatarUrl || '',
        wins: 0,
        losses: 0,
        draws: 0,
        matches: 0,
        winRate: 0,
        streamsHosted: streamCountByUser[String(user._id)] ?? 0,
        rankPoints: 0,
        medals: [],
        achievements: [],
      });
    });

    settledMatches.forEach((match) => {
      match.participants.forEach((participant) => {
        const entry = stats.get(participant.userId.toString());
        if (!entry) {
          return;
        }

        entry.matches += 1;
        if (match.isDraw) {
          entry.draws += 1;
        } else if (match.winnerUserId?.toString() === participant.userId.toString()) {
          entry.wins += 1;
        } else {
          entry.losses += 1;
        }
      });
    });

    const rows = Array.from(stats.values()).map((entry) => {
      entry.winRate = entry.matches ? Number(((entry.wins / entry.matches) * 100).toFixed(1)) : 0;
      entry.rankPoints = entry.wins * 12 + entry.draws * 4 + entry.streamsHosted * 2;

      if (entry.wins >= 10) entry.medals.push('Pledge Gold');
      if (entry.streamsHosted >= 10) entry.medals.push('Streaming Medal');
      if (entry.winRate >= 70 && entry.matches >= 5) entry.medals.push('Win Rate Medal');

      if (entry.streamsHosted >= 5) entry.achievements.push('Streaming Pro');
      if (entry.matches >= 3) entry.achievements.push('Challenger');
      if (entry.wins >= 5) entry.achievements.push('Duel Finisher');
      if (entry.draws >= 2) entry.achievements.push('Peace Maker');
      if (entry.winRate >= 80 && entry.matches >= 5) entry.achievements.push('Hot Streak');

      return entry;
    });

    return rows
      .filter((entry) => entry.matches > 0 || entry.streamsHosted > 0)
      .sort((left, right) => right.winRate - left.winRate || right.rankPoints - left.rankPoints)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }

  async getUserCompetitiveProfile(userId: string) {
    const leaderboard = await this.getLeaderboard();
    return (
      leaderboard.find((item) => item.userId === userId) ?? {
        userId,
        username: '',
        avatarUrl: '',
        wins: 0,
        losses: 0,
        draws: 0,
        matches: 0,
        winRate: 0,
        streamsHosted: 0,
        rankPoints: 0,
        medals: [],
        achievements: [],
        rank: null,
      }
    );
  }
}
