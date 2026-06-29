import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TeacherService } from './teacher.service';

@ApiTags('teacher')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teacher')
export class TeacherController {
  constructor(private teacher: TeacherService) {}

  @Get('class-stats')
  getClassStats(@CurrentUser() user: any) {
    return this.teacher.getClassStats(user);
  }
}
