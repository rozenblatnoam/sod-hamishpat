import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private guard(user: User) {
    if (user.role !== 'admin') throw new ForbiddenException('גישת מנהל בלבד');
  }

  @Get('stats')
  getStats(@CurrentUser() user: User) {
    this.guard(user);
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@CurrentUser() user: User) {
    this.guard(user);
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  updateRole(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { role: 'student' | 'teacher' | 'admin' }) {
    this.guard(user);
    return this.adminService.updateUserRole(user.id, id, body.role);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() user: User, @Param('id') id: string) {
    this.guard(user);
    return this.adminService.deleteUser(user.id, id);
  }

  @Get('rooms')
  getRooms(@CurrentUser() user: User) {
    this.guard(user);
    return this.adminService.getRooms();
  }

  @Patch('rooms/:id/lock')
  toggleLock(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { isLocked: boolean }) {
    this.guard(user);
    return this.adminService.toggleRoomLock(id, body.isLocked);
  }

  @Delete('users/:id/progress')
  resetProgress(@CurrentUser() user: User, @Param('id') id: string) {
    this.guard(user);
    return this.adminService.resetUserProgress(id);
  }
}
