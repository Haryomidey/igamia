import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private resolveMailtrapSendUrl(apiBaseUrl: string) {
    const trimmed = apiBaseUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api/send') ? trimmed : `${trimmed}/api/send`;
  }

  async sendOtp(email: string, subject: string, otp: string) {
    const token = this.configService.get<string>('MAILTRAP_TOKEN');
    const apiBaseUrl = this.configService.get<string>('MAILTRAP_API_BASE_URL');
    const sender = this.configService.get<string>('MAILTRAP_SENDER_EMAIL');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isDevLikeEnv = nodeEnv !== 'production';

    if (isDevLikeEnv) {
      this.logger.warn(`DEV OTP | email=${email} | subject="${subject}" | code=${otp}`);
    }

    if (!token || !apiBaseUrl || !sender) {
      this.logger.warn(`Mailtrap not configured. OTP for ${email}: ${otp}`);
      return { delivered: false, fallbackLogged: true };
    }

    const response = await fetch(this.resolveMailtrapSendUrl(apiBaseUrl), {
      method: 'POST',
      headers: {
        'Api-Token': token,
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
      this.logger.error(`Mailtrap send failed for ${email}: ${errorBody}`);

      if (nodeEnv !== 'production') {
        this.logger.warn(`Falling back to dev OTP log for ${email}. OTP: ${otp}`);
        return { delivered: false, fallbackLogged: true, errorBody };
      }

      throw new Error('Unable to send email');
    }

    return { delivered: true };
  }
}
