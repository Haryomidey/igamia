import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { MediaService } from '../media/media.service';

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
    private readonly mediaService: MediaService,
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

  private ensureNotRemoved(stream: StreamDocument, userId: string) {
    const isRemoved = stream.removedParticipantUserIds?.some(
      (removedId: Types.ObjectId) => removedId.toString() === userId,
    );

    if (isRemoved) {
      throw new ForbiddenException('You have been removed from this live stream');
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
    this.ensureNotRemoved(stream, userId);

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
    const title = dto.title.trim().slice(0, 120);
    const description = dto.description?.trim()
      ? dto.description.trim().slice(0, 220)
      : `Welcome to ${username} stream, please like, comment and support creator and be respectful.`;
    const category = dto.category?.trim() ? dto.category.trim().slice(0, 60) : 'General';

    const stream = await this.streamModel.create({
      hostUserId: this.objectId(userId),
      title,
      description,
      category,
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
    const updatedStream = await this.streamModel.findOneAndUpdate(
      { _id: stream._id, hostUserId: this.objectId(userId) },
      {
        $set: {
          status: 'ended',
          endedAt: new Date(),
          participants: [],
        },
      },
      { new: true },
    );

    if (!updatedStream) {
      throw new NotFoundException('Stream not found');
    }

    return updatedStream.toObject();
  }

  async saveRecording(
    streamId: string,
    userId: string,
    payload: {
      fileName?: string;
      mimeType?: string;
      base64Data: string;
      durationSeconds?: number;
    },
  ) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);

    if (!payload.base64Data?.trim()) {
      throw new BadRequestException('Recording data is required');
    }

    const uploadedRecording = await this.mediaService.uploadBase64({
      base64Data: payload.base64Data,
      mimeType: payload.mimeType || 'video/webm',
      fileName: payload.fileName?.trim() || `stream-${streamId}-${Date.now()}`,
      folder: `igamia/users/${userId}/stream-recordings`,
      resourceType: 'video',
    });

    stream.recordingUrl = uploadedRecording.secureUrl;
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

    const wasRemoved = stream.removedParticipantUserIds?.some(
      (removedId: Types.ObjectId) => removedId.toString() === dto.streamerUserId,
    );

    if (wasRemoved) {
      throw new ForbiddenException('This participant was removed from the live');
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

    const alreadyRemoved = (stream.removedParticipantUserIds ?? []).some(
      (removedId: Types.ObjectId) => removedId.toString() === participantUserId,
    );

    if (!alreadyRemoved) {
      stream.removedParticipantUserIds = stream.removedParticipantUserIds ?? [];
      stream.removedParticipantUserIds.push(this.objectId(participantUserId));
    }

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
    const stream = await this.streamModel.findByIdAndUpdate(
      streamId,
      { $inc: { sharesCount: 1 } },
      { new: true },
    );

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

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

    const updatedStream = await this.streamModel.findByIdAndUpdate(
      streamId,
      { $inc: { likesCount: 1 } },
      { new: true },
    );

    if (!updatedStream) {
      throw new NotFoundException('Stream not found');
    }

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
      likesCount: updatedStream.likesCount,
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

    await this.streamModel.updateOne(
      { _id: stream._id },
      { $inc: { commentsCount: 1 } },
    );

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
      if (
        !(stream.removedParticipantUserIds ?? []).some(
          (removedId: Types.ObjectId) => removedId.toString() === dto.blockedUserId,
        )
      ) {
        stream.removedParticipantUserIds = stream.removedParticipantUserIds ?? [];
        stream.removedParticipantUserIds.push(this.objectId(dto.blockedUserId));
      }
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
