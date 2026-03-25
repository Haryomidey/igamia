import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WatchEarnService } from './watch-earn.service';
import { WatchEarnController } from './watch-earn.controller';
import { WatchVideo, WatchVideoSchema } from './schemas/watch-video.schema';
import {
  WatchVideoCompletion,
  WatchVideoCompletionSchema,
} from './schemas/watch-video-completion.schema';
import {
  WatchVideoProgress,
  WatchVideoProgressSchema,
} from './schemas/watch-video-progress.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WatchVideo.name, schema: WatchVideoSchema },
      { name: WatchVideoCompletion.name, schema: WatchVideoCompletionSchema },
      { name: WatchVideoProgress.name, schema: WatchVideoProgressSchema },
    ]),
    WalletModule,
  ],
  controllers: [WatchEarnController],
  providers: [WatchEarnService],
})
export class WatchEarnModule {}
