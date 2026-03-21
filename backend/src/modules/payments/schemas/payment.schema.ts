import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  purpose: string;

  @Prop({ default: 'initialized' })
  status: 'initialized' | 'successful' | 'failed';

  @Prop({ default: '' })
  reference: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);