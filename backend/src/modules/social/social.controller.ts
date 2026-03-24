import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedPost, SocialService } from './social.service';

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

  @Get('feed')
  feed(@CurrentUser() user: { sub: string }): Promise<FeedPost[]> {
    return this.socialService.listFeed(user.sub);
  }

  @Post('posts')
  createPost(
    @CurrentUser() user: { sub: string },
    @Body()
    body: { content?: string; mediaUrl?: string; mediaType?: 'text' | 'image' | 'video' },
  ) {
    return this.socialService.createPost(user.sub, body);
  }

  @Post('posts/:postId/like')
  likePost(
    @CurrentUser() user: { sub: string },
    @Param('postId') postId: string,
  ) {
    return this.socialService.togglePostLike(postId, user.sub);
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
