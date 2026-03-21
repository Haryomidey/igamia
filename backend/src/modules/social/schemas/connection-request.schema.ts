import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ConnectionRequestDocument = HydratedDocument<ConnectionRequest>;

@Schema({ timestamps: true })
export class ConnectionRequest {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  fromUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  toUserId!: Types.ObjectId;

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'declined'] })
  status!: 'pending' | 'accepted' | 'declined';
}

export const ConnectionRequestSchema =
  SchemaFactory.createForClass(ConnectionRequest);
