import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import {
  ConnectionRequest,
  ConnectionRequestSchema,
} from './schemas/connection-request.schema';
import { UsersModule } from '../users/users.module';
import { SocialPost, SocialPostSchema } from './schemas/social-post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConnectionRequest.name, schema: ConnectionRequestSchema },
      { name: SocialPost.name, schema: SocialPostSchema },
    ]),
    UsersModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
