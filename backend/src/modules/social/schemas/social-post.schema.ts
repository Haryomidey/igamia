import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SocialPostDocument = HydratedDocument<SocialPost>;

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
}

export const SocialPostSchema = SchemaFactory.createForClass(SocialPost);
