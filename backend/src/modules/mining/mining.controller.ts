import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MiningService } from './mining.service';
import { CompleteMiningDto } from './dto/complete-mining.dto';

@UseGuards(JwtAuthGuard)
@Controller('mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @Get('status')
  getStatus(@CurrentUser() user: { sub: string }) {
    return this.miningService.getStatus(user.sub);
  }

  @Post('complete-watch')
  completeWatch(@CurrentUser() user: { sub: string }, @Body() dto: CompleteMiningDto) {
    return this.miningService.completeWatch(user.sub, dto);
  }
}
