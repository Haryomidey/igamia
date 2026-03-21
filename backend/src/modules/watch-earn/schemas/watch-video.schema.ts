import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WatchVideoDocument = HydratedDocument<WatchVideo>;

@Schema({ timestamps: true })
export class WatchVideo {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  videoUrl!: string;

  @Prop({ required: true })
  thumbnailUrl!: string;

  @Prop({ required: true })
  rewardIgc!: number;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ required: true })
  daySlot!: number;
}

export const WatchVideoSchema = SchemaFactory.createForClass(WatchVideo);
