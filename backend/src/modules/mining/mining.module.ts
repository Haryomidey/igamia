import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MiningController } from './mining.controller';
import { MiningService } from './mining.service';
import { MiningSession, MiningSessionSchema } from './schemas/mining-session.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MiningSession.name, schema: MiningSessionSchema }]),
    WalletModule,
  ],
  controllers: [MiningController],
  providers: [MiningService],
})
export class MiningModule {}
