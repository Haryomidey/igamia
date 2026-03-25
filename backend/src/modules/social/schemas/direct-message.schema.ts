import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DirectMessageDocument = HydratedDocument<DirectMessage>;

@Schema({ timestamps: true })
export class DirectMessage {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  fromUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  toUserId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  message!: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export const DirectMessageSchema = SchemaFactory.createForClass(DirectMessage);
