import { IsMongoId } from 'class-validator';

export class InviteStreamerDto {
  @IsMongoId()
  streamerUserId: string;
}
