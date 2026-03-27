import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Match } from '../../pledges/schemas/match.schema';

export type StreamDocument = HydratedDocument<Stream>;

@Schema({ _id: false })
class StreamParticipant {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['host', 'guest', 'invited'] })
  role: 'host' | 'guest' | 'invited';

  @Prop({ required: true })
  username: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

@Schema({ _id: false })
class StreamJoinRequest {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: Date.now })
  requestedAt: Date;
}

@Schema({ timestamps: true })
export class Stream {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  hostUserId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'General' })
  category: string;

  @Prop({ default: 'normal', enum: ['normal', 'pledge'] })
  mode: 'normal' | 'pledge';

  @Prop({ default: 'vertical', enum: ['vertical', 'horizontal', 'pip', 'screen-only'] })
  orientation: 'vertical' | 'horizontal' | 'pip' | 'screen-only';

  @Prop({ type: Types.ObjectId, ref: Match.name })
  matchId?: Types.ObjectId;

  @Prop({ default: 'live', enum: ['live', 'ended'] })
  status: 'live' | 'ended';

  @Prop({ type: [StreamParticipant], default: [] })
  participants: StreamParticipant[];

  @Prop({ type: [StreamJoinRequest], default: [] })
  joinRequests: StreamJoinRequest[];

  @Prop({ type: [Types.ObjectId], default: [] })
  blockedUserIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  removedParticipantUserIds: Types.ObjectId[];

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  sharesCount: number;

  @Prop({ default: 0 })
  viewersCount: number;

  @Prop({ default: 0 })
  earningsUsd: number;

  @Prop()
  endedAt?: Date;

  @Prop({ default: '' })
  recordingUrl: string;

  @Prop()
  recordedAt?: Date;

  @Prop({ default: 0 })
  recordingDurationSeconds: number;

  @Prop({ default: '' })
  shareUrl: string;

  @Prop()
  roomName?: string;

  @Prop({ default: '' })
  livekitRoomName: string;
}

export const StreamSchema = SchemaFactory.createForClass(Stream);
