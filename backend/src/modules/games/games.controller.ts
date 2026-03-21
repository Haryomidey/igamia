import { Controller, Get, Param, Query } from '@nestjs/common';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  listGames(
    @Query('search') search?: string,
    @Query('popular') popular?: string,
    @Query('featured') featured?: string,
  ) {
    return this.gamesService.listGames({ search, popular, featured });
  }

  @Get('featured')
  getFeaturedGames() {
    return this.gamesService.getFeaturedGames();
  }

  @Get(':gameId')
  getGame(@Param('gameId') gameId: string) {
    return this.gamesService.getGameById(gameId);
  }
}
