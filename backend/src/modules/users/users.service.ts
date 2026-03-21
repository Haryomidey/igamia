import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

type CreateUserInput = {
  fullName: string;
  email: string;
  username: string;
  passwordHash: string;
  referralCode: string;
  referredBy?: string;
};

export type SafeUserProfile = {
  _id: unknown;
  fullName: string;
  email: string;
  username: string;
  emailVerified: boolean;
  referralCode: string;
  referredBy?: unknown;
  avatarUrl: string;
  bio: string;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(input: CreateUserInput) {
    const existing = await this.userModel.findOne({
      $or: [{ email: input.email.toLowerCase() }, { username: input.username }],
    });

    if (existing) {
      throw new ConflictException('Email or username already exists');
    }

    return this.userModel.create({
      ...input,
      email: input.email.toLowerCase(),
      referredBy: input.referredBy ? new Types.ObjectId(input.referredBy) : undefined,
    });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findById(userId: string) {
    return this.userModel.findById(userId);
  }

  findByReferralCode(referralCode: string) {
    return this.userModel.findOne({ referralCode });
  }

  async markEmailVerified(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { emailVerified: true, emailOtp: null, emailOtpExpiresAt: null },
      { new: true },
    );
  }

  async updateOtp(userId: string, otp: string, expiresAt: Date) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { emailOtp: otp, emailOtpExpiresAt: expiresAt },
      { new: true },
    );
  }

  async updateResetOtp(email: string, otp: string, expiresAt: Date) {
    return this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetOtp: otp, resetOtpExpiresAt: expiresAt },
      { new: true },
    );
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
      },
      { new: true },
    );
  }

  async safeProfile(userId: string): Promise<SafeUserProfile> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, emailOtp, resetOtp, ...safeUser } = user;
    void passwordHash;
    void emailOtp;
    void resetOtp;
    return safeUser as SafeUserProfile;
  }
}
