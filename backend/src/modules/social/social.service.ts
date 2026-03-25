import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  ConnectionRequest,
  ConnectionRequestDocument,
} from './schemas/connection-request.schema';
import { SocialPost, SocialPostDocument } from './schemas/social-post.schema';
import { DirectMessage, DirectMessageDocument } from './schemas/direct-message.schema';

export type FeedPost = {
  _id: unknown;
  userId: unknown;
  username: string;
  userFullName: string;
  avatarUrl: string;
  content: string;
  mediaUrl: string;
  mediaType: 'text' | 'image' | 'video';
  likedByUserIds: Types.ObjectId[];
  likedByMe: boolean;
  likesCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SocialFriend = {
  id: unknown;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
};

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(ConnectionRequest.name)
    private readonly connectionRequestModel: Model<ConnectionRequestDocument>,
    @InjectModel(SocialPost.name)
    private readonly socialPostModel: Model<SocialPostDocument>,
    @InjectModel(DirectMessage.name)
    private readonly directMessageModel: Model<DirectMessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  private objectId(id: string) {
    return new Types.ObjectId(id);
  }

  async getConnectedUserIds(userId: string) {
    const accepted = await this.connectionRequestModel
      .find({
        status: 'accepted',
        $or: [
          { fromUserId: this.objectId(userId) },
          { toUserId: this.objectId(userId) },
        ],
      })
      .lean();

    return accepted.map((request) =>
      request.fromUserId.toString() === userId
        ? request.toUserId.toString()
        : request.fromUserId.toString(),
    );
  }

  async areConnected(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      return true;
    }

    const connection = await this.connectionRequestModel.findOne({
      status: 'accepted',
      $or: [
        {
          fromUserId: this.objectId(userId),
          toUserId: this.objectId(targetUserId),
        },
        {
          fromUserId: this.objectId(targetUserId),
          toUserId: this.objectId(userId),
        },
      ],
    });

    return Boolean(connection);
  }

  async discover(userId: string) {
    const [users, connectedIds, outgoingPendingIds, incomingPendingIds] = await Promise.all([
      this.connectionRequestModel.db
      .collection('users')
      .find({ _id: { $ne: new Types.ObjectId(userId) } })
      .limit(30)
      .toArray(),
      this.getConnectedUserIds(userId),
      this.connectionRequestModel
        .find({
          fromUserId: this.objectId(userId),
          status: 'pending',
        })
        .lean(),
      this.connectionRequestModel
        .find({
          toUserId: this.objectId(userId),
          status: 'pending',
        })
        .lean(),
    ]);

    const connectedSet = new Set(connectedIds);
    const outgoingSet = new Set(outgoingPendingIds.map((request) => request.toUserId.toString()));
    const incomingSet = new Set(incomingPendingIds.map((request) => request.fromUserId.toString()));

    return users
      .map((user: any) => ({
        id: user._id,
        name: user.username,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        connected: connectedSet.has(user._id.toString()),
        pendingRequestSent: outgoingSet.has(user._id.toString()),
        pendingRequestReceived: incomingSet.has(user._id.toString()),
      }))
      .sort((left, right) => Number(right.connected) - Number(left.connected) || left.username.localeCompare(right.username));
  }

  async getRequests(userId: string) {
    return this.connectionRequestModel
      .find({ toUserId: new Types.ObjectId(userId), status: 'pending' })
      .populate('fromUserId', 'username fullName avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
  }

  async sendRequest(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot send a request to yourself');
    }

    if (await this.areConnected(userId, targetUserId)) {
      throw new BadRequestException('You are already connected to this user');
    }

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const existing = await this.connectionRequestModel.findOne({
      status: 'pending',
      $or: [
        {
          fromUserId: this.objectId(userId),
          toUserId: this.objectId(targetUserId),
        },
        {
          fromUserId: this.objectId(targetUserId),
          toUserId: this.objectId(userId),
        },
      ],
    });

    if (existing) {
      return existing;
    }

    return this.connectionRequestModel.create({
      fromUserId: this.objectId(userId),
      toUserId: this.objectId(targetUserId),
      status: 'pending',
    });
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.connectionRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.toUserId.toString() !== userId) {
      throw new BadRequestException('You cannot accept this request');
    }

    request.status = 'accepted';
    await request.save();
    return request;
  }

  async listFriends(userId: string): Promise<SocialFriend[]> {
    const connectedUserIds = await this.getConnectedUserIds(userId);
    if (!connectedUserIds.length) {
      return [];
    }

    const users = await this.connectionRequestModel.db
      .collection('users')
      .find({ _id: { $in: connectedUserIds.map((id) => this.objectId(id)) } })
      .toArray();

    return users.map((user: any) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    }));
  }

  async listFeed(userId: string): Promise<FeedPost[]> {
    const posts = await this.socialPostModel.find().sort({ createdAt: -1 }).limit(40).lean();
    return posts.map((post) => ({
      ...post,
      likedByMe: post.likedByUserIds.some((likedUserId) => likedUserId.toString() === userId),
      likesCount: post.likedByUserIds.length,
    }));
  }

  async createPost(
    userId: string,
    payload: { content?: string; mediaUrl?: string; mediaType?: 'text' | 'image' | 'video' },
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!payload.content?.trim() && !payload.mediaUrl?.trim()) {
      throw new BadRequestException('Post content or media is required');
    }

    return this.socialPostModel.create({
      userId: new Types.ObjectId(userId),
      username: user.username,
      userFullName: user.fullName,
      avatarUrl: user.avatarUrl,
      content: payload.content?.trim() || '',
      mediaUrl: payload.mediaUrl?.trim() || '',
      mediaType: payload.mediaType ?? (payload.mediaUrl ? 'image' : 'text'),
      likedByUserIds: [],
    });
  }

  async togglePostLike(postId: string, userId: string) {
    const post = await this.socialPostModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const alreadyLiked = post.likedByUserIds.some((likedUserId) => likedUserId.toString() === userId);
    if (alreadyLiked) {
      post.likedByUserIds = post.likedByUserIds.filter((likedUserId) => likedUserId.toString() !== userId);
    } else {
      post.likedByUserIds.push(new Types.ObjectId(userId));
    }

    await post.save();

    return {
      postId: post.id,
      likesCount: post.likedByUserIds.length,
      likedByMe: !alreadyLiked,
    };
  }

  async getFollowerIds(userId: string) {
    return this.getConnectedUserIds(userId);
  }

  async listMessages(userId: string, targetUserId: string) {
    if (!(await this.areConnected(userId, targetUserId))) {
      throw new BadRequestException('Only connected users can view direct messages');
    }

    return this.directMessageModel
      .find({
        $or: [
          { fromUserId: this.objectId(userId), toUserId: this.objectId(targetUserId) },
          { fromUserId: this.objectId(targetUserId), toUserId: this.objectId(userId) },
        ],
      })
      .sort({ createdAt: 1 })
      .lean();
  }

  async sendDirectMessage(userId: string, targetUserId: string, message: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot message yourself');
    }

    if (!(await this.areConnected(userId, targetUserId))) {
      throw new BadRequestException('Only connected users can send direct messages');
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      throw new BadRequestException('Message is required');
    }

    const created = await this.directMessageModel.create({
      fromUserId: this.objectId(userId),
      toUserId: this.objectId(targetUserId),
      message: trimmedMessage,
    });

    const sender = await this.usersService.findById(userId);
    return {
      _id: created.id,
      fromUserId: userId,
      toUserId: targetUserId,
      message: created.message,
      fromUsername: sender?.username ?? '',
      createdAt: created.createdAt,
    };
  }
}