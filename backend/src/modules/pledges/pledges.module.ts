import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PledgesService } from './pledges.service';
import { PledgesController } from './pledges.controller';
import { Match, MatchSchema } from './schemas/match.schema';
import { Pledge, PledgeSchema } from './schemas/pledge.schema';
import { GamesModule } from '../games/games.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Pledge.name, schema: PledgeSchema },
    ]),
    GamesModule,
    WalletModule,
  ],
  controllers: [PledgesController],
  providers: [PledgesService],
})
export class PledgesModule {}
