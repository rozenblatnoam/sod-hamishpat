import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private achievements: AchievementsService) {}

  @Get()
  findAll() {
    return this.achievements.findAll();
  }

  @Get('me')
  findMine(@CurrentUser() user: any) {
    return this.achievements.findUserAchievements(user.id);
  }
}
