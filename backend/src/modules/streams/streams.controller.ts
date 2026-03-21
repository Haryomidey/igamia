import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreamsService } from './streams.service';
import { StartStreamDto } from './dto/start-stream.dto';
import { InviteStreamerDto } from './dto/invite-streamer.dto';
import { CommentStreamDto } from './dto/comment-stream.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { SendStreamGiftDto } from './dto/send-stream-gift.dto';

@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get('active')
  listActiveStreams() {
    return this.streamsService.listActiveStreams();
  }

  @Get(':streamId')
  getStream(@Param('streamId') streamId: string) {
    return this.streamsService.getStream(streamId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('start')
  startStream(
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: StartStreamDto,
  ) {
    return this.streamsService.startStream(user.sub, user.username, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/stop')
  stopStream(@Param('streamId') streamId: string, @CurrentUser() user: { sub: string }) {
    return this.streamsService.stopStream(streamId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/invite')
  inviteStreamer(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: InviteStreamerDto,
  ) {
    return this.streamsService.inviteStreamer(streamId, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/share')
  shareStream(@Param('streamId') streamId: string) {
    return this.streamsService.shareStream(streamId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/like')
  likeStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string; username: string },
  ) {
    return this.streamsService.likeStream(streamId, user.sub, user.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':streamId/comments')
  commentOnStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string; username: string },
    @Body() dto: CommentStreamDto,
  ) {
    return this.streamsService.commentOnStream(streamId, user.sub, user.username, dto);
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
  @Post(':streamId/gift')
  giftStream(
    @Param('streamId') streamId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: SendStreamGiftDto,
  ) {
    return this.streamsService.giftStream(streamId, user.sub, dto);
  }
}
