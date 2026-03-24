import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PledgesService } from './pledges.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { PlacePledgeDto } from './dto/place-pledge.dto';
import { RequestJoinMatchDto } from './dto/request-join-match.dto';
import { SubmitResultClaimDto } from './dto/submit-result-claim.dto';
import { RespondResultClaimDto } from './dto/respond-result-claim.dto';
import { SendDisputeMessageDto } from './dto/send-dispute-message.dto';

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

  @Get('leaderboard')
  leaderboard() {
    return this.pledgesService.getLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  myStats(@CurrentUser() user: { sub: string }) {
    return this.pledgesService.getUserCompetitiveProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('matches/:matchId')
  getMatch(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pledgesService.getMatch(matchId, user.sub);
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
    @Body() dto: RequestJoinMatchDto,
  ) {
    return this.pledgesService.joinMatch(matchId, user.sub, user.username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/requests/:requestUserId/accept')
  acceptJoinRequest(
    @Param('matchId') matchId: string,
    @Param('requestUserId') requestUserId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    return this.pledgesService.acceptJoinRequest(matchId, requestUserId, user.sub, user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/requests/:requestUserId/reject')
  rejectJoinRequest(
    @Param('matchId') matchId: string,
    @Param('requestUserId') requestUserId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pledgesService.rejectJoinRequest(matchId, requestUserId, user.sub);
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

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/result-claim')
  submitResultClaim(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: SubmitResultClaimDto,
  ) {
    return this.pledgesService.submitResultClaim(matchId, user.sub, user.username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/result-claim/respond')
  respondToResultClaim(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: RespondResultClaimDto,
  ) {
    return this.pledgesService.respondToResultClaim(matchId, user.sub, user.username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('matches/:matchId/dispute')
  getDispute(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pledgesService.getDispute(matchId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/dispute/messages')
  sendDisputeMessage(
    @Param('matchId') matchId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: SendDisputeMessageDto,
  ) {
    return this.pledgesService.sendDisputeMessage(matchId, user.sub, user.username, dto);
  }
}
