import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

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
  @Max(2)
  maxPlayers?: number;
}