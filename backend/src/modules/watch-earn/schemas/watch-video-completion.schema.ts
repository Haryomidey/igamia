import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { WatchVideo } from './watch-video.schema';

export type WatchVideoCompletionDocument = HydratedDocument<WatchVideoCompletion>;

@Schema({ timestamps: true })
export class WatchVideoCompletion {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: WatchVideo.name, required: true })
  videoId!: Types.ObjectId;

  @Prop({ required: true })
  watchedOnKey!: string;

  @Prop({ required: true })
  rewardIgc!: number;
}

export const WatchVideoCompletionSchema =
  SchemaFactory.createForClass(WatchVideoCompletion);
