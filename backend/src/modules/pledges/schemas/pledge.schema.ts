import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Match } from './match.schema';
import { User } from '../../users/schemas/user.schema';

export type PledgeDocument = HydratedDocument<Pledge>;

@Schema({ timestamps: true })
export class Pledge {
  @Prop({ type: Types.ObjectId, ref: Match.name, required: true })
  matchId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  username!: string;

  @Prop({ required: true })
  amountUsd!: number;

  @Prop({ default: 'placed', enum: ['placed', 'won', 'lost', 'refunded'] })
  status!: 'placed' | 'won' | 'lost' | 'refunded';
}

export const PledgeSchema = SchemaFactory.createForClass(Pledge);
