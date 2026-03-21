import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MiningSession, MiningSessionDocument } from './schemas/mining-session.schema';
import { WalletService } from '../wallet/wallet.service';
import { CompleteMiningDto } from './dto/complete-mining.dto';

@Injectable()
export class MiningService {
  constructor(
    @InjectModel(MiningSession.name)
    private readonly miningSessionModel: Model<MiningSessionDocument>,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  async getStatus(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sessions = await this.miningSessionModel.find({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: startOfDay },
    });

    const minedToday = sessions.reduce(
      (sum: number, session: MiningSessionDocument) => sum + session.rewardIgc,
      0,
    );

    return {
      minedToday,
      dailyLimitIgc: Number(this.configService.get('MINING_DAILY_LIMIT_IGC', '500')),
      adIntervalMinutes: Number(this.configService.get('MINING_AD_INTERVAL_MINUTES', '15')),
      requiredWatchSeconds: Number(
        this.configService.get('MINING_WATCH_DURATION_SECONDS', '30'),
      ),
      defaultVideoUrl: this.configService.get<string>('MINING_DEFAULT_VIDEO_URL'),
      sessions,
    };
  }

  async completeWatch(userId: string, dto: CompleteMiningDto) {
    const dailyLimit = Number(this.configService.get('MINING_DAILY_LIMIT_IGC', '500'));
    const requiredWatchSeconds = Number(
      this.configService.get('MINING_WATCH_DURATION_SECONDS', '30'),
    );
    const rewardIgc = Number(this.configService.get('STREAM_WATCH_REWARD_IGC', '10'));

    if (dto.watchedSeconds < requiredWatchSeconds) {
      throw new BadRequestException('Watch duration is below reward threshold');
    }

    const status = await this.getStatus(userId);
    if (status.minedToday + rewardIgc > dailyLimit) {
      throw new BadRequestException('Daily mining limit reached');
    }

    const session = await this.miningSessionModel.create({
      userId: new Types.ObjectId(userId),
      watchedSeconds: dto.watchedSeconds,
      rewardIgc,
      videoUrl:
        dto.videoUrl ?? this.configService.get<string>('MINING_DEFAULT_VIDEO_URL', ''),
    });

    await this.walletService.creditIgc(
      userId,
      rewardIgc,
      'Mining reward credited',
      { sessionId: session.id },
    );

    return {
      message: 'Mining reward credited',
      rewardIgc,
      session,
    };
  }
}
