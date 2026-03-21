import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CompleteMiningDto {
  @IsNumber()
  @Min(1)
  watchedSeconds: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
