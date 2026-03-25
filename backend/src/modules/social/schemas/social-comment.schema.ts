import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { SocialPost } from './social-post.schema';

export type SocialCommentDocument = HydratedDocument<SocialComment>;

@Schema({ timestamps: true })
export class SocialComment {
  @Prop({ type: Types.ObjectId, ref: SocialPost.name, required: true })
  postId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  username!: string;

  @Prop({ default: '' })
  userFullName!: string;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ required: true })
  message!: string;
}

export const SocialCommentSchema = SchemaFactory.createForClass(SocialComment);
