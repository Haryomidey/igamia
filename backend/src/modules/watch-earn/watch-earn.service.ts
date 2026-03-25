import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WalletService } from '../wallet/wallet.service';
import { WatchVideo, WatchVideoDocument } from './schemas/watch-video.schema';
import {
  WatchVideoCompletion,
  WatchVideoCompletionDocument,
} from './schemas/watch-video-completion.schema';
import {
  WatchVideoProgress,
  WatchVideoProgressDocument,
} from './schemas/watch-video-progress.schema';

type WatchEarnVideoView = {
  _id: unknown;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  rewardIgc: number;
  durationSeconds: number;
  active: boolean;
  daySlot: number;
  completed: boolean;
  unlocked: boolean;
  availableNow: boolean;
  availableAt: string | null;
  startedWatching: boolean;
  watchStartedAt: string | null;
  eligibleToClaimAt: string | null;
};

type WatchEarnTodayResponse = {
  dayKey: string;
  totalVideosPerDay: number;
  completedCount: number;
  totalEarnedIgc: number;
  waitIntervalMinutes: number;
  nextVideoAvailableAt: string | null;
  canWatchNow: boolean;
  serverTime: string;
  videos: WatchEarnVideoView[];
};

@Injectable()
export class WatchEarnService implements OnModuleInit {
  private readonly defaultVideos = [
    {
      title: 'Streamer Highlights Daily Drop',
      description: 'Watch featured stream clips and claim your first reward.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnailUrl: 'https://picsum.photos/seed/watch-earn-1/800/450',
      rewardIgc: 20,
      durationSeconds: 15,
      daySlot: 1,
    },
    {
      title: 'Tournament Recap Bonus Reel',
      description: 'Catch the best moments from top iGamia tournaments.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnailUrl: 'https://picsum.photos/seed/watch-earn-2/800/450',
      rewardIgc: 20,
      durationSeconds: 15,
      daySlot: 2,
    },
    {
      title: 'Creator Spotlight Reward Video',
      description: 'Support creators and earn your final reward for the day.',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnailUrl: 'https://picsum.photos/seed/watch-earn-3/800/450',
      rewardIgc: 20,
      durationSeconds: 15,
      daySlot: 3,
    },
  ];

  constructor(
    @InjectModel(WatchVideo.name) private readonly watchVideoModel: Model<WatchVideoDocument>,
    @InjectModel(WatchVideoCompletion.name)
    private readonly watchVideoCompletionModel: Model<WatchVideoCompletionDocument>,
    @InjectModel(WatchVideoProgress.name)
    private readonly watchVideoProgressModel: Model<WatchVideoProgressDocument>,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  private readonly totalVideosPerDay = 3;

  private getWaitIntervalMs() {
    const rawMinutes = Number(this.configService.get('WATCH_EARN_WAIT_MINUTES', '180'));
    const safeMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 180;
    return safeMinutes * 60 * 1000;
  }

  async onModuleInit() {
    const todayKey = this.getTodayKey();
    const todaysDefaults = await this.watchVideoModel.find({
      availableOnKey: todayKey,
      title: { $in: this.defaultVideos.map((video) => video.title) },
    });

    if (todaysDefaults.length) {
      await Promise.all(
        todaysDefaults.map((video) => {
          const matchingDefault = this.defaultVideos.find((item) => item.title === video.title);
          if (!matchingDefault) {
            return Promise.resolve(video);
          }

          video.description = matchingDefault.description;
          video.videoUrl = matchingDefault.videoUrl;
          video.thumbnailUrl = matchingDefault.thumbnailUrl;
          video.rewardIgc = matchingDefault.rewardIgc;
          video.durationSeconds = matchingDefault.durationSeconds;
          video.daySlot = matchingDefault.daySlot;
          video.availableOnKey = todayKey;
          return video.save();
        }),
      );
    }

    const todaysCount = await this.watchVideoModel.countDocuments({
      active: true,
      availableOnKey: todayKey,
    });

    if (todaysCount >= this.totalVideosPerDay) {
      return;
    }

    const legacyVideos = await this.watchVideoModel
      .find({
        active: true,
        $or: [{ availableOnKey: { $exists: false } }, { availableOnKey: null }],
      })
      .sort({ daySlot: 1, createdAt: 1 })
      .limit(this.totalVideosPerDay);

    if (legacyVideos.length) {
      await Promise.all(
        legacyVideos.map((video, index) => {
          video.availableOnKey = todayKey;
          video.daySlot = index + 1;
          return video.save();
        }),
      );
      return;
    }

    const totalCount = await this.watchVideoModel.estimatedDocumentCount();
    if (totalCount > 0) {
      return;
    }

    await this.watchVideoModel.insertMany(
      this.defaultVideos.map((video) => ({
        ...video,
        availableOnKey: todayKey,
      })),
    );
  }

  private getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  async getTodayVideos(userId: string): Promise<WatchEarnTodayResponse> {
    const watchedOnKey = this.getTodayKey();
    const now = new Date();
    const [fetchedVideos, completions, progressEntries] = await Promise.all([
      this.watchVideoModel
        .find({ active: true, availableOnKey: watchedOnKey })
        .sort({ daySlot: 1 })
        .limit(this.totalVideosPerDay)
        .lean(),
      this.watchVideoCompletionModel.find({
        userId: new Types.ObjectId(userId),
        watchedOnKey,
      })
        .sort({ createdAt: 1 })
        .lean(),
      this.watchVideoProgressModel.find({
        userId: new Types.ObjectId(userId),
        watchedOnKey,
      }).lean(),
    ]);
    const videos = fetchedVideos.length === this.totalVideosPerDay ? fetchedVideos : [];

    const waitIntervalMs = this.getWaitIntervalMs();
    const completedIds = new Set(completions.map((completion) => completion.videoId.toString()));
    const progressByVideoId = new Map(progressEntries.map((entry) => [entry.videoId.toString(), entry]));
    const completionCount = completions.length;
    const totalVideosPerDay = videos.length;
    const lastCompletion = completions.at(-1);
    const nextVideoAvailableAt =
      completionCount > 0 && completionCount < totalVideosPerDay && lastCompletion?.createdAt
        ? new Date(new Date(lastCompletion.createdAt).getTime() + waitIntervalMs)
        : null;
    const canWatchNow =
      totalVideosPerDay > 0 &&
      completionCount < totalVideosPerDay &&
      (completionCount === 0 || !nextVideoAvailableAt || nextVideoAvailableAt.getTime() <= now.getTime());
    const nextUnlockedSlot =
      completionCount >= totalVideosPerDay || totalVideosPerDay === 0
        ? null
        : Math.min(completionCount + 1, totalVideosPerDay);

    return {
      dayKey: watchedOnKey,
      totalVideosPerDay,
      completedCount: completionCount,
      totalEarnedIgc: completions.reduce((sum, completion) => sum + completion.rewardIgc, 0),
      waitIntervalMinutes: Math.round(waitIntervalMs / 60000),
      nextVideoAvailableAt: !canWatchNow && nextVideoAvailableAt ? nextVideoAvailableAt.toISOString() : null,
      canWatchNow,
      serverTime: now.toISOString(),
      videos: videos.map((video) => ({
        ...video,
        completed: completedIds.has(video._id.toString()),
        unlocked: video.daySlot <= completionCount || video.daySlot === nextUnlockedSlot,
        availableNow: completedIds.has(video._id.toString())
          ? true
          : Boolean(video.daySlot === nextUnlockedSlot && canWatchNow),
        availableAt:
          completedIds.has(video._id.toString()) || video.daySlot < (nextUnlockedSlot ?? 0)
            ? now.toISOString()
            : video.daySlot === nextUnlockedSlot
              ? canWatchNow
                ? now.toISOString()
                : nextVideoAvailableAt?.toISOString() ?? null
              : null,
        startedWatching: progressByVideoId.has(video._id.toString()),
        watchStartedAt: progressByVideoId.get(video._id.toString())?.startedAt?.toISOString() ?? null,
        eligibleToClaimAt: progressByVideoId.get(video._id.toString())?.eligibleAt?.toISOString() ?? null,
      })) as WatchEarnVideoView[],
    };
  }

  async startVideo(userId: string, videoId: string) {
    const watchedOnKey = this.getTodayKey();
    const [video, todaysCompletions, orderedVideos, existingCompletion, existingProgress] = await Promise.all([
      this.watchVideoModel.findById(videoId),
      this.watchVideoCompletionModel
        .find({
          userId: new Types.ObjectId(userId),
          watchedOnKey,
        })
        .sort({ createdAt: 1 }),
      this.watchVideoModel
        .find({ active: true, availableOnKey: watchedOnKey })
        .sort({ daySlot: 1 })
        .limit(this.totalVideosPerDay)
        .lean(),
      this.watchVideoCompletionModel.findOne({
        userId: new Types.ObjectId(userId),
        videoId: new Types.ObjectId(videoId),
        watchedOnKey,
      }),
      this.watchVideoProgressModel.findOne({
        userId: new Types.ObjectId(userId),
        videoId: new Types.ObjectId(videoId),
        watchedOnKey,
      }),
    ]);

    if (!video || !video.active) {
      throw new NotFoundException('Watch-to-earn video not found');
    }

    if (orderedVideos.length !== this.totalVideosPerDay) {
      throw new BadRequestException('There are no reward videos scheduled for today');
    }

    if (existingCompletion) {
      throw new BadRequestException('You have already earned from this video today');
    }

    const completionCount = todaysCompletions.length;
    const expectedNextVideo = orderedVideos[completionCount];
    if (!expectedNextVideo || expectedNextVideo._id.toString() !== videoId) {
      throw new BadRequestException('This video is not unlocked yet');
    }

    const lastCompletion = todaysCompletions.at(-1);
    const waitIntervalMs = this.getWaitIntervalMs();
    if (lastCompletion?.createdAt) {
      const nextAvailableAt = new Date(new Date(lastCompletion.createdAt).getTime() + waitIntervalMs);
      if (nextAvailableAt.getTime() > Date.now()) {
        throw new BadRequestException(
          `The next reward video unlocks at ${nextAvailableAt.toISOString()}`,
        );
      }
    }

    if (existingProgress) {
      return {
        message: 'Watch session already active',
        startedAt: existingProgress.startedAt.toISOString(),
        eligibleAt: existingProgress.eligibleAt.toISOString(),
        durationSeconds: video.durationSeconds,
      };
    }

    const startedAt = new Date();
    const requiredWatchMs = Math.max(video.durationSeconds, 5) * 1000;
    const eligibleAt = new Date(startedAt.getTime() + requiredWatchMs);

    const progress = await this.watchVideoProgressModel.create({
      userId: new Types.ObjectId(userId),
      videoId: new Types.ObjectId(videoId),
      watchedOnKey,
      startedAt,
      eligibleAt,
    });

    return {
      message: 'Watch session started',
      startedAt: progress.startedAt.toISOString(),
      eligibleAt: progress.eligibleAt.toISOString(),
      durationSeconds: video.durationSeconds,
    };
  }

  async completeVideo(userId: string, videoId: string) {
    const watchedOnKey = this.getTodayKey();
    const [video, todaysCompletions, orderedVideos, watchProgress] = await Promise.all([
      this.watchVideoModel.findById(videoId),
      this.watchVideoCompletionModel
        .find({
          userId: new Types.ObjectId(userId),
          watchedOnKey,
        })
        .sort({ createdAt: 1 }),
      this.watchVideoModel
        .find({ active: true, availableOnKey: watchedOnKey })
        .sort({ daySlot: 1 })
        .limit(this.totalVideosPerDay)
        .lean(),
      this.watchVideoProgressModel.findOne({
        userId: new Types.ObjectId(userId),
        videoId: new Types.ObjectId(videoId),
        watchedOnKey,
      }),
    ]);

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

    const completionCount = todaysCompletions.length;

    if (orderedVideos.length !== this.totalVideosPerDay) {
      throw new BadRequestException('There are no reward videos scheduled for today');
    }

    if (completionCount >= orderedVideos.length) {
      throw new BadRequestException('You have completed all available watch-to-earn videos today');
    }

    const expectedNextVideo = orderedVideos[completionCount];
    if (!expectedNextVideo || expectedNextVideo._id.toString() !== videoId) {
      throw new BadRequestException('This video is not unlocked yet');
    }

    const lastCompletion = todaysCompletions.at(-1);
    const waitIntervalMs = this.getWaitIntervalMs();
    if (lastCompletion?.createdAt) {
      const nextAvailableAt = new Date(new Date(lastCompletion.createdAt).getTime() + waitIntervalMs);
      if (nextAvailableAt.getTime() > Date.now()) {
        throw new BadRequestException(
          `The next reward video unlocks at ${nextAvailableAt.toISOString()}`,
        );
      }
    }

    if (!watchProgress) {
      throw new BadRequestException('Start and watch the video before claiming the reward');
    }

    if (watchProgress.eligibleAt.getTime() > Date.now()) {
      throw new BadRequestException('Finish watching the video before claiming the reward');
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

    await this.watchVideoProgressModel.deleteOne({ _id: watchProgress._id });

    return {
      message: 'Watch-to-earn reward credited',
      rewardIgc: video.rewardIgc,
      completion,
    };
  }
}