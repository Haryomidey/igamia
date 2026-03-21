import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async getStream(streamId: string) {
    const stream = await this.requireStream(streamId);
    const comments = await this.streamCommentModel.find({ streamId: stream._id }).sort({ createdAt: -1 }).limit(50).lean();

    return {
      stream: stream.toObject(),
      comments: comments.reverse(),
    };
  }

  async startStream(userId: string, username: string, dto: StartStreamDto) {
    const shareUrl = `https://igamia.app/stream/${new Types.ObjectId().toString()}`;

    const stream = await this.streamModel.create({
      hostUserId: this.objectId(userId),
      title: dto.title,
      description: dto.description ?? '',
      category: dto.category ?? 'General',
      status: 'live',
      participants: [
        {
          userId: this.objectId(userId),
          role: 'host',
          username,
          joinedAt: new Date(),
        },
      ],
      shareUrl,
      livekitRoomName: `igamia-stream-${userId}-${Date.now()}`,
    });

    return stream.toObject();
  }

  async stopStream(streamId: string, userId: string) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);
    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();
    return stream.toObject();
  }

  async inviteStreamer(streamId: string, userId: string, dto: InviteStreamerDto) {
    const stream = await this.requireStream(streamId);
    this.ensureHost(stream, userId);

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
      },
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

    await this.streamLikeModel.create({
      streamId: stream._id,
      userId: this.objectId(userId),
      username,
      count: 1,
    });

    return {
      likesCount: stream.likesCount,
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
      hostUserId: stream.hostUserId.toString(),
    };
  }
}
