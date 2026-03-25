import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WatchEarnService } from './watch-earn.service';

@UseGuards(JwtAuthGuard)
@Controller('watch-earn')
export class WatchEarnController {
  constructor(private readonly watchEarnService: WatchEarnService) {}

  @Get('today')
  getTodayVideos(@CurrentUser() user: { sub: string }): ReturnType<WatchEarnService['getTodayVideos']> {
    return this.watchEarnService.getTodayVideos(user.sub);
  }

  @Post('videos/:videoId/start')
  startVideo(
    @CurrentUser() user: { sub: string },
    @Param('videoId') videoId: string,
  ) {
    return this.watchEarnService.startVideo(user.sub, videoId);
  }

  @Post('videos/:videoId/complete')
  completeVideo(
    @CurrentUser() user: { sub: string },
    @Param('videoId') videoId: string,
  ) {
    return this.watchEarnService.completeVideo(user.sub, videoId);
  }
}
