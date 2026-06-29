import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';
import { Progress } from '../progress/progress.entity';
import { ClassRoom } from '../classes/class.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
  ) {}

  async getStats() {
    const [totalUsers, totalTeachers, totalStudents, totalClasses, totalRooms] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { role: 'teacher' } }),
      this.users.count({ where: { role: 'student' } }),
      this.classes.count(),
      this.rooms.count(),
    ]);
    const topStudents = await this.users.find({
      where: { role: 'student' },
      order: { score: 'DESC' },
      take: 5,
      select: ['id', 'name', 'email', 'score', 'level'],
    });
    return { totalUsers, totalTeachers, totalStudents, totalClasses, totalRooms, topStudents };
  }

  async getUsers() {
    return this.users.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'score', 'level', 'school', 'classCode', 'createdAt'],
    });
  }

  async updateUserRole(adminId: string, userId: string, role: 'student' | 'teacher' | 'admin') {
    if (adminId === userId) throw new ForbiddenException('לא ניתן לשנות את תפקיד עצמך');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('משתמש לא נמצא');
    await this.users.update(userId, { role });
    return { success: true };
  }

  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) throw new ForbiddenException('לא ניתן למחוק את עצמך');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('משתמש לא נמצא');
    await this.users.remove(user);
    return { success: true };
  }

  async getRooms() {
    return this.rooms.find({ order: { order: 'ASC' } });
  }

  async toggleRoomLock(roomId: string, isLocked: boolean) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('חדר לא נמצא');
    await this.rooms.update(roomId, { isLocked });
    return { success: true };
  }

  async resetUserProgress(userId: string) {
    await this.progress.delete({ userId });
    await this.users.update(userId, { score: 0 });
    return { success: true };
  }
}
