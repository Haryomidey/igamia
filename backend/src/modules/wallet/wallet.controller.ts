import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { GiftDto } from './dto/gift.dto';
import { ConvertIgcDto } from './dto/convert-igc.dto';
import { BuyIgcDto } from './dto/buy-igc.dto';

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

  @Post('convert-igc')
  convertIgc(@CurrentUser() user: { sub: string }, @Body() dto: ConvertIgcDto) {
    return this.walletService.convertIgcToNgn(user.sub, dto.amount);
  }

  @Post('buy-igc')
  buyIgc(@CurrentUser() user: { sub: string }, @Body() dto: BuyIgcDto) {
    return this.walletService.buyIgc(user.sub, dto.amountNgn);
  }

  @Post('gift')
  sendGift(@CurrentUser() user: { sub: string }, @Body() dto: GiftDto) {
    return this.walletService.sendGift(user.sub, dto);
  }
}
