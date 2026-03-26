import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailOtp?: string;

  @Prop()
  emailOtpExpiresAt?: Date;

  @Prop()
  resetOtp?: string;

  @Prop()
  resetOtpExpiresAt?: Date;

  @Prop({ required: true, unique: true })
  referralCode: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  referredBy?: Types.ObjectId;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ type: Number, default: null })
  age?: number | null;

  @Prop({ type: [String], default: [] })
  gameInterests: string[];

  @Prop({ default: false })
  onboardingCompleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
