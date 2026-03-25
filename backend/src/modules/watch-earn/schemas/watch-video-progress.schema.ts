import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { WatchVideo } from './watch-video.schema';

export type WatchVideoProgressDocument = HydratedDocument<WatchVideoProgress>;

@Schema({ timestamps: true })
export class WatchVideoProgress {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: WatchVideo.name, required: true })
  videoId!: Types.ObjectId;

  @Prop({ required: true })
  watchedOnKey!: string;

  @Prop({ required: true })
  startedAt!: Date;

  @Prop({ required: true })
  eligibleAt!: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const WatchVideoProgressSchema = SchemaFactory.createForClass(WatchVideoProgress);
