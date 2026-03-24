import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  upload(
    @CurrentUser() user: { sub: string },
    @Body()
    body: {
      fileName?: string;
      mimeType?: string;
      base64Data: string;
      purpose?: 'post' | 'stream-recording';
      resourceType?: 'auto' | 'image' | 'video' | 'raw';
    },
  ) {
    const folder =
      body.purpose === 'stream-recording'
        ? `igamia/users/${user.sub}/stream-recordings`
        : `igamia/users/${user.sub}/posts`;

    return this.mediaService.uploadBase64({
      ...body,
      folder,
      resourceType: body.resourceType ?? 'auto',
    });
  }
}
