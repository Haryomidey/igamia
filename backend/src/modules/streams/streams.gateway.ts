import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { StreamsService } from './streams.service';
import { StartStreamDto } from './dto/start-stream.dto';
import { InviteStreamerDto } from './dto/invite-streamer.dto';
import { CommentStreamDto } from './dto/comment-stream.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { SendStreamGiftDto } from './dto/send-stream-gift.dto';

@WebSocketGateway({
  namespace: '/streams',
  cors: {
    origin: true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class StreamsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly streamsService: StreamsService) {}

  handleConnection(_client: Socket) {
    return true;
  }

  handleDisconnect(_client: Socket) {
    return true;
  }

  @SubscribeMessage('joinStreamRoom')
  async joinStreamRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { streamId: string },
  ) {
    await client.join(payload.streamId);
    return { joined: true, streamId: payload.streamId };
  }

  @SubscribeMessage('leaveStreamRoom')
  async leaveStreamRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { streamId: string },
  ) {
    await client.leave(payload.streamId);
    return { left: true, streamId: payload.streamId };
  }

  @SubscribeMessage('startStream')
  async startStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: StartStreamDto,
  ) {
    const user = client.data.user as { sub: string; username: string };
    const stream = await this.streamsService.startStream(user.sub, user.username, dto);
    await client.join(stream._id.toString());
    this.server.emit('streamStarted', stream);
    return stream;
  }

  @SubscribeMessage('stopStream')
  async stopStream(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { streamId: string; userId?: string },
  ) {
    const stream = await this.streamsService.stopStream(payload.streamId, payload.userId ?? _client.data.user.sub);
    this.server.to(payload.streamId).emit('streamStopped', stream);
    return stream;
  }

  @SubscribeMessage('inviteStreamer')
  async inviteStreamer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: InviteStreamerDto & { streamId: string },
  ) {
    const result = await this.streamsService.inviteStreamer(
      payload.streamId,
      client.data.user.sub,
      { streamerUserId: payload.streamerUserId },
    );
    this.server.to(payload.streamId).emit('streamerInvited', result);
    return result;
  }

  @SubscribeMessage('shareStream')
  async shareStream(@MessageBody() payload: { streamId: string }) {
    const result = await this.streamsService.shareStream(payload.streamId);
    this.server.to(payload.streamId).emit('streamShared', result);
    return result;
  }

  @SubscribeMessage('likeStream')
  async likeStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { streamId: string },
  ) {
    const result = await this.streamsService.likeStream(
      payload.streamId,
      client.data.user.sub,
      client.data.user.username,
    );
    this.server.to(payload.streamId).emit('streamLiked', {
      streamId: payload.streamId,
      likesCount: result.likesCount,
      likedBy: client.data.user.username,
    });
    return result;
  }

  @SubscribeMessage('commentStream')
  async commentStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CommentStreamDto & { streamId: string },
  ) {
    const comment = await this.streamsService.commentOnStream(
      payload.streamId,
      client.data.user.sub,
      client.data.user.username,
      { message: payload.message },
    );
    this.server.to(payload.streamId).emit('streamCommented', comment);
    return comment;
  }

  @SubscribeMessage('blockViewer')
  async blockViewer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BlockUserDto & { streamId: string },
  ) {
    const result = await this.streamsService.blockUser(payload.streamId, client.data.user.sub, {
      blockedUserId: payload.blockedUserId,
    });
    this.server.to(payload.streamId).emit('viewerBlocked', result);
    return result;
  }

  @SubscribeMessage('giftStream')
  async giftStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendStreamGiftDto & { streamId: string },
  ) {
    const result = await this.streamsService.giftStream(payload.streamId, client.data.user.sub, {
      amount: payload.amount,
      description: payload.description,
    });
    this.server.to(payload.streamId).emit('streamGifted', {
      streamId: payload.streamId,
      amount: payload.amount,
      giftedBy: client.data.user.username,
      creditedAmount: result.creditedAmount,
    });
    return result;
  }
}
