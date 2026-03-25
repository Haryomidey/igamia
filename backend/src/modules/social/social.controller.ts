import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedPost, SocialService, SocialUserProfile } from './social.service';
import { SocialGateway } from './social.gateway';

@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly socialGateway: SocialGateway,
  ) {}

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

  @Get('users/:targetUserId')
  user(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
  ): Promise<SocialUserProfile> {
    return this.socialService.getSocialUserProfile(user.sub, targetUserId);
  }

  @Get('posts/:postId')
  post(
    @CurrentUser() user: { sub: string },
    @Param('postId') postId: string,
  ): Promise<FeedPost> {
    return this.socialService.getPostById(postId, user.sub);
  }

  @Get('friends')
  friends(@CurrentUser() user: { sub: string }) {
    return this.socialService.listFriends(user.sub);
  }

  @Get('messages/:targetUserId')
  messages(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.socialService.listMessages(user.sub, targetUserId);
  }

  @Post('posts')
  async createPost(
    @CurrentUser() user: { sub: string },
    @Body()
    body: { content?: string; mediaUrl?: string; mediaType?: 'text' | 'image' | 'video' },
  ) {
    const post = await this.socialService.createPost(user.sub, body);
    this.socialGateway.emitPostCreated(post);
    return post;
  }

  @Post('posts/:postId/like')
  async likePost(
    @CurrentUser() user: { sub: string },
    @Param('postId') postId: string,
  ) {
    const result = await this.socialService.togglePostLike(postId, user.sub);
    this.socialGateway.emitPostLiked(result);
    return result;
  }

  @Get('posts/:postId/comments')
  postComments(@Param('postId') postId: string) {
    return this.socialService.listPostComments(postId);
  }

  @Post('posts/:postId/comments')
  async commentOnPost(
    @CurrentUser() user: { sub: string },
    @Param('postId') postId: string,
    @Body() body: { message: string },
  ) {
    const result = await this.socialService.commentOnPost(postId, user.sub, body.message);
    this.socialGateway.emitPostCommented(result);
    return result.comment;
  }

  @Post('requests/:targetUserId')
  async sendRequest(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
  ) {
    const request = await this.socialService.sendRequest(user.sub, targetUserId);
    this.socialGateway.emitRequestReceived(targetUserId, {
      requestId: request.id,
      fromUserId: user.sub,
    });
    return request;
  }

  @Post('requests/:requestId/accept')
  async acceptRequest(
    @CurrentUser() user: { sub: string },
    @Param('requestId') requestId: string,
  ) {
    const request = await this.socialService.acceptRequest(user.sub, requestId);
    this.socialGateway.emitRequestAccepted(request.fromUserId.toString(), {
      requestId: request.id,
      acceptedByUserId: user.sub,
    });
    return request;
  }

  @Post('messages/:targetUserId')
  async sendMessage(
    @CurrentUser() user: { sub: string },
    @Param('targetUserId') targetUserId: string,
    @Body() body: { message: string },
  ) {
    const message = await this.socialService.sendDirectMessage(user.sub, targetUserId, body.message);
    this.socialGateway.emitDirectMessage(targetUserId, message);
    return message;
  }
}
