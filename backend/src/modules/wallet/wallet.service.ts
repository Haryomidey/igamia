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

  private getIgcToNgnRate() {
    return Number(this.configService.get('IGC_TO_NGN_RATE', '10'));
  }

  private getPlatformFeeRate() {
    return Number(this.configService.get('PLATFORM_FEE_RATE', '0.1'));
  }

  private roundAmount(value: number) {
    return Number(value.toFixed(2));
  }

  private async ensureWallet(userId: string) {
    let wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      await this.bootstrapWallet(userId);
      wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    }

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  private buildWalletSummary(wallet: { usdBalance: number; igcBalance: number }) {
    const igcToNgnRate = this.getIgcToNgnRate();
    const totalPortfolioNgn = this.roundAmount(wallet.usdBalance + wallet.igcBalance * igcToNgnRate);

    return {
      fiatCurrency: 'NGN' as const,
      fiatBalance: wallet.usdBalance,
      igcToNgnRate,
      platformFeeRate: this.getPlatformFeeRate(),
      igcEstimatedValueNgn: this.roundAmount(wallet.igcBalance * igcToNgnRate),
      totalPortfolioNgn,
    };
  }

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

    return { wallet, transactions, summary: this.buildWalletSummary(wallet) };
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
      currency: 'NGN',
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
    const wallet = await this.ensureWallet(userId);

    wallet.usdBalance += amount;
    await wallet.save();

    await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'deposit',
      amount,
      currency: 'NGN',
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
    const wallet = await this.ensureWallet(userId);

    if (wallet.usdBalance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.usdBalance -= dto.amount;
    await wallet.save();

    const transaction = await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      type: 'withdrawal',
      amount: dto.amount,
      currency: 'NGN',
      status: 'pending',
      description: 'NGN withdrawal request submitted',
    });

    return {
      message: 'Withdrawal request submitted successfully',
      transaction,
      wallet,
      summary: this.buildWalletSummary(wallet),
    };
  }

  async buyIgc(userId: string, amountNgn: number) {
    const wallet = await this.ensureWallet(userId);
    if (wallet.usdBalance < amountNgn) {
      throw new BadRequestException('Insufficient NGN balance');
    }

    const rate = this.getIgcToNgnRate();
    const creditedIgc = this.roundAmount(amountNgn / rate);

    wallet.usdBalance = this.roundAmount(wallet.usdBalance - amountNgn);
    wallet.igcBalance = this.roundAmount(wallet.igcBalance + creditedIgc);
    await wallet.save();

    await this.transactionModel.insertMany([
      {
        userId: new Types.ObjectId(userId),
        type: 'igc_purchase',
        amount: amountNgn,
        currency: 'NGN',
        description: 'NGN converted to IGC',
        metadata: { igcToNgnRate: rate, creditedIgc },
      },
      {
        userId: new Types.ObjectId(userId),
        type: 'igc_purchase_credit',
        amount: creditedIgc,
        currency: 'IGC',
        description: 'IGC purchased from wallet balance',
        metadata: { igcToNgnRate: rate, debitedNgn: amountNgn },
      },
    ]);

    return {
      message: 'IGC purchased successfully',
      creditedIgc,
      debitedNgn: amountNgn,
      rate,
      wallet,
      summary: this.buildWalletSummary(wallet),
    };
  }

  async convertIgcToNgn(userId: string, amountIgc: number) {
    const wallet = await this.ensureWallet(userId);
    if (wallet.igcBalance < amountIgc) {
      throw new BadRequestException('Insufficient IGC balance');
    }

    const rate = this.getIgcToNgnRate();
    const creditedNgn = this.roundAmount(amountIgc * rate);

    wallet.igcBalance = this.roundAmount(wallet.igcBalance - amountIgc);
    wallet.usdBalance = this.roundAmount(wallet.usdBalance + creditedNgn);
    await wallet.save();

    await this.transactionModel.insertMany([
      {
        userId: new Types.ObjectId(userId),
        type: 'igc_conversion_debit',
        amount: amountIgc,
        currency: 'IGC',
        description: 'IGC converted to NGN',
        metadata: { igcToNgnRate: rate, creditedNgn },
      },
      {
        userId: new Types.ObjectId(userId),
        type: 'igc_conversion_credit',
        amount: creditedNgn,
        currency: 'NGN',
        description: 'NGN credited from IGC conversion',
        metadata: { igcToNgnRate: rate, debitedIgc: amountIgc },
      },
    ]);

    return {
      message: 'IGC converted successfully',
      debitedIgc: amountIgc,
      creditedNgn,
      rate,
      wallet,
      summary: this.buildWalletSummary(wallet),
    };
  }

  async sendGift(senderUserId: string, dto: GiftDto) {
    if (senderUserId === dto.receiverUserId) {
      throw new BadRequestException('You cannot gift yourself');
    }

    const feeRate = this.getPlatformFeeRate();
    const rate = this.getIgcToNgnRate();
    const feeIgc = this.roundAmount(dto.amount * feeRate);
    const receiverIgc = this.roundAmount(dto.amount - feeIgc);
    const creditedNgn = this.roundAmount(receiverIgc * rate);

    const senderWallet = await this.ensureWallet(senderUserId);
    const receiverWallet = await this.ensureWallet(dto.receiverUserId);

    if (senderWallet.igcBalance < dto.amount) {
      throw new BadRequestException('Insufficient IGC balance');
    }

    senderWallet.igcBalance = this.roundAmount(senderWallet.igcBalance - dto.amount);
    receiverWallet.usdBalance = this.roundAmount(receiverWallet.usdBalance + creditedNgn);
    await Promise.all([senderWallet.save(), receiverWallet.save()]);

    await this.transactionModel.insertMany([
      {
        userId: new Types.ObjectId(senderUserId),
        type: 'gift_sent',
        amount: dto.amount,
        currency: 'IGC',
        description: dto.description,
        metadata: {
          receiverUserId: dto.receiverUserId,
          feeIgc,
          creditedNgn,
          igcToNgnRate: rate,
          platformFeeRate: feeRate,
        },
      },
      {
        userId: new Types.ObjectId(dto.receiverUserId),
        type: 'gift_received',
        amount: creditedNgn,
        currency: 'NGN',
        description: dto.description,
        metadata: {
          senderUserId,
          sourceIgcAmount: dto.amount,
          receivedIgcAfterFee: receiverIgc,
          feeIgc,
          igcToNgnRate: rate,
          platformFeeRate: feeRate,
        },
      },
    ]);

    return {
      message: 'Gift sent successfully',
      feeIgc,
      feeNgn: this.roundAmount(feeIgc * rate),
      creditedIgc: receiverIgc,
      creditedNgn,
      rate,
    };
  }
}
