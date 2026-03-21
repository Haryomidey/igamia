import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  ConnectionRequest,
  ConnectionRequestDocument,
} from './schemas/connection-request.schema';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(ConnectionRequest.name)
    private readonly connectionRequestModel: Model<ConnectionRequestDocument>,
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
}
