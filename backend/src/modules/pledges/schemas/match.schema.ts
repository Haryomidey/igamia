import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Game } from '../../games/schemas/game.schema';

export type MatchDocument = HydratedDocument<Match>;

@Schema({ _id: false })
class MatchParticipant {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  username!: string;

  @Prop({ default: Date.now })
  joinedAt!: Date;
}

@Schema({ _id: false })
class MatchJoinRequest {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  username!: string;

  @Prop({ required: true })
  amountUsd!: number;

  @Prop({ default: Date.now })
  requestedAt!: Date;
}

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: Types.ObjectId, ref: Game.name, required: true })
  gameId!: Types.ObjectId;

  @Prop({ required: true })
  gameTitle!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  hostUserId?: Types.ObjectId;

  @Prop({ default: 'system' })
  hostUsername!: string;

  @Prop({ required: true })
  scheduledFor!: Date;

  @Prop({ default: 0 })
  prizePool!: number;

  @Prop({ default: 10 })
  minimumStakeUsd!: number;

  @Prop({ default: 3 })
  maxPlayers!: number;

  @Prop({ default: 'open', enum: ['open', 'live', 'closed', 'settled'] })
  status!: 'open' | 'live' | 'closed' | 'settled';

  @Prop({ type: [MatchParticipant], default: [] })
  participants!: MatchParticipant[];

  @Prop({ type: [MatchJoinRequest], default: [] })
  pendingRequests!: MatchJoinRequest[];

  @Prop({ type: Types.ObjectId })
  streamId?: Types.ObjectId;

  @Prop({ default: 'co-op' })
  mode!: string;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
