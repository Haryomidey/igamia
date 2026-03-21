import { Body, Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('paystack/initialize')
  initialize(
    @CurrentUser() user: { sub: string },
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePaystackPayment(user.sub, dto);
  }

  @Get('paystack/callback')
  verify(@Query('reference') reference: string) {
    return this.paymentsService.verifyPaystackPayment(reference);
  }
}
