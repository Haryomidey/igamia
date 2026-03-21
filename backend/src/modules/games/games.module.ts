import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './schemas/game.schema';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }])],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService, MongooseModule],
})
export class GamesModule {}
