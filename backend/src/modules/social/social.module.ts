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
import { DirectMessage, DirectMessageSchema } from './schemas/direct-message.schema';
import { SocialGateway } from './social.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    MongooseModule.forFeature([
      { name: ConnectionRequest.name, schema: ConnectionRequestSchema },
      { name: SocialPost.name, schema: SocialPostSchema },
      { name: DirectMessage.name, schema: DirectMessageSchema },
    ]),
    UsersModule,
  ],
  controllers: [SocialController],
  providers: [SocialService, SocialGateway, WsJwtGuard],
  exports: [SocialService],
})
export class SocialModule {}
