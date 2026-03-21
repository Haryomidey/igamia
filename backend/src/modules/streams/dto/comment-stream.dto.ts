import { IsString, MaxLength } from 'class-validator';

export class CommentStreamDto {
  @IsString()
  @MaxLength(300)
  message: string;
}
