import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(email: string, subject: string, otp: string) {
    const token = this.configService.get<string>('MAILTRAP_TOKEN');
    const apiBaseUrl = this.configService.get<string>('MAILTRAP_API_BASE_URL');
    const sender = this.configService.get<string>('MAILTRAP_SENDER_EMAIL');

    if (!token || !apiBaseUrl || !sender) {
      this.logger.warn(`Mailtrap not configured. OTP for ${email}: ${otp}`);
      return { delivered: false, fallbackLogged: true };
    }

    const response = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: sender, name: 'iGamia' },
        to: [{ email }],
        subject,
        text: `Your iGamia code is ${otp}`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Mailtrap send failed: ${errorBody}`);
      throw new Error('Unable to send email');
    }

    return { delivered: true };
  }
}
