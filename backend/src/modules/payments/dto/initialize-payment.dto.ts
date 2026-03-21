import { IsNumber, IsPositive, IsString } from 'class-validator';

export class InitializePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  email: string;

  @IsString()
  purpose: string;
}
