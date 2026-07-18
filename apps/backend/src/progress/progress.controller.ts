import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progress: ProgressService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.progress.findAllByUser(user.id);
  }

  @Post('sync')
  syncScorm(
    @Body() body: { hintsUsed?: number },
    @CurrentUser() user: any,
  ) {
    return this.progress.syncScorm(user.id, body);
  }

  @Post(':roomId')
  update(
    @Param('roomId') roomId: string,
    @Body() body: { action: string; [key: string]: any },
    @CurrentUser() user: any,
  ) {
    return this.progress.update(user.id, roomId, body.action, body);
  }
}
