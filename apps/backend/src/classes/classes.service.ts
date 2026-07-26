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
    const MAX_ATTEMPTS = 100;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const exists = await this.classes.findOne({ where: { code } });
      if (!exists) return code;
    }
    throw new Error('Failed to generate unique class code after maximum attempts');
  }

  async createClass(teacher: User, name: string) {
    const code = await this.generateCode();
    const cls = this.classes.create({ name, teacherId: teacher.id, school: teacher.school, code });
    return this.classes.save(cls);
  }

  async getClasses(teacher: User) {
    const classList = await this.classes.find({ where: { teacherId: teacher.id } });
    if (!classList.length) return [];
    const codes = classList.map((c) => c.code);
    const counts = await this.users
      .createQueryBuilder('u')
      .select('u.classCode', 'code')
      .addSelect('COUNT(*)', 'count')
      .where('u.classCode IN (:...codes)', { codes })
      .groupBy('u.classCode')
      .getRawMany<{ code: string; count: string }>();
    const countMap = new Map(counts.map((r) => [r.code, parseInt(r.count, 10)]));
    return classList.map((cls) => ({ ...cls, studentCount: countMap.get(cls.code) ?? 0 }));
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
        completedRooms: s.scormProgress?.completedRooms?.length ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }

  async getRoomsOverview() {
    const allRooms = await this.rooms.find({ order: { order: 'ASC' } });
    if (!allRooms.length) return [];

    const allLessons = await this.lessons.find({
      where: { roomId: In(allRooms.map((r) => r.id)) },
      order: { order: 'ASC' },
    });
    const lessonIds = allLessons.map((l) => l.id);
    const caseCounts =
      lessonIds.length > 0
        ? await this.cases
            .createQueryBuilder('c')
            .select('c.lessonId', 'lessonId')
            .addSelect('COUNT(*)', 'count')
            .where('c.lessonId IN (:...ids)', { ids: lessonIds })
            .groupBy('c.lessonId')
            .getRawMany<{ lessonId: string; count: string }>()
        : [];

    const caseCountMap = new Map(caseCounts.map((r) => [r.lessonId, parseInt(r.count, 10)]));
    const lessonsByRoom = new Map<string, typeof allLessons>();
    for (const lesson of allLessons) {
      const list = lessonsByRoom.get(lesson.roomId) ?? [];
      list.push(lesson);
      lessonsByRoom.set(lesson.roomId, list);
    }

    return allRooms.map((room) => {
      const roomLessons = lessonsByRoom.get(room.id) ?? [];
      const caseCount = roomLessons.reduce((sum, l) => sum + (caseCountMap.get(l.id) ?? 0), 0);
      return {
        id: room.id,
        titleHe: room.titleHe,
        topic: room.topic,
        lessonCount: roomLessons.length,
        caseCount,
        lessons: roomLessons.map((l) => ({ id: l.id, title: l.title, order: l.order })),
      };
    });
  }

  async joinClass(student: User, code: string) {
    const cls = await this.classes.findOne({ where: { code: code.toUpperCase() } });
    if (!cls) throw new NotFoundException('קוד כיתה לא נמצא');
    await this.users.update(student.id, { classCode: code.toUpperCase() });
    return { success: true, className: cls.name };
  }

  private async countTotalCases(): Promise<number> {
    const result = await this.cases
      .createQueryBuilder('c')
      .select('COUNT(*)', 'total')
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }
}
