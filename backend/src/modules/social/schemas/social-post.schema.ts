import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SocialPostDocument = HydratedDocument<SocialPost>;

@Schema({ _id: false })
class PostBoostTargeting {
  @Prop({ type: Number, default: null })
  minAge?: number | null;

  @Prop({ type: Number, default: null })
  maxAge?: number | null;

  @Prop({ default: '' })
  location?: string;

  @Prop({ type: [String], default: [] })
  preferences!: string[];
}

@Schema({ _id: false })
class PostBoost {
  @Prop({ default: false })
  active!: boolean;

  @Prop({ type: PostBoostTargeting, default: () => ({}) })
  targeting!: PostBoostTargeting;

  @Prop({ default: '' })
  linkUrl!: string;

  @Prop()
  boostedAt?: Date;
}

@Schema({ timestamps: true })
export class SocialPost {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  username!: string;

  @Prop({ default: '' })
  userFullName!: string;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ default: '' })
  content!: string;

  @Prop({ default: '' })
  mediaUrl!: string;

  @Prop({ default: 'text', enum: ['text', 'image', 'video'] })
  mediaType!: 'text' | 'image' | 'video';

  @Prop({ type: [Types.ObjectId], default: [] })
  likedByUserIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  reportedByUserIds!: Types.ObjectId[];

  @Prop({ default: 0 })
  commentsCount!: number;

  @Prop({ default: 0 })
  sharesCount!: number;

  @Prop({ default: 0 })
  reportsCount!: number;

  @Prop({ type: PostBoost, default: () => ({ active: false, targeting: { preferences: [] } }) })
  boost!: PostBoost;
}

export const SocialPostSchema = SchemaFactory.createForClass(SocialPost);
