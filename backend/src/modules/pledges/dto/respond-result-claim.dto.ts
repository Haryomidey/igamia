import { IsEnum } from 'class-validator';

const CLAIM_DECISION = {
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

export class RespondResultClaimDto {
  @IsEnum(CLAIM_DECISION)
  decision!: 'approve' | 'reject';
}
