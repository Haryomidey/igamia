import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { WithdrawDto } from './dto/withdraw.dto';
import { GiftDto } from './dto/gift.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    private readonly configService: ConfigService,
  ) {}

  async bootstrapWallet(userId: string) {
    const existing = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (existing) {
      return existing;
    }

    const initialUsdBalance = Number(this.configService.get('INITIAL_USD_BALANCE', '0'));
    const initialIgcBalance = Number(this.configService.get('INITIAL_IGC_BALANCE', '0'));

    return this.walletModel.create({
      userId: new Types.ObjectId(userId),
      usdBalance: initialUsdBalance,
      igcBalance: initialIgcBalance,
    });
  }

  async getWallet(userId: string) {
    let wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!wallet) {
      await this.bootstrapWallet(userId);
      wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    }

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return { wallet, transactions };
  }

  async creditIgc(userId: string, amount: number, description: string, metadata: Record<string, unknown> = {}) {
    await this.walletModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $inc: { igcBalance: amount } },
      { upsert: true },
    );

    await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'mining_reward',
      amount,
      currency: 'IGC',
      description,
      metadata,
    });
  }

  async debitUsd(
    userId: string,
    amount: number,
    description: string,
    metadata: Record<string, unknown> = {},
  ) {
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.usdBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.usdBalance -= amount;
    await wallet.save();

    await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'debit',
      amount,
      currency: 'USD',
      description,
      metadata,
    });

    return wallet;
  }

  async creditUsd(
    userId: string,
    amount: number,
    description: string,
    metadata: Record<string, unknown> = {},
  ) {
    let wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      await this.bootstrapWallet(userId);
      wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    }

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    wallet.usdBalance += amount;
    await wallet.save();

    await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'deposit',
      amount,
      currency: 'USD',
      description,
      metadata,
    });

    return wallet;
  }

  async applyReferralReward(userId: string, amount: number, description: string) {
    await this.walletModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $inc: { igcBalance: amount } },
      { upsert: true },
    );

    await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'referral_reward',
      amount,
      currency: 'IGC',
      description,
    });
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.usdBalance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.usdBalance -= dto.amount;
    await wallet.save();

    const transaction = await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'withdrawal',
      amount: dto.amount,
      currency: 'USD',
      status: 'pending',
      description: 'Withdrawal request submitted',
    });

    return {
      message: 'Withdrawal request submitted successfully',
      transaction,
      wallet,
    };
  }

  async sendGift(senderUserId: string, dto: GiftDto) {
    if (senderUserId === dto.receiverUserId) {
      throw new BadRequestException('You cannot gift yourself');
    }

    const feeRate = Number(this.configService.get('PLATFORM_FEE_RATE', '0.1'));
    const fee = Number((dto.amount * feeRate).toFixed(2));
    const receiverAmount = Number((dto.amount - fee).toFixed(2));

    const senderWallet = await this.walletModel.findOne({ userId: new Types.ObjectId(senderUserId) });
    const receiverWallet = await this.walletModel.findOne({ userId: new Types.ObjectId(dto.receiverUserId) });

    if (!senderWallet || !receiverWallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (senderWallet.usdBalance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    senderWallet.usdBalance -= dto.amount;
    receiverWallet.usdBalance += receiverAmount;
    await Promise.all([senderWallet.save(), receiverWallet.save()]);

    await this.transactionModel.insertMany([
      {
        userId: new Types.ObjectId(senderUserId),
        type: 'gift_sent',
        amount: dto.amount,
        currency: 'USD',
        description: dto.description,
        metadata: { receiverUserId: dto.receiverUserId, fee },
      },
      {
        userId: new Types.ObjectId(dto.receiverUserId),
        type: 'gift_received',
        amount: receiverAmount,
        currency: 'USD',
        description: dto.description,
        metadata: { senderUserId, fee },
      },
    ]);

    return {
      message: 'Gift sent successfully',
      fee,
      creditedAmount: receiverAmount,
    };
  }
}
