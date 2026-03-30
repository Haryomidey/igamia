import { IsIn } from 'class-validator';

export class UpdateStreamLayoutDto {
  @IsIn(['vertical', 'horizontal', 'pip', 'screen-only', 'grid', 'host-focus'])
  orientation: 'vertical' | 'horizontal' | 'pip' | 'screen-only' | 'grid' | 'host-focus';
}
