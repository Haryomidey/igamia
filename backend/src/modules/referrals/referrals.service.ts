import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Referral, ReferralDocument } from './schemas/referral.schema';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectModel(Referral.name) private readonly referralModel: Model<ReferralDocument>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  recordSignupReferral(referrerUserId: string, referredUserId: string) {
    return this.referralModel.create({
      referrerUserId: new Types.ObjectId(referrerUserId),
      referredUserId: new Types.ObjectId(referredUserId),
      status: 'signed_up',
    });
  }

  async rewardReferral(referrerUserId: string, referredUserId: string) {
    const reward = Number(this.configService.get('REFERRAL_REWARD_IGC', '100'));

    await this.referralModel.findOneAndUpdate(
      {
        referrerUserId: new Types.ObjectId(referrerUserId),
        referredUserId: new Types.ObjectId(referredUserId),
      },
      { status: 'rewarded', rewardIgc: reward },
      { new: true },
    );

    await this.walletService.applyReferralReward(
      referrerUserId,
      reward,
      'Referral reward credited',
    );
  }

  async getMyReferralSummary(userId: string) {
    const user = await this.usersService.safeProfile(userId);
    const referrals = await this.referralModel
      .find({ referrerUserId: new Types.ObjectId(userId) })
      .populate('referredUserId', 'fullName username email')
      .sort({ createdAt: -1 })
      .lean();

    return {
      referralCode: user.referralCode,
      referralLink: `https://igamia.app/signup?ref=${user.referralCode}`,
      referrals,
      totalReferrals: referrals.length,
      totalRewardedIgc: (referrals as Array<{ rewardIgc?: number }>).reduce(
        (sum: number, referral) => sum + (referral.rewardIgc ?? 0),
        0,
      ),
    };
  }
}
