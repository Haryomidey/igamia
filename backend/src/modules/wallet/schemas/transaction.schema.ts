import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: 'USD' | 'NGN' | 'IGC';

  @Prop({ default: 'completed' })
  status: 'pending' | 'completed' | 'failed';

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
