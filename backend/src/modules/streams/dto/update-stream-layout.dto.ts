import { IsIn } from 'class-validator';

export class UpdateStreamLayoutDto {
  @IsIn(['vertical', 'horizontal', 'pip'])
  orientation: 'vertical' | 'horizontal' | 'pip';
}
