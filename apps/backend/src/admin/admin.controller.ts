import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ForbiddenException, Res } from '@nestjs/common';
import { Response } from 'express';
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

  @Get('registrations')
  getRegistrations(@CurrentUser() user: User) {
    this.guard(user);
    return this.adminService.getRegistrations();
  }

  @Get('registrations/export.csv')
  async exportRegistrationsCsv(@CurrentUser() user: User, @Res() res: Response) {
    this.guard(user);
    const csv = await this.adminService.getRegistrationsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    res.send('﻿' + csv); // BOM for Excel Hebrew support
  }
}
