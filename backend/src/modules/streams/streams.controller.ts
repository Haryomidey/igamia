import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreamsService } from './streams.service';
import { StreamsGateway } from './streams.gateway';
import { StartStreamDto } from './dto/start-stream.dto';
import { InviteStreamerDto } from './dto/invite-streamer.dto';
import { CommentStreamDto } from './dto/comment-stream.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { SendStreamGiftDto } from './dto/send-stream-gift.dto';

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly streamsService: StreamsService,
    private readonly streamsGateway: StreamsGateway,
  ) {}

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
  stopStream(@Param('streamId') streamId: string, @CurrentUser() user: { sub: string }) {
    return this.streamsService.stopStream(streamId, user.sub);
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
    this.streamsGateway.emitStreamInviteNotification(dto.streamerUserId, {
      streamId,
      hostUserId: user.sub,
      hostUsername: result.stream.participants.find((participant: { role: string; username: string }) => participant.role === 'host')?.username ?? 'Host',
      title: result.stream.title,
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
    this.streamsGateway.server.to(streamId).emit('streamParticipantUpdated', {
      streamId,
      participants: result.stream.participants,
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
      creditedAmount: result.creditedAmount,
    });
    return result;
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
  @Get('me/recordings')
  getMyRecordings(@CurrentUser() user: { sub: string }) {
    return this.streamsService.listRecordedStreams(user.sub);
  }
}
