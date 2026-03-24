import {
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

export type PledgeResultClaimNotification = {
  matchId: string;
  title: string;
  claimedByUserId: string;
  claimedByUsername: string;
  outcome: 'win' | 'loss' | 'draw';
  note?: string;
};

export type PledgeResultResolvedNotification = {
  matchId: string;
  title: string;
  decision: 'approved' | 'rejected';
  winnerUserId?: string;
  loserUserId?: string;
  isDraw?: boolean;
  disputed?: boolean;
};

export type PledgeDisputeUpdatedNotification = {
  matchId: string;
  title: string;
  message: string;
  senderUsername: string;
  senderRole: 'streamer' | 'assistant';
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

  emitResultClaimed(userIds: string[], payload: PledgeResultClaimNotification) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('pledgeResultClaimed', payload);
    });
  }

  emitResultResolved(userIds: string[], payload: PledgeResultResolvedNotification) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('pledgeResultResolved', payload);
    });
  }

  emitDisputeUpdated(userIds: string[], payload: PledgeDisputeUpdatedNotification) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('pledgeDisputeUpdated', payload);
    });
  }
}
