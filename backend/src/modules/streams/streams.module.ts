import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';
import { StreamsGateway } from './streams.gateway';
import { Stream, StreamSchema } from './schemas/stream.schema';
import { StreamComment, StreamCommentSchema } from './schemas/stream-comment.schema';
import { StreamLike, StreamLikeSchema } from './schemas/stream-like.schema';
import { UsersModule } from '../users/users.module';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { WalletModule } from '../wallet/wallet.module';
import { SocialModule } from '../social/social.module';
import { MediaModule } from '../media/media.module';

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
      { name: Stream.name, schema: StreamSchema },
      { name: StreamComment.name, schema: StreamCommentSchema },
      { name: StreamLike.name, schema: StreamLikeSchema },
    ]),
    UsersModule,
    WalletModule,
    SocialModule,
    MediaModule,
  ],
  controllers: [StreamsController],
  providers: [StreamsService, StreamsGateway, WsJwtGuard],
  exports: [StreamsService],
})
export class StreamsModule {}
