import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

export type PledgeJoinNotification = {
  id: string;
  matchId: string;
  title: string;
  gameTitle: string;
  hostUserId: string;
  joinedByUserId: string;
  joinedByUsername: string;
  amountUsd: number;
  joinedAt: string;
};

export type PledgeJoinResolutionNotification = {
  matchId: string;
  title: string;
  gameTitle: string;
  action: 'accepted' | 'rejected';
  streamId?: string;
  hostUsername: string;
  joinedByUserId: string;
  joinedByUsername: string;
};

@WebSocketGateway({
  namespace: '/pledges',
  cors: {
    origin: true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class PledgesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const user = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      }) as { sub: string; username: string; email: string };

      client.data.user = user;
      await client.join(this.userRoom(user.sub));
    } catch {
      client.disconnect();
      return false;
    }

    return true;
  }

  handleDisconnect(_client: Socket) {
    return true;
  }

  emitJoinNotification(hostUserId: string, payload: PledgeJoinNotification) {
    this.server.to(this.userRoom(hostUserId)).emit('pledgeJoinRequested', payload);
  }

  emitJoinAccepted(userIds: string[], payload: PledgeJoinResolutionNotification) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('pledgeJoinAccepted', payload);
    });
  }

  emitJoinRejected(requesterUserId: string, payload: PledgeJoinResolutionNotification) {
    this.server.to(this.userRoom(requesterUserId)).emit('pledgeJoinRejected', payload);
  }
}
