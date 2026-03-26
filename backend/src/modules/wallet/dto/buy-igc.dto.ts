import { IsNumber, IsPositive } from 'class-validator';

export class BuyIgcDto {
  @IsNumber()
  @IsPositive()
  amountNgn: number;
}
