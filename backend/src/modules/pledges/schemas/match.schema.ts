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

@Schema({ _id: false })
class MatchResultClaim {
  @Prop({ type: Types.ObjectId, ref: User.name })
  claimedByUserId?: Types.ObjectId;

  @Prop()
  claimedByUsername?: string;

  @Prop({ enum: ['win', 'loss', 'draw'] })
  outcome?: 'win' | 'loss' | 'draw';

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status?: 'pending' | 'approved' | 'rejected';

  @Prop({ default: '' })
  note?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  respondedAt?: Date;
}

@Schema({ _id: false })
class DisputeMessage {
  @Prop({ type: Types.ObjectId, ref: User.name })
  senderUserId?: Types.ObjectId;

  @Prop({ required: true })
  senderUsername!: string;

  @Prop({ required: true, enum: ['streamer', 'assistant'] })
  senderRole!: 'streamer' | 'assistant';

  @Prop({ required: true })
  message!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

@Schema({ _id: false })
class MatchDispute {
  @Prop({ default: false })
  open!: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name })
  openedByUserId?: Types.ObjectId;

  @Prop()
  openedByUsername?: string;

  @Prop({ default: '' })
  reason!: string;

  @Prop()
  openedAt?: Date;

  @Prop({ type: [DisputeMessage], default: [] })
  messages!: DisputeMessage[];
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

  @Prop({ default: 2, max: 2 })
  maxPlayers!: number;

  @Prop({
    default: 'open',
    enum: ['open', 'live', 'awaiting_confirmation', 'disputed', 'settled'],
  })
  status!: 'open' | 'live' | 'awaiting_confirmation' | 'disputed' | 'settled';

  @Prop({ type: [MatchParticipant], default: [] })
  participants!: MatchParticipant[];

  @Prop({ type: [MatchJoinRequest], default: [] })
  pendingRequests!: MatchJoinRequest[];

  @Prop({ type: Types.ObjectId })
  streamId?: Types.ObjectId;

  @Prop({ default: 'duel' })
  mode!: string;

  @Prop({ type: MatchResultClaim, default: null })
  resultClaim?: MatchResultClaim | null;

  @Prop({ type: Types.ObjectId, ref: User.name })
  winnerUserId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  loserUserId?: Types.ObjectId;

  @Prop({ default: false })
  isDraw!: boolean;

  @Prop()
  settledAt?: Date;

  @Prop({
    type: MatchDispute,
    default: () => ({
      open: false,
      reason: '',
      messages: [],
    }),
  })
  dispute!: MatchDispute;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
