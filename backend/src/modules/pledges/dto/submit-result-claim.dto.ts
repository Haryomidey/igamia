import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const RESULT_OUTCOME = {
  WIN: 'win',
  LOSS: 'loss',
  DRAW: 'draw',
  DISPUTE: 'dispute',
} as const;

export class SubmitResultClaimDto {
  @IsEnum(RESULT_OUTCOME)
  outcome!: 'win' | 'loss' | 'draw' | 'dispute';

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
