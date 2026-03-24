import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  async initializePaystackPayment(userId: string, dto: InitializePaymentDto) {
    const reference = `IGAMIA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const currency = this.configService.get<string>('PAYSTACK_CURRENCY', 'NGN');
    const callbackUrl = this.configService.get<string>('PAYSTACK_CALLBACK_URL');
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    const payment = await this.paymentModel.create({
      userId: new Types.ObjectId(userId),
      amount: dto.amount,
      currency,
      purpose: dto.purpose,
      status: 'initialized',
      reference,
    });

    if (!secretKey) {
      return {
        payment,
        paystack: {
          initialized: false,
          message: 'PAYSTACK_SECRET_KEY not configured',
        },
      };
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: dto.email,
        amount: Math.round(dto.amount * 100),
        currency,
        callback_url: callbackUrl,
        reference,
        metadata: {
          purpose: dto.purpose,
          paymentId: payment.id,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || result?.status === false) {
      payment.status = 'failed';
      payment.metadata = result?.data ?? result ?? {};
      await payment.save();
      throw new BadRequestException(result?.message ?? 'Unable to initialize Paystack payment');
    }

    payment.metadata = {
      ...(payment.metadata ?? {}),
      initializeResponse: result?.data ?? result,
    };
    await payment.save();

    return { payment, paystack: result };
  }

  async verifyPaystackPayment(reference: string) {
    const payment = await this.paymentModel.findOne({ reference });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      return {
        payment,
        paystack: {
          verified: false,
          message: 'PAYSTACK_SECRET_KEY not configured',
        },
      };
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new BadRequestException(result?.message ?? 'Unable to verify Paystack payment');
    }

    if (result?.data?.status === 'success' && payment.status !== 'successful') {
      await this.walletService.creditUsd(
        payment.userId.toString(),
        payment.amount,
        `Paystack deposit for ${payment.purpose}`,
        {
          reference,
          gateway: 'paystack',
          verifiedAt: new Date().toISOString(),
        },
      );
      payment.status = 'successful';
      payment.metadata = result.data;
      await payment.save();
    } else if (result?.data?.status !== 'success' && payment.status === 'initialized') {
      payment.status = 'failed';
      payment.metadata = result?.data ?? {};
      await payment.save();
    }

    return { payment, paystack: result };
  }
}
