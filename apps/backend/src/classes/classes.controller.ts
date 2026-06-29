import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ClassesService } from './classes.service';

@ApiTags('classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teacher')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get('classes')
  getClasses(@CurrentUser() user: any) {
    return this.classesService.getClasses(user);
  }

  @Post('classes')
  createClass(@CurrentUser() user: any, @Body() body: { name: string }) {
    return this.classesService.createClass(user, body.name);
  }

  @Delete('classes/:id')
  deleteClass(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classesService.deleteClass(user, id);
  }

  @Get('classes/:id/students')
  getClassStudents(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classesService.getClassStudents(user, id);
  }

  @Get('all-students')
  getAllStudents(@CurrentUser() user: any) {
    return this.classesService.getAllStudents(user);
  }

  @Get('rooms-overview')
  getRoomsOverview() {
    return this.classesService.getRoomsOverview();
  }

  @Post('join-class')
  joinClass(@CurrentUser() user: any, @Body() body: { code: string }) {
    return this.classesService.joinClass(user, body.code);
  }
}
