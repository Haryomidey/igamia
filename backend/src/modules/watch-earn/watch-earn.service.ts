import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WalletService } from '../wallet/wallet.service';
import { WatchVideo, WatchVideoDocument } from './schemas/watch-video.schema';
import {
  WatchVideoCompletion,
  WatchVideoCompletionDocument,
} from './schemas/watch-video-completion.schema';

type WatchEarnVideoView = {
  _id: unknown;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  rewardIgc: number;
  active: boolean;
  daySlot: number;
  completed: boolean;
};

type WatchEarnTodayResponse = {
  dayKey: string;
  totalVideosPerDay: number;
  completedCount: number;
  totalEarnedIgc: number;
  videos: WatchEarnVideoView[];
};

@Injectable()
export class WatchEarnService implements OnModuleInit {
  constructor(
    @InjectModel(WatchVideo.name) private readonly watchVideoModel: Model<WatchVideoDocument>,
    @InjectModel(WatchVideoCompletion.name)
    private readonly watchVideoCompletionModel: Model<WatchVideoCompletionDocument>,
    private readonly walletService: WalletService,
  ) {}

  async onModuleInit() {
    const count = await this.watchVideoModel.estimatedDocumentCount();
    if (count > 0) {
      return;
    }

    await this.watchVideoModel.insertMany([
      {
        title: 'Streamer Highlights Daily Drop',
        description: 'Watch featured stream clips and claim your first reward.',
        videoUrl: 'https://example.com/videos/watch-earn-1.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/watch-earn-1/800/450',
        rewardIgc: 20,
        daySlot: 1,
      },
      {
        title: 'Tournament Recap Bonus Reel',
        description: 'Catch the best moments from top iGamia tournaments.',
        videoUrl: 'https://example.com/videos/watch-earn-2.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/watch-earn-2/800/450',
        rewardIgc: 20,
        daySlot: 2,
      },
      {
        title: 'Creator Spotlight Reward Video',
        description: 'Support creators and earn your final reward for the day.',
        videoUrl: 'https://example.com/videos/watch-earn-3.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/watch-earn-3/800/450',
        rewardIgc: 20,
        daySlot: 3,
      },
    ]);
  }

  private getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  async getTodayVideos(userId: string): Promise<WatchEarnTodayResponse> {
    const watchedOnKey = this.getTodayKey();
    const [videos, completions] = await Promise.all([
      this.watchVideoModel.find({ active: true }).sort({ daySlot: 1 }).limit(3).lean(),
      this.watchVideoCompletionModel.find({
        userId: new Types.ObjectId(userId),
        watchedOnKey,
      }).lean(),
    ]);

    const completedIds = new Set(completions.map((completion) => completion.videoId.toString()));

    return {
      dayKey: watchedOnKey,
      totalVideosPerDay: 3,
      completedCount: completions.length,
      totalEarnedIgc: completions.reduce((sum, completion) => sum + completion.rewardIgc, 0),
      videos: videos.map((video) => ({
        ...video,
        completed: completedIds.has(video._id.toString()),
      })) as WatchEarnVideoView[],
    };
  }

  async completeVideo(userId: string, videoId: string) {
    const watchedOnKey = this.getTodayKey();
    const video = await this.watchVideoModel.findById(videoId);

    if (!video || !video.active) {
      throw new NotFoundException('Watch-to-earn video not found');
    }

    const existingCompletion = await this.watchVideoCompletionModel.findOne({
      userId: new Types.ObjectId(userId),
      videoId: new Types.ObjectId(videoId),
      watchedOnKey,
    });

    if (existingCompletion) {
      throw new BadRequestException('You have already earned from this video today');
    }

    const completionCount = await this.watchVideoCompletionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      watchedOnKey,
    });

    if (completionCount >= 3) {
      throw new BadRequestException('You have completed all available watch-to-earn videos today');
    }

    const completion = await this.watchVideoCompletionModel.create({
      userId: new Types.ObjectId(userId),
      videoId: new Types.ObjectId(videoId),
      watchedOnKey,
      rewardIgc: video.rewardIgc,
    });

    await this.walletService.creditIgc(
      userId,
      video.rewardIgc,
      `Watch & earn reward for ${video.title}`,
      { videoId: video.id, completionId: completion.id },
    );

    return {
      message: 'Watch-to-earn reward credited',
      rewardIgc: video.rewardIgc,
      completion,
    };
  }
}
