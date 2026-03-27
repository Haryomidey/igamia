import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { SocialService } from './social.service';

@WebSocketGateway({
  namespace: '/social',
  cors: {
    origin: true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class SocialGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socialService: SocialService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private userRoom(userId: string) {
    return `user:${userId}`;
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
      }) as { sub: string; username: string };

      client.data.user = user;
      void client.join(this.userRoom(user.sub));
    } catch {
      return true;
    }

    return true;
  }

  @SubscribeMessage('social:createPost')
  async createPost(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content?: string; mediaUrl?: string; mediaType?: 'text' | 'image' | 'video' },
  ) {
    const user = client.data.user as { sub: string };
    const post = await this.socialService.createPost(user.sub, payload);
    this.emitPostCreated(post);
    return post;
  }

  emitPostCreated(post: unknown) {
    this.server.emit('social:postCreated', post);
  }

  emitPostLiked(payload: unknown) {
    this.server.emit('social:postLiked', payload);
  }

  emitPostCommented(payload: unknown) {
    this.server.emit('social:postCommented', payload);
  }

  emitPostUpdated(payload: unknown) {
    this.server.emit('social:postUpdated', payload);
  }

  emitRequestReceived(targetUserId: string, payload: unknown) {
    this.server.to(this.userRoom(targetUserId)).emit('social:requestReceived', payload);
  }

  emitRequestAccepted(targetUserId: string, payload: unknown) {
    this.server.to(this.userRoom(targetUserId)).emit('social:requestAccepted', payload);
  }

  emitDirectMessage(targetUserId: string, payload: unknown) {
    this.server.to(this.userRoom(targetUserId)).emit('social:directMessageReceived', payload);
  }
}
