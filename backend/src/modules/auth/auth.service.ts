import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WalletService } from '../wallet/wallet.service';
import { ReferralsService } from '../referrals/referrals.service';
import { SafeUserProfile } from '../users/users.service';

type AuthResponse = {
  accessToken: string;
  user: SafeUserProfile;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly walletService: WalletService,
    private readonly referralsService: ReferralsService,
  ) {}

  private otpExpiryDate() {
    const minutes = Number(this.configService.get('OTP_EXPIRY_MINUTES', '10'));
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async signToken(user: { id: string; email: string; username: string }) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
      },
    );
  }

  async register(dto: RegisterDto) {
    const referredBy = dto.referralCode
      ? await this.usersService.findByReferralCode(dto.referralCode)
      : null;

    if (dto.referralCode && !referredBy) {
      throw new BadRequestException('Invalid referral code');
    }

    const rounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', '10'));
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    const referralCode = `IGAMIA-${dto.username.toUpperCase()}-${Math.floor(Math.random() * 9999)}`;

    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      username: dto.username,
      passwordHash,
      referralCode,
      referredBy: referredBy?.id,
    });

    await this.walletService.bootstrapWallet(user.id);

    if (referredBy) {
      await this.referralsService.recordSignupReferral(referredBy.id, user.id);
    }

    const otp = this.generateOtp();
    await this.usersService.updateOtp(user.id, otp, this.otpExpiryDate());
    await this.mailService.sendOtp(user.email, 'Verify your iGamia account', otp);

    return {
      message: 'Registration successful. Verify your email with the OTP sent.',
      userId: user.id,
      email: user.email,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      accessToken,
      user: await this.usersService.safeProfile(user.id),
    };
  }

  async verifyEmail(dto: VerifyOtpDto): Promise<AuthResponse & { message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.emailOtp || !user.emailOtpExpiresAt) {
      throw new BadRequestException('Verification code not found');
    }

    if (user.emailOtp !== dto.otp || user.emailOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const updated = await this.usersService.markEmailVerified(user.id);
    const accessToken = await this.signToken({
      id: updated!.id,
      email: updated!.email,
      username: updated!.username,
    });

    return {
      message: 'Email verified successfully',
      accessToken,
      user: await this.usersService.safeProfile(updated!.id),
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = this.generateOtp();
    await this.usersService.updateOtp(user.id, otp, this.otpExpiryDate());
    await this.mailService.sendOtp(user.email, 'Your new iGamia verification code', otp);

    return { message: 'Verification OTP resent successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the email exists, a reset OTP has been sent.' };
    }

    const otp = this.generateOtp();
    await this.usersService.updateResetOtp(user.email, otp, this.otpExpiryDate());
    await this.mailService.sendOtp(user.email, 'Reset your iGamia password', otp);

    return { message: 'If the email exists, a reset OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.resetOtp || !user.resetOtpExpiresAt) {
      throw new BadRequestException('Reset code not found');
    }

    if (user.resetOtp !== dto.otp || user.resetOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const rounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', '10'));
    const passwordHash = await bcrypt.hash(dto.newPassword, rounds);
    await this.usersService.updatePassword(user.id, passwordHash);

    return { message: 'Password reset successful' };
  }
}
