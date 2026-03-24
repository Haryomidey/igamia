import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  ConnectionRequest,
  ConnectionRequestDocument,
} from './schemas/connection-request.schema';
import { SocialPost, SocialPostDocument } from './schemas/social-post.schema';

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

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(ConnectionRequest.name)
    private readonly connectionRequestModel: Model<ConnectionRequestDocument>,
    @InjectModel(SocialPost.name)
    private readonly socialPostModel: Model<SocialPostDocument>,
    private readonly usersService: UsersService,
  ) {}

  async discover(userId: string) {
    const users = await this.connectionRequestModel.db
      .collection('users')
      .find({ _id: { $ne: new Types.ObjectId(userId) } })
      .limit(12)
      .toArray();

    return users.map((user: any) => ({
      id: user._id,
      name: user.username,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    }));
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

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    const existing = await this.connectionRequestModel.findOne({
      fromUserId: new Types.ObjectId(userId),
      toUserId: new Types.ObjectId(targetUserId),
      status: 'pending',
    });

    if (existing) {
      return existing;
    }

    return this.connectionRequestModel.create({
      fromUserId: new Types.ObjectId(userId),
      toUserId: new Types.ObjectId(targetUserId),
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
    const requests = await this.connectionRequestModel
      .find({
        toUserId: new Types.ObjectId(userId),
        status: 'accepted',
      })
      .lean();

    return requests.map((request) => request.fromUserId.toString());
  }
}
