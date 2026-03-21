import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { GiftDto } from './dto/gift.dto';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  getWallet(@CurrentUser() user: { sub: string }) {
    return this.walletService.getWallet(user.sub);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: { sub: string }, @Body() dto: WithdrawDto) {
    return this.walletService.withdraw(user.sub, dto);
  }

  @Post('gift')
  sendGift(@CurrentUser() user: { sub: string }, @Body() dto: GiftDto) {
    return this.walletService.sendGift(user.sub, dto);
  }
}
