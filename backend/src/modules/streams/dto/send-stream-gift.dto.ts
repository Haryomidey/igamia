import { IsNumber, IsPositive, IsString } from 'class-validator';

export class SendStreamGiftDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  description!: string;
}
