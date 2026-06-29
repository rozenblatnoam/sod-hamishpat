import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LessonsController {
  constructor(private lessons: LessonsService) {}

  @Get('rooms/:roomId/lessons')
  findByRoom(@Param('roomId') roomId: string) {
    return this.lessons.findByRoom(roomId);
  }

  @Get('lessons/:id')
  findOne(@Param('id') id: string) {
    return this.lessons.findOne(id);
  }
}
