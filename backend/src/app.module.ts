import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MiningModule } from './modules/mining/mining.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { StreamsModule } from './modules/streams/streams.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MailModule } from './modules/mail/mail.module';
import { GamesModule } from './modules/games/games.module';
import { PledgesModule } from './modules/pledges/pledges.module';
import { WatchEarnModule } from './modules/watch-earn/watch-earn.module';
import { SocialModule } from './modules/social/social.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    HealthModule,
    MailModule,
    UsersModule,
    AuthModule,
    WalletModule,
    MiningModule,
    WatchEarnModule,
    ReferralsModule,
    GamesModule,
    PledgesModule,
    StreamsModule,
    SocialModule,
    MediaModule,
    PaymentsModule,
  ],
})
export class AppModule {}
