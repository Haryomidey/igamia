import { IsNumber, IsPositive } from 'class-validator';

export class RequestJoinMatchDto {
  @IsNumber()
  @IsPositive()
  amountUsd!: number;
}
