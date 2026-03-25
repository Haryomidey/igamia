import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

type UploadMediaInput = {
  base64Data: string;
  mimeType?: string;
  fileName?: string;
  folder: string;
  resourceType?: 'auto' | 'image' | 'video' | 'raw';
};

@Injectable()
export class MediaService {
  constructor(private readonly configService: ConfigService) {}

  private getCloudinaryConfig() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException('Cloudinary is not configured');
    }

    return { cloudName, apiKey, apiSecret };
  }

  private getPublicBaseUrl() {
    return this.configService.get<string>('PUBLIC_BACKEND_URL')
      ?? `http://localhost:${this.configService.get<string>('PORT', '4000')}`;
  }

  private async saveLocally(input: UploadMediaInput, rawBase64: string, mimeType: string) {
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const safeFolder = input.folder.trim().replace(/^\/+|\/+$/g, '');
    const targetFolder = path.join(uploadsRoot, safeFolder);
    await fs.mkdir(targetFolder, { recursive: true });

    const extensionFromMime = mimeType.split('/')[1]?.split(';')[0] || 'bin';
    const fileStem = (input.fileName?.trim() || `upload-${Date.now()}`).replace(/[^\w.-]+/g, '-');
    const fileName = `${Date.now()}-${fileStem}.${extensionFromMime}`;
    const absolutePath = path.join(targetFolder, fileName);
    const buffer = Buffer.from(rawBase64, 'base64');
    await fs.writeFile(absolutePath, buffer);

    const relativePath = path.posix.join(
      safeFolder.split(path.sep).join('/'),
      fileName,
    );

    return {
      secureUrl: `${this.getPublicBaseUrl()}/uploads/${relativePath}`,
      publicId: relativePath,
      bytes: buffer.length,
      duration: undefined,
      resourceType: input.resourceType ?? 'auto',
      format: extensionFromMime,
    };
  }

  async uploadBase64(input: UploadMediaInput) {
    if (!input.base64Data?.trim()) {
      throw new BadRequestException('Media data is required');
    }

    const resourceType = input.resourceType ?? 'auto';
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = input.folder.trim().replace(/^\/+|\/+$/g, '');
    const mimeType = input.mimeType?.trim() || 'application/octet-stream';
    const rawBase64 = input.base64Data.includes(',')
      ? input.base64Data.split(',').pop() ?? ''
      : input.base64Data;

    if (!rawBase64) {
      throw new BadRequestException('Media data is invalid');
    }

    try {
      const { cloudName, apiKey, apiSecret } = this.getCloudinaryConfig();
      const signatureParams: Record<string, string | number> = {
        folder,
        timestamp,
      };

      if (input.fileName?.trim()) {
        signatureParams.filename_override = input.fileName.trim();
      }

      const signaturePayload = Object.entries(signatureParams)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
        .concat(apiSecret);
      const signature = createHash('sha1').update(signaturePayload).digest('hex');

      const formData = new FormData();
      formData.append('file', `data:${mimeType};base64,${rawBase64}`);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('folder', folder);
      formData.append('signature', signature);

      if (input.fileName?.trim()) {
        formData.append('filename_override', input.fileName.trim());
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      const payload = (await response.json()) as {
        secure_url?: string;
        public_id?: string;
        bytes?: number;
        duration?: number;
        resource_type?: string;
        format?: string;
        error?: { message?: string };
      };

      if (!response.ok || !payload.secure_url || !payload.public_id) {
        throw new InternalServerErrorException(
          payload.error?.message ?? 'Cloudinary upload failed',
        );
      }

      return {
        secureUrl: payload.secure_url,
        publicId: payload.public_id,
        bytes: payload.bytes ?? 0,
        duration: payload.duration,
        resourceType: payload.resource_type ?? resourceType,
        format: payload.format,
      };
    } catch (error) {
      if (
        error instanceof InternalServerErrorException &&
        error.message !== 'Cloudinary is not configured'
      ) {
        throw error;
      }

      return this.saveLocally(input, rawBase64, mimeType);
    }
  }
}
