import { Body, Controller, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SafeUserProfile } from '../users/users.service';

type AuthControllerResponse = {
  accessToken: string;
  user: SafeUserProfile;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthControllerResponse> {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(
    @Body() dto: VerifyOtpDto,
  ): Promise<AuthControllerResponse & { message: string }> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  resendVerification(@Query('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
