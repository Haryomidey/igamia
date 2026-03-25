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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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

  constructor(
    private readonly streamsService: StreamsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private async roomViewersCount(streamId: string) {
    const adapter = (this.server as Server & { adapter?: { rooms?: Map<string, Set<string>> } }).adapter;
    const socketsMap = (this.server as Server & { sockets?: Map<string, Socket> }).sockets;
    const roomSockets = adapter?.rooms?.get(streamId);
    if (!roomSockets?.size) {
      return 0;
    }

    const participantIds = new Set(await this.streamsService.getParticipantUserIds(streamId));
    let viewersCount = 0;

    roomSockets.forEach((socketId) => {
      const socket = socketsMap?.get(socketId);
      const userId = socket?.data?.user?.sub as string | undefined;
      if (!userId || !participantIds.has(userId)) {
        viewersCount += 1;
      }
    });

    return viewersCount;
  }

  private async emitPresenceUpdate(streamId: string, joinedUsername?: string) {
    this.server.to(streamId).emit('streamPresenceUpdated', {
      streamId,
      viewersCount: await this.roomViewersCount(streamId),
      joinedUsername,
    });
  }

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return true;
    }

    try {
      const user = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      }) as { sub: string; username: string; email: string };

      client.data.user = user;
      void client.join(this.userRoom(user.sub));
    } catch {
      return true;
    }

    return true;
  }

  handleDisconnect(client: Socket) {
    const currentStreamId = client.data.currentStreamId as string | undefined;
    if (currentStreamId) {
      void this.emitPresenceUpdate(currentStreamId);
    }
    return true;
  }

  @SubscribeMessage('joinStreamRoom')
  async joinStreamRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { streamId: string },
  ) {
    const currentStreamId = client.data.currentStreamId as string | undefined;
    const joinedRooms = (client as Socket & { rooms?: Set<string> }).rooms;

    if (currentStreamId && currentStreamId !== payload.streamId) {
      await client.leave(currentStreamId);
      await this.emitPresenceUpdate(currentStreamId);
    }

    if (currentStreamId === payload.streamId && joinedRooms?.has(payload.streamId)) {
      await this.emitPresenceUpdate(payload.streamId);
      return { joined: true, streamId: payload.streamId, duplicate: true };
    }

    await client.join(payload.streamId);
    client.data.currentStreamId = payload.streamId;
    const user = client.data.user as { username?: string } | undefined;
    await this.emitPresenceUpdate(payload.streamId, user?.username);
    return { joined: true, streamId: payload.streamId };
  }

  @SubscribeMessage('leaveStreamRoom')
  async leaveStreamRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { streamId: string },
  ) {
    await client.leave(payload.streamId);
    if (client.data.currentStreamId === payload.streamId) {
      client.data.currentStreamId = undefined;
    }
    await this.emitPresenceUpdate(payload.streamId);
    return { left: true, streamId: payload.streamId };
  }

  @SubscribeMessage('startStream')
  async startStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: StartStreamDto,
  ) {
    const user = client.data.user as { sub: string; username: string };
    const stream = await this.streamsService.startStream(user.sub, user.username, dto);
    const followerIds = await this.streamsService.getFollowerIds(user.sub);
    await client.join(stream._id.toString());
    this.server.emit('streamStarted', stream);
    this.emitFollowerLiveNotification(followerIds, {
      streamId: stream._id.toString(),
      hostUserId: user.sub,
      hostUsername: user.username,
      title: stream.title,
    });
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
    this.emitStreamInviteNotification(payload.streamerUserId, {
      streamId: payload.streamId,
      hostUserId: client.data.user.sub,
      hostUsername: client.data.user.username,
      title: result.stream.title,
    });
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
      likerCount: result.likerCount,
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

  @SubscribeMessage('streamMediaState')
  async streamMediaState(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      streamId: string;
      isMuted: boolean;
      isCameraOff: boolean;
    },
  ) {
    this.emitMediaStateUpdated(payload.streamId, {
      userId: client.data.user.sub,
      username: client.data.user.username,
      isMuted: payload.isMuted,
      isCameraOff: payload.isCameraOff,
    });

    return { ok: true };
  }

  emitFollowerLiveNotification(
    followerIds: string[],
    payload: { streamId: string; hostUserId: string; hostUsername: string; title: string },
  ) {
    followerIds.forEach((followerId) => {
      this.server.to(this.userRoom(followerId)).emit('followedHostLive', payload);
    });
  }

  emitStreamInviteNotification(
    invitedUserId: string,
    payload: { streamId: string; hostUserId: string; hostUsername: string; title: string },
  ) {
    this.server.to(this.userRoom(invitedUserId)).emit('streamInviteReceived', payload);
  }

  emitMediaStateUpdated(
    streamId: string,
    payload: {
      userId: string;
      username: string;
      isMuted: boolean;
      isCameraOff: boolean;
    },
  ) {
    this.server.to(streamId).emit('streamMediaStateUpdated', {
      streamId,
      ...payload,
    });
  }

  emitStreamStopped(
    streamId: string,
    payload: {
      _id: string;
      status: 'live' | 'ended';
      endedAt?: Date | string;
      redirectToDispute?: boolean;
    },
  ) {
    this.server.to(streamId).emit('streamStopped', payload);
  }
}
