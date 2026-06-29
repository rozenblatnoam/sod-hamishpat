import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClassRoom } from './class.entity';
import { User } from '../users/user.entity';
import { Progress } from '../progress/progress.entity';
import { Room } from '../rooms/room.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Case } from '../cases/case.entity';
import { LEVEL_LABELS } from '../shared/constants';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Lesson) private lessons: Repository<Lesson>,
    @InjectRepository(Case) private cases: Repository<Case>,
  ) {}

  private async generateCode(): Promise<string> {
    while (true) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const exists = await this.classes.findOne({ where: { code } });
      if (!exists) return code;
    }
  }

  async createClass(teacher: User, name: string) {
    const code = await this.generateCode();
    const cls = this.classes.create({ name, teacherId: teacher.id, school: teacher.school, code });
    return this.classes.save(cls);
  }

  async getClasses(teacher: User) {
    const classList = await this.classes.find({ where: { teacherId: teacher.id } });
    return Promise.all(
      classList.map(async (cls) => {
        const studentCount = await this.users.count({ where: { classCode: cls.code } });
        return { ...cls, studentCount };
      }),
    );
  }

  async deleteClass(teacher: User, classId: string) {
    const cls = await this.classes.findOne({ where: { id: classId, teacherId: teacher.id } });
    if (!cls) throw new NotFoundException('כיתה לא נמצאה');
    await this.classes.remove(cls);
    return { success: true };
  }

  async getClassStudents(teacher: User, classId: string) {
    const cls = await this.classes.findOne({ where: { id: classId, teacherId: teacher.id } });
    if (!cls) throw new NotFoundException('כיתה לא נמצאה');

    const students = await this.users.find({ where: { classCode: cls.code } });
    if (!students.length) return [];

    const progressRecords = await this.progress
      .createQueryBuilder('p')
      .where('p.userId IN (:...ids)', { ids: students.map((s) => s.id) })
      .getMany();

    const totalCases = await this.countTotalCases();

    return students.map((s) => {
      const prog = progressRecords.filter((p) => p.userId === s.id);
      const completedRooms = prog.filter((p) => p.completedAt).length;
      const completedCases = prog.reduce((acc, p) => acc + (p.completedQuestions?.length ?? 0), 0);
      return {
        id: s.id,
        name: s.name,
        score: s.score,
        level: LEVEL_LABELS[s.level] ?? s.level,
        completedRooms,
        progressPercent: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
      };
    });
  }

  async getAllStudents(teacher: User) {
    const classList = await this.classes.find({ where: { teacherId: teacher.id } });
    if (!classList.length) return [];
    const codes = classList.map((c) => c.code);
    const students = await this.users
      .createQueryBuilder('u')
      .where('u.classCode IN (:...codes)', { codes })
      .getMany();
    return students
      .map((s) => ({
        id: s.id,
        name: s.name,
        score: s.score,
        level: LEVEL_LABELS[s.level] ?? s.level,
        classCode: s.classCode,
      }))
      .sort((a, b) => b.score - a.score);
  }

  async getRoomsOverview() {
    const allRooms = await this.rooms.find({ order: { order: 'ASC' } });
    return Promise.all(
      allRooms.map(async (room) => {
        const roomLessons = await this.lessons.find({ where: { roomId: room.id } });
        const caseCount =
          roomLessons.length > 0
            ? await this.cases.count({ where: { lessonId: In(roomLessons.map((l) => l.id)) } })
            : 0;
        return {
          id: room.id,
          titleHe: room.titleHe,
          topic: room.topic,
          lessonCount: roomLessons.length,
          caseCount,
          lessons: roomLessons
            .sort((a, b) => a.order - b.order)
            .map((l) => ({ id: l.id, title: l.title, order: l.order })),
        };
      }),
    );
  }

  async joinClass(student: User, code: string) {
    const cls = await this.classes.findOne({ where: { code: code.toUpperCase() } });
    if (!cls) throw new NotFoundException('קוד כיתה לא נמצא');
    await this.users.update(student.id, { classCode: code.toUpperCase() });
    return { success: true, className: cls.name };
  }

  private async countTotalCases(): Promise<number> {
    const allRooms = await this.rooms.find();
    let total = 0;
    for (const room of allRooms) {
      const roomLessons = await this.lessons.find({ where: { roomId: room.id } });
      if (roomLessons.length > 0) {
        total += await this.cases.count({ where: { lessonId: In(roomLessons.map((l) => l.id)) } });
      }
    }
    return total;
  }
}
