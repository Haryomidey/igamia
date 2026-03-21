import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type MiningSessionDocument = HydratedDocument<MiningSession>;

@Schema({ timestamps: true })
export class MiningSession {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  watchedSeconds: number;

  @Prop({ required: true })
  rewardIgc: number;

  @Prop({ required: true })
  videoUrl: string;
}

export const MiningSessionSchema = SchemaFactory.createForClass(MiningSession);