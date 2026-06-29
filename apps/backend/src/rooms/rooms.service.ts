import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Room } from './room.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Case } from '../cases/case.entity';
import { Progress } from '../progress/progress.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Lesson) private lessons: Repository<Lesson>,
    @InjectRepository(Case) private cases: Repository<Case>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
  ) {}

  findAll() {
    return this.rooms.find({ order: { order: 'ASC' } });
  }

  async findOne(id: string) {
    const room = await this.rooms.findOne({ where: { id } });
    if (!room) throw new NotFoundException('חדר לא נמצא');
    return room;
  }

  async findOneForUser(id: string, userId: string) {
    const rooms = await this.findAllForUser(userId);
    const room = rooms.find((r) => r.id === id);
    if (!room) throw new NotFoundException('חדר לא נמצא');
    return room;
  }

  async findAllForUser(userId: string) {
    const rooms = await this.findAll();
    const progress = await this.progress.find({ where: { userId } });
    const progressByRoom = new Map(progress.map((p) => [p.roomId, p]));

    const result: Array<Room & { totalCases: number; completedCount: number; isCompleted: boolean }> = [];
    let previousCompleted = true;
    for (const room of rooms) {
      const totalCases = await this.countCasesInRoom(room.id);
      const prog = progressByRoom.get(room.id);
      const completedCount = prog?.completedQuestions?.length ?? 0;
      const isCompleted = totalCases > 0 && completedCount >= totalCases;

      result.push({
        ...room,
        isLocked: room.order > 1 && !previousCompleted,
        totalCases,
        completedCount,
        isCompleted,
      });
      previousCompleted = isCompleted;
    }
    return result;
  }

  async countCasesInRoom(roomId: string) {
    const lessons = await this.lessons.find({ where: { roomId } });
    if (lessons.length === 0) return 0;
    return this.cases.count({ where: { lessonId: In(lessons.map((l) => l.id)) } });
  }
}
