import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Stream } from './stream.schema';

export type StreamLikeDocument = HydratedDocument<StreamLike>;

@Schema({ timestamps: true })
export class StreamLike {
  @Prop({ type: Types.ObjectId, ref: Stream.name, required: true })
  streamId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ default: 1 })
  count: number;
}

export const StreamLikeSchema = SchemaFactory.createForClass(StreamLike);
