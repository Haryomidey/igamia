import { IsNumber, IsPositive } from 'class-validator';

export class ConvertIgcDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
