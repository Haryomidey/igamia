import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  location: string;
  age?: number | null;
  gameInterests: string[];
  onboardingCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.backfillLegacyUsers();
  }

  private normalizeUsername(username: string) {
    return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  private titleCaseFromWords(words: string[]) {
    return words
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private deriveFullName(user: Pick<User, 'fullName' | 'username' | 'email'>) {
    if (user.fullName?.trim()) {
      return user.fullName.trim();
    }

    const source = user.username?.trim() || user.email?.split('@')[0] || 'iGamia User';
    const words = source.split(/[._-]+/g);
    return this.titleCaseFromWords(words) || 'iGamia User';
  }

  private async generateUniqueSuggestions(baseUsername: string, excludeUsername?: string) {
    const normalizedBase = this.normalizeUsername(baseUsername) || 'player';
    const candidates = Array.from(
      new Set([
        normalizedBase,
        `${normalizedBase}_${Math.floor(100 + Math.random() * 900)}`,
        `${normalizedBase}${Math.floor(1000 + Math.random() * 9000)}`,
        `play_${normalizedBase}`,
        `${normalizedBase}_ig`,
        `ig_${normalizedBase}`,
        `${normalizedBase}_live`,
        `${normalizedBase}${new Date().getFullYear()}`,
      ]),
    ).filter((candidate) => candidate !== excludeUsername);

    const existing = await this.userModel
      .find({ username: { $in: candidates } }, { username: 1 })
      .lean();
    const taken = new Set(existing.map((user) => user.username));

    return candidates.filter((candidate) => !taken.has(candidate)).slice(0, 4);
  }

  async backfillLegacyUsers() {
    const users = await this.userModel.find({
      $or: [
        { fullName: { $exists: false } },
        { fullName: null },
        { fullName: '' },
        { avatarUrl: { $exists: false } },
        { bio: { $exists: false } },
        { location: { $exists: false } },
        { age: { $exists: false } },
        { gameInterests: { $exists: false } },
        { onboardingCompleted: { $exists: false } },
      ],
    });

    if (!users.length) {
      return;
    }

    for (const user of users) {
      user.fullName = this.deriveFullName(user);
      user.avatarUrl = user.avatarUrl ?? '';
      user.bio = user.bio ?? '';
      user.location = user.location ?? '';
      user.age = user.age ?? null;
      user.gameInterests = Array.isArray(user.gameInterests) ? user.gameInterests : [];
      user.onboardingCompleted = Boolean(
        user.location.trim() &&
        user.age &&
        user.gameInterests.length,
      );
      await user.save();
    }
  }

  async create(input: CreateUserInput) {
    const normalizedUsername = this.normalizeUsername(input.username);
    const existing = await this.userModel.findOne({
      $or: [{ email: input.email.toLowerCase() }, { username: normalizedUsername }],
    });

    if (existing) {
      throw new ConflictException('Email or username already exists');
    }

    return this.userModel.create({
      ...input,
      fullName: input.fullName.trim(),
      email: input.email.toLowerCase(),
      username: normalizedUsername,
      referredBy: input.referredBy ? new Types.ObjectId(input.referredBy) : undefined,
    });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findByEmailOrUsername(identifier: string) {
    const trimmedIdentifier = identifier.trim();
    return this.userModel.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { username: trimmedIdentifier.toLowerCase() },
      ],
    });
  }

  findById(userId: string) {
    return this.userModel.findById(userId);
  }

  findByReferralCode(referralCode: string) {
    return this.userModel.findOne({ referralCode });
  }

  async checkUsernameAvailability(username: string) {
    const normalizedUsername = this.normalizeUsername(username);
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return {
        available: false,
        normalizedUsername,
        suggestions: [],
        reason: 'Username must be at least 3 characters and contain only letters, numbers, or underscores.',
      };
    }

    const existing = await this.userModel.exists({ username: normalizedUsername });
    const suggestions = existing
      ? await this.generateUniqueSuggestions(normalizedUsername, normalizedUsername)
      : [];

    return {
      available: !existing,
      normalizedUsername,
      suggestions,
    };
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

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUserProfile> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.location !== undefined) {
      user.location = dto.location.trim();
    }

    if (dto.age !== undefined) {
      user.age = dto.age;
    }

    if (dto.gameInterests !== undefined) {
      user.gameInterests = Array.from(
        new Set(
          dto.gameInterests
            .map((interest) => interest.trim())
            .filter(Boolean),
        ),
      );
    }

    user.onboardingCompleted = Boolean(
      user.location.trim() &&
      user.age &&
      user.gameInterests.length,
    );

    await user.save();
    return this.safeProfile(user.id);
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
