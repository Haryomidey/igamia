import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SocialService } from './social.service';

@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('discover')
  discover(@CurrentUser() user: { sub: string }) {
    return this.socialService.discover(user.sub);
  }

  @Get('requests')
  requests(@CurrentUser() user: { sub: string }) {
    return this.socialService.getRequests(user.sub);
  }

  @Post('requests/:targetUserId')
  sendRequest(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.socialService.sendRequest(user.sub, targetUserId);
  }

  @Post('requests/:requestId/accept')
  acceptRequest(
    @CurrentUser() user: { sub: string },
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.acceptRequest(user.sub, requestId);
  }
}
