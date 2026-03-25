import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PledgesService } from './pledges.service';
import { PledgesController } from './pledges.controller';
import { PledgesGateway } from './pledges.gateway';
import { Match, MatchSchema } from './schemas/match.schema';
import { Pledge, PledgeSchema } from './schemas/pledge.schema';
import { GamesModule } from '../games/games.module';
import { WalletModule } from '../wallet/wallet.module';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { StreamsModule } from '../streams/streams.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Pledge.name, schema: PledgeSchema },
    ]),
    GamesModule,
    WalletModule,
    StreamsModule,
    MediaModule,
  ],
  controllers: [PledgesController],
  providers: [PledgesService, PledgesGateway, WsJwtGuard],
})
export class PledgesModule {}
