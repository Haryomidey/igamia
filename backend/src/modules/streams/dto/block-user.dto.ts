import { IsMongoId } from 'class-validator';

export class BlockUserDto {
  @IsMongoId()
  blockedUserId: string;
}
