import { IsNumber, IsPositive } from 'class-validator';

export class PlacePledgeDto {
  @IsNumber()
  @IsPositive()
  amountUsd!: number;
}
