import { IsString, MaxLength } from 'class-validator';

export class SendDisputeMessageDto {
  @IsString()
  @MaxLength(600)
  message!: string;
}
