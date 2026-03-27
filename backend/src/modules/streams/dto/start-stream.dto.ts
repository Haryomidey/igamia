import { IsOptional, IsString } from 'class-validator';

export class StartStreamDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  orientation?: 'vertical' | 'horizontal' | 'pip' | 'screen-only';
}
