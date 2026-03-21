import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PledgesService } from './pledges.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { PlacePledgeDto } from './dto/place-pledge.dto';

@Controller('pledges')
export class PledgesController {
  constructor(private readonly pledgesService: PledgesService) {}

  @Get('matches')
  listMatches() {
    return this.pledgesService.listMatches();
  }

  @Get('activities')
  getFeaturedActivities() {
    return this.pledgesService.getFeaturedActivities();
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches')
  createMatch(
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: CreateMatchDto,
  ) {
    return this.pledgesService.createMatch(user.sub, user.username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/join')
  joinMatch(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    return this.pledgesService.joinMatch(matchId, user.sub, user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/pledge')
  placePledge(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: PlacePledgeDto,
  ) {
    return this.pledgesService.placePledge(matchId, user.sub, user.username, dto);
  }
}
