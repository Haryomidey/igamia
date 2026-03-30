import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreamsService } from './streams.service';
import { StreamsGateway } from './streams.gateway';
import { SocialGateway } from '../social/social.gateway';
import { StartStreamDto } from './dto/start-stream.dto';
import { InviteStreamerDto } from './dto/invite-streamer.dto';
import { CommentStreamDto } from './dto/comment-stream.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { SendStreamGiftDto } from './dto/send-stream-gift.dto';
import { UpdateStreamLayoutDto } from './dto/update-stream-layout.dto';

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamsService: StreamsService,
    private readonly streamsGateway: StreamsGateway,
    private readonly socialGateway: SocialGateway,
  ) {}

  private serializeParticipants(stream: {
    participants: Array<{
      userId: { toString(): string };
      role: 'host' | 'guest' | 'invited';
      username: string;
      avatarUrl?: string;
      joinedAt: Date | string;
    }>;
  }) {
    return stream.participants.map((participant) => ({
      userId: participant.userId.toString(),
      role: participant.role,
      username: participant.username,
      avatarUrl: participant.avatarUrl,
      joinedAt: participant.joinedAt,
    }));
  }

  private serializeJoinRequests(stream: {
    joinRequests: Array<{
      userId: { toString(): string };
      username: string;
      avatarUrl?: string;
      requestedAt: Date | string;
    }>;
  }) {
    return stream.joinRequests.map((request) => ({
      userId: request.userId.toString(),
      username: request.username,
      avatarUrl: request.avatarUrl,
      requestedAt: request.requestedAt,
    }));
  }

  @Get('active')
  listActiveStreams() {
    return this.streamsService.listActiveStreams();
  }

  @Get(':streamId')
  getStream(@Param('streamId') streamId: string) {
    return this.streamsService.getStream(streamId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':streamId/token')
  getViewerToken(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    return this.streamsService.createViewerToken(streamId, user.sub, user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('start')
  startStream(
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: StartStreamDto,
  ) {
    return this.streamsService.startStream(user.sub, user.username, dto).then(async (stream) => {
      this.streamsGateway.startAutomaticPromotions(stream._id.toString());
      const followerIds = await this.streamsService.getFollowerIds(user.sub);
      this.streamsGateway.emitFollowerLiveNotification(followerIds, {
        streamId: stream._id.toString(),
        hostUserId: user.sub,
        hostUsername: user.username,
        title: stream.title,
      });
      return stream;
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/stop')
  async stopStream(@Param('streamId') streamId: string, @CurrentUser() user: { sub: string }) {
    const stream = await this.streamsService.stopStream(streamId, user.sub);
    this.streamsGateway.stopAutomaticPromotions(streamId);
    this.streamsGateway.emitStreamStopped(streamId, {
      _id: stream._id.toString(),
      status: stream.status,
      endedAt: stream.endedAt,
    });
    return stream;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/invite')
  async inviteStreamer(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: InviteStreamerDto,
  ) {
    const result = await this.streamsService.inviteStreamer(streamId, user.sub, dto);
    this.streamsGateway.server.to(streamId).emit('streamerInvited', result);
    this.socialGateway.emitDirectMessage(dto.streamerUserId, result.directMessage);
    this.streamsGateway.emitStreamInviteNotification(dto.streamerUserId, {
      streamId,
      hostUserId: user.sub,
      hostUsername: result.stream.participants.find((participant: { role: string; username: string }) => participant.role === 'host')?.username ?? 'Host',
      title: result.stream.title,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/request-join')
  async requestToJoinStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.streamsService.requestToJoinStream(streamId, user.sub);
    this.streamsGateway.server.to(streamId).emit('streamJoinRequestsUpdated', {
      streamId,
      joinRequests: result.stream.joinRequests,
    });
    this.streamsGateway.emitStreamJoinRequestNotification(result.stream.hostUserId.toString(), {
      streamId,
      title: result.stream.title,
      requestedByUserId: result.request.userId,
      requestedByUsername: result.request.username,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':streamId/request-join')
  async cancelJoinRequest(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.streamsService.cancelJoinRequest(streamId, user.sub);
    this.streamsGateway.server.to(streamId).emit('streamJoinRequestsUpdated', {
      streamId,
      joinRequests: result.stream.joinRequests,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/join-requests/:requestUserId/accept')
  async acceptJoinRequest(
    @Param('streamId') streamId: string,
    @Param('requestUserId') requestUserId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    const result = await this.streamsService.acceptJoinRequest(streamId, user.sub, requestUserId);
    this.streamsGateway.server.to(streamId).emit('streamJoinRequestsUpdated', {
      streamId,
      joinRequests: result.stream.joinRequests,
    });
    this.streamsGateway.emitParticipantUpdated(streamId, {
      participants: this.serializeParticipants(result.stream),
      joinRequests: this.serializeJoinRequests(result.stream),
      orientation: result.stream.orientation,
      mode: result.stream.mode,
    });
    this.streamsGateway.emitStreamJoinRequestResolved(requestUserId, {
      streamId,
      title: result.stream.title,
      hostUserId: user.sub,
      hostUsername: user.username,
      decision: 'accepted',
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/join-requests/:requestUserId/decline')
  async declineJoinRequest(
    @Param('streamId') streamId: string,
    @Param('requestUserId') requestUserId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    const result = await this.streamsService.declineJoinRequest(streamId, user.sub, requestUserId);
    this.streamsGateway.server.to(streamId).emit('streamJoinRequestsUpdated', {
      streamId,
      joinRequests: result.stream.joinRequests,
    });
    this.streamsGateway.emitStreamJoinRequestResolved(requestUserId, {
      streamId,
      title: result.stream.title,
      hostUserId: user.sub,
      hostUsername: user.username,
      decision: 'declined',
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/accept-invite')
  async acceptInvite(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.streamsService.acceptInvite(streamId, user.sub);
    this.streamsGateway.emitParticipantUpdated(streamId, {
      participants: this.serializeParticipants(result.stream),
      joinRequests: this.serializeJoinRequests(result.stream),
      orientation: result.stream.orientation,
      mode: result.stream.mode,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/leave')
  async leaveStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const result = await this.streamsService.leaveStream(streamId, user.sub);
    this.streamsGateway.server.to(streamId).emit('streamParticipantRemoved', {
      streamId,
      removedUserId: result.removedUserId,
      removedUsername: result.removedUsername,
      reason: result.reason,
      participants: result.stream.participants,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/share')
  async shareStream(@Param('streamId') streamId: string) {
    const result = await this.streamsService.shareStream(streamId);
    this.streamsGateway.server.to(streamId).emit('streamShared', {
      streamId,
      sharesCount: result.sharesCount,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/share/direct')
  async shareStreamDirectly(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { targetUserIds: string[] },
  ) {
    const result = await this.streamsService.shareStreamDirectly(streamId, user.sub, body.targetUserIds ?? []);
    this.streamsGateway.server.to(streamId).emit('streamShared', {
      streamId,
      sharesCount: result.sharesCount,
    });
    result.targetUserIds.forEach((targetUserId, index) => {
      this.socialGateway.emitDirectMessage(targetUserId, result.directMessages[index]);
      this.streamsGateway.emitStreamSharedNotification(targetUserId, {
        streamId,
        title: result.stream.title,
        sharedByUserId: user.sub,
        sharedByUsername: result.senderUsername,
      });
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/layout')
  async updateStreamLayout(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateStreamLayoutDto,
  ) {
    const result = await this.streamsService.updateStreamLayout(streamId, user.sub, dto);
    this.streamsGateway.emitParticipantUpdated(streamId, {
      participants: this.serializeParticipants(result.stream),
      joinRequests: this.serializeJoinRequests(result.stream),
      orientation: result.stream.orientation,
      mode: result.stream.mode,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/like')
  async likeStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    const result = await this.streamsService.likeStream(streamId, user.sub, user.username);
    this.streamsGateway.server.to(streamId).emit('streamLiked', {
      streamId,
      likesCount: result.likesCount,
      likedBy: user.username,
      likerCount: result.likerCount,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/comments')
  async commentOnStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: CommentStreamDto,
  ) {
    const comment = await this.streamsService.commentOnStream(streamId, user.sub, user.username, dto);
    this.streamsGateway.server.to(streamId).emit('streamCommented', comment);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/block')
  blockUser(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: BlockUserDto,
  ) {
    return this.streamsService.blockUser(streamId, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/remove-participant')
  async removeParticipant(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: { participantUserId: string },
  ) {
    const result = await this.streamsService.removeParticipant(streamId, user.sub, dto.participantUserId);
    this.streamsGateway.server.to(streamId).emit('streamParticipantRemoved', {
      streamId,
      removedUserId: result.removedUserId,
      removedUsername: result.removedUsername,
      reason: result.reason,
      participants: result.stream.participants,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/gift')
  async giftStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: SendStreamGiftDto,
  ) {
    const result = await this.streamsService.giftStream(streamId, user.sub, dto);
    this.streamsGateway.server.to(streamId).emit('streamGifted', {
      streamId,
      amount: dto.amount,
      giftedBy: user.username,
      creditedIgc: result.creditedIgc,
      creditedNgn: result.creditedNgn,
      feeIgc: result.feeIgc,
      feeNgn: result.feeNgn,
      earningsNgn: result.earningsNgn,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/promote-post')
  async promotePostInStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { postId: string; durationSeconds?: number },
  ) {
    const payload = await this.streamsService.showPromotedPost(streamId, user.sub, body);
    this.streamsGateway.emitStreamPromotion(streamId, payload);
    return { message: 'Promoted post is now showing in the stream', promotion: payload };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/recording')
  saveRecording(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body()
    body: {
      fileName?: string;
      mimeType?: string;
      base64Data: string;
      durationSeconds?: number;
    },
  ) {
    return this.streamsService.saveRecording(streamId, user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':streamId/recording')
  deleteRecording(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.streamsService.deleteRecording(streamId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/recordings')
  getMyRecordings(@CurrentUser() user: { sub: string }) {
    return this.streamsService.listRecordedStreams(user.sub);
  }
}
