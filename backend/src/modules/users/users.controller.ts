import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { SafeUserProfile, UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('username-availability')
  checkUsernameAvailability(@Query('username') username = '') {
    return this.usersService.checkUsernameAvailability(username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { sub: string }): Promise<SafeUserProfile> {
    return this.usersService.safeProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<SafeUserProfile> {
    return this.usersService.updateProfile(user.sub, dto);
  }
}
