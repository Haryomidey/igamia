import { IsIn } from 'class-validator';

export class UpdateStreamLayoutDto {
  @IsIn(['vertical', 'horizontal', 'pip', 'screen-only'])
  orientation: 'vertical' | 'horizontal' | 'pip' | 'screen-only';
}
