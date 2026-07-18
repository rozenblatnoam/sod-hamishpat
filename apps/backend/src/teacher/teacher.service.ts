import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LEVEL_LABELS } from '../shared/constants';

const TOTAL_ROOMS = 6;

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async getClassStats(teacher: User) {
    if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
      throw new ForbiddenException('גישה לאזור מורה בלבד');
    }

    if (!teacher.school) return { totalStudents: 0, avgScore: 0, avgCompletion: 0, students: [] };
    const where: Record<string, string> = { school: teacher.school, role: 'student' };
    if (teacher.class) where.class = teacher.class;
    const students = await this.users.find({ where });

    const enriched = students.map((s) => {
      const completedRooms = s.scormProgress?.completedRooms?.length ?? 0;
      const completedCases = s.scormProgress?.completedCases?.length ?? 0;
      return {
        id: s.id,
        name: s.name,
        score: s.score,
        level: LEVEL_LABELS[s.level],
        completedRooms,
        completedCases,
      };
    });

    const avgScore = students.length
      ? Math.round(students.reduce((a, s) => a + s.score, 0) / students.length)
      : 0;

    const avgCompletion = enriched.length
      ? Math.round(
          (enriched.reduce((a, s) => a + s.completedRooms, 0) / enriched.length) *
            (100 / TOTAL_ROOMS),
        )
      : 0;

    return {
      totalStudents: students.length,
      avgScore,
      avgCompletion,
      students: enriched,
    };
  }
}
