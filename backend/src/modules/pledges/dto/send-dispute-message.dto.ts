import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DisputeAttachmentDto {
  @IsString()
  @MaxLength(160)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @IsIn(['image', 'video'])
  kind!: 'image' | 'video';

  @IsString()
  base64Data!: string;
}

export class SendDisputeMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(600)
  message?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => DisputeAttachmentDto)
  attachments?: DisputeAttachmentDto[];
}
