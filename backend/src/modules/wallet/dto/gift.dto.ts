import { IsMongoId, IsNumber, IsPositive, IsString } from 'class-validator';

export class GiftDto {
  @IsMongoId()
  receiverUserId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  description: string;
}
