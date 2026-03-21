import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ReferralDocument = HydratedDocument<Referral>;

@Schema({ timestamps: true })
export class Referral {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  referrerUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  referredUserId: Types.ObjectId;

  @Prop({ default: 'signed_up' })
  status: 'signed_up' | 'rewarded';

  @Prop({ default: 0 })
  rewardIgc: number;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);
