import { IsDateString, IsMongoId, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsMongoId()
  gameId!: string;

  @IsString()
  title!: string;

  @IsDateString()
  scheduledFor!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  minimumStakeUsd?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxPlayers?: number;
}
