import {
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { promises as fs } from 'fs';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import { Stream, StreamDocument } from './schemas/stream.schema';
import { StreamComment, StreamCommentDocument } from './schemas/stream-comment.schema';
import { StreamLike, StreamLikeDocument } from './schemas/stream-like.schema';
import { StartStreamDto } from './dto/start-stream.dto';
import { InviteStreamerDto } from './dto/invite-streamer.dto';
import { CommentStreamDto } from './dto/comment-stream.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { GiftDto } from '../wallet/dto/gift.dto';
import { SendStreamGiftDto } from './dto/send-stream-gift.dto';
import { SocialService } from '../social/social.service';

@Injectable()
export class StreamsService {
  constructor(
    @InjectModel(Stream.name) private readonly streamModel: Model<StreamDocument>,
    @InjectModel(StreamComment.name)
    private readonly streamCommentModel: Model<StreamCommentDocument>,
    @InjectModel(StreamLike.name)
    private readonly streamLikeModel: Model<StreamLikeDocument>,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly socialService: SocialService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private objectId(id: string) {
    return new Types.ObjectId(id);
  }

  private async requireStream(streamId: string) {
    const stream = await this.streamModel.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return stream;
  }

  private ensureHost(stream: StreamDocument, userId: string) {
    if (stream.hostUserId.toString() !== userId) {
      throw new ForbiddenException('Only the host can perform this action');
    }
  }

  private ensureNotBlocked(stream: StreamDocument, userId: string) {
    const isBlocked = stream.blockedUserIds.some(
      (blockedId: Types.ObjectId) => blockedId.toString() === userId,
    );
    if (isBlocked) {
      throw new ForbiddenException('You are blocked from this live stream');
    }
  }

  async listActiveStreams() {
    return this.streamModel.find({ status: 'live' }).sort({ createdAt: -1 }).lean();
  }

  async listRecordedStreams(userId: string) {
    return this.streamModel
      .find({
        hostUserId: this.objectId(userId),
        recordingUrl: { $ne: '' },
      })
      .sort({ recordedAt: -1, endedAt: -1, createdAt: -1 })
      .lean();
  }

  async getParticipantUserIds(streamId: string) {
    const stream = await this.requireStream(streamId);
    return stream.participants.map((participant: Stream['participants'][number]) =>
      participant.userId.toString(),
    );
  }

  async getStream(streamId: string) {
    const stream = await this.requireStream(streamId);
    const comments = await this.streamCommentModel.find({ streamId: stream._id }).sort({ createdAt: -1 }).limit(50).lean();

    return {
      stream: stream.toObject(),
      comments: comments.reverse(),
    };
  }

  async createViewerToken(streamId: string, userId: string, username: string) {
    const stream = await this.requireStream(streamId);
    this.ensureNotBlocked(stream, userId);

    const livekitHost = this.configService.get<string>('LIVEKIT_HOST');
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    if (!livekitHost || !apiKey || !apiSecret) {
      throw new InternalServerErrorException('LiveKit is not configured');
    }

    const canPublish = stream.participants.some(
      (participant: Stream['participants'][number]) =>
        participant.userId.toString() === userId && participant.role !== 'invited',
    );

    const token = await this.jwtService.signAsync(
      {
        video: {
          room: stream.livekitRoomName,
          roomJoin: true,
          canPublish,
          canSubscribe: true,
        },
        metadata: JSON.stringify({
          streamId: stream.id,
          username,
        }),
        name: username,
      },
      {
        secret: apiSecret,
        issuer: apiKey,
        subject: userId,
        expiresIn: '1h',
      } as any,
    );

    return {
      token,
      url: livekitHost,
      roomName: stream.livekitRoomName,
      canPublish,
    };
  }

  async startStream(userId: string, username: string, dto: StartStreamDto) {
    const hostUser = await this.usersService.findById(userId);
    const shareUrl = `https://igamia.app/stream/${new Types.ObjectId().toString()}`;
    const roomName = `igamia-stream-${userId}-${Date.now()}`;

    const stream = await this.streamModel.create({
      hostUserId: this.objectId(userId),
      title: dto.title,
      description: dto.description ?? '',
      category: dto.category ?? 'General',
      mode: 'normal',
      status: 'live',
      participants: [
        {
          userId: this.objectId(userId),
          role: 'host',
          username,
          avatarUrl: hostUser?.avatarUrl ?? '',
          joinedAt: new Date(),
        },
      ],
      shareUrl,
      roomName,
      livekitRoomName: roomName,
    });

    return stream.toObject();
  }

  async startPledgeStream(match: {
    _id: Types.ObjectId | string;
    hostUserId?: Types.ObjectId | string;
    title: string;
    gameTitle: string;
    participants: Array<{ userId: Types.ObjectId | string; username: string }>;
  }) {
    const hostParticipant = match.participants[0];
    if (!match.hostUserId || !hostParticipant) {
      throw new BadRequestException('Pledge stream requires a host');
    }

    const existing = await this.streamModel.findOne({
      matchId: this.objectId(match._id.toString()),
      status: 'live',
    });
    if (existing) {
      return existing.toObject();
    }

    const roomName = `igamia-pledge-${match._id.toString()}-${Date.now()}`;

    const stream = await this.streamModel.create({
      roomName,
      hostUserId: this.objectId(match.hostUserId.toString()),
      title: match.title,
      description: `${match.gameTitle} pledge match is now live.`,
      category: match.gameTitle,
      mode: 'pledge',
      matchId: this.objectId(match._id.toString()),
      status: 'live',
      participants: match.participants.map((participant, index) => ({
        userId: this.objectId(participant.userId.toString()),
        role: index === 0 ? 'host' : 'guest',
        username: participant.username,
        avatarUrl: '',
        joinedAt: new Date(),
      })),
      shareUrl: `https://igamia.app/stream/${new Types.ObjectId().toString()}`,
      livekitRoomName: roomName,
    });

    return stream.toObject();
  }

  getFollowerIds(userId: string) {
    return this.socialService.getFollowerIds(userId);
  }

  async stopStream(streamId: string, userId: string) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);
    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();
    return stream.toObject();
  }

  async saveRecording(
    streamId: string,
    userId: string,
    payload: {
      fileName?: string;
      mimeType?: string;
      base64Data: string;
      durationSeconds?: number;
      baseUrl: string;
    },
  ) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);

    if (!payload.base64Data?.trim()) {
      throw new BadRequestException('Recording data is required');
    }

    const mimeType = payload.mimeType?.trim() || 'video/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const base64 = payload.base64Data.includes(',')
      ? payload.base64Data.split(',').pop() ?? ''
      : payload.base64Data;
    const buffer = Buffer.from(base64, 'base64');

    if (!buffer.length) {
      throw new BadRequestException('Recording file is empty');
    }

    const recordingsDir = path.join(process.cwd(), 'uploads', 'recordings');
    await fs.mkdir(recordingsDir, { recursive: true });

    const fileName = `stream-${streamId}-${Date.now()}.${extension}`;
    const filePath = path.join(recordingsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const normalizedBaseUrl = payload.baseUrl.replace(/\/$/, '');
    stream.recordingUrl = `${normalizedBaseUrl}/uploads/recordings/${fileName}`;
    stream.recordedAt = new Date();
    stream.recordingDurationSeconds = Math.max(0, Math.round(payload.durationSeconds ?? 0));
    await stream.save();

    return {
      message: 'Recording saved successfully',
      recordingUrl: stream.recordingUrl,
      recordedAt: stream.recordedAt,
      recordingDurationSeconds: stream.recordingDurationSeconds,
      stream: stream.toObject(),
    };
  }

  async inviteStreamer(streamId: string, userId: string, dto: InviteStreamerDto) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);

    if (dto.streamerUserId === userId) {
      throw new BadRequestException('You cannot invite yourself to your own live stream');
    }

    if (stream.mode === 'pledge') {
      throw new BadRequestException('Pledge live sessions cannot invite extra users');
    }

    const invitedUser = await this.usersService.findById(dto.streamerUserId);
    if (!invitedUser) {
      throw new NotFoundException('Invited streamer not found');
    }

    const alreadyParticipant = stream.participants.some(
      (participant: Stream['participants'][number]) =>
        participant.userId.toString() === dto.streamerUserId,
    );

    if (!alreadyParticipant) {
      stream.participants.push({
        userId: this.objectId(dto.streamerUserId),
        role: 'invited',
        username: invitedUser.username,
        avatarUrl: invitedUser.avatarUrl,
        joinedAt: new Date(),
      });
      await stream.save();
    }

    return {
      message: 'Streamer invited successfully',
      stream: stream.toObject(),
      invitedUser: {
        id: invitedUser.id,
        username: invitedUser.username,
        avatarUrl: invitedUser.avatarUrl,
      },
    };
  }

  async acceptInvite(streamId: string, userId: string) {
    const stream = await this.requireStream(streamId);

    const participant = stream.participants.find(
      (entry: Stream['participants'][number]) => entry.userId.toString() === userId,
    );

    if (!participant) {
      throw new NotFoundException('Live invite not found');
    }

    if (participant.role !== 'invited') {
      throw new BadRequestException('This live invite has already been handled');
    }

    participant.role = 'guest';
    participant.joinedAt = new Date();
    await stream.save();

    return {
      message: 'Live invite accepted',
      stream: stream.toObject(),
      participant: {
        userId,
        username: participant.username,
        role: participant.role,
      },
    };
  }

  async leaveStream(streamId: string, userId: string) {
    const stream = await this.requireStream(streamId);

    if (stream.hostUserId.toString() === userId) {
      throw new BadRequestException('Host cannot leave the stream. End the live instead.');
    }

    const participant = stream.participants.find(
      (entry: Stream['participants'][number]) => entry.userId.toString() === userId,
    );

    if (!participant) {
      throw new NotFoundException('You are not part of this live stream');
    }

    stream.participants = stream.participants.filter(
      (entry: Stream['participants'][number]) => entry.userId.toString() !== userId,
    );
    await stream.save();

    return {
      message: participant.role === 'invited' ? 'Live invite declined' : 'You left the live stream',
      removedUserId: userId,
      removedUsername: participant.username,
      reason: participant.role === 'invited' ? 'declined' : 'left',
      stream: stream.toObject(),
    };
  }

  async removeParticipant(streamId: string, userId: string, participantUserId: string) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);

    if (participantUserId === userId) {
      throw new BadRequestException('Host cannot remove themselves from the stream');
    }

    const targetParticipant = stream.participants.find(
      (participant: Stream['participants'][number]) =>
        participant.userId.toString() === participantUserId,
    );

    if (!targetParticipant) {
      throw new NotFoundException('Participant not found in this stream');
    }

    stream.participants = stream.participants.filter(
      (participant: Stream['participants'][number]) =>
        participant.userId.toString() !== participantUserId,
    );
    await stream.save();

    return {
      message: 'Participant removed from stream',
      removedUserId: participantUserId,
      removedUsername: targetParticipant.username,
      reason: 'removed',
      stream: stream.toObject(),
    };
  }

  async shareStream(streamId: string) {
    const stream = await this.requireStream(streamId);
    stream.sharesCount += 1;
    await stream.save();

    return {
      message: 'Stream shared successfully',
      sharesCount: stream.sharesCount,
      shareUrl: stream.shareUrl,
    };
  }

  async likeStream(streamId: string, userId: string, username: string) {
    const stream = await this.requireStream(streamId);
    this.ensureNotBlocked(stream, userId);

    if (stream.hostUserId.toString() === userId) {
      throw new ForbiddenException('You cannot like your own stream');
    }

    stream.likesCount += 1;
    await stream.save();

    const likeRecord = await this.streamLikeModel.findOneAndUpdate(
      {
        streamId: stream._id,
        userId: this.objectId(userId),
      },
      {
        $set: { username },
        $inc: { count: 1 },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return {
      likesCount: stream.likesCount,
      likerCount: likeRecord?.count ?? 1,
    };
  }

  async commentOnStream(streamId: string, userId: string, username: string, dto: CommentStreamDto) {
    const stream = await this.requireStream(streamId);
    this.ensureNotBlocked(stream, userId);

    const comment = await this.streamCommentModel.create({
      streamId: stream._id,
      userId: this.objectId(userId),
      username,
      message: dto.message,
    });

    stream.commentsCount += 1;
    await stream.save();

    return comment.toObject();
  }

  async blockUser(streamId: string, userId: string, dto: BlockUserDto) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);

    if (dto.blockedUserId === userId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const exists = stream.blockedUserIds.some(
      (blockedUserId: Types.ObjectId) => blockedUserId.toString() === dto.blockedUserId,
    );

    if (!exists) {
      stream.blockedUserIds.push(this.objectId(dto.blockedUserId));
      stream.participants = stream.participants.filter(
        (participant: Stream['participants'][number]) =>
          participant.userId.toString() !== dto.blockedUserId,
      );
      await stream.save();
    }

    return {
      message: 'User blocked from stream',
      blockedUserId: dto.blockedUserId,
    };
  }

  async giftStream(streamId: string, senderUserId: string, dto: SendStreamGiftDto) {
    const stream = await this.requireStream(streamId);
    this.ensureNotBlocked(stream, senderUserId);

    const result = await this.walletService.sendGift(senderUserId, {
      receiverUserId: stream.hostUserId.toString(),
      amount: dto.amount,
      description: dto.description || `Gift sent during ${stream.title}`,
    } as GiftDto);

    return {
      ...result,
      streamId,
      streamTitle: stream.title,
      hostUserId: stream.hostUserId.toString(),
    };
  }
}
