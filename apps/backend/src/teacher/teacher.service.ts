import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Progress } from '../progress/progress.entity';
import { LEVEL_LABELS } from '../shared/constants';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
  ) {}

  async getClassStats(teacher: User) {
    if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
      throw new ForbiddenException('גישה לאזור מורה בלבד');
    }

    const students = await this.users.find({
      where: { school: teacher.school, role: 'student' },
    });

    const studentIds = students.map((s) => s.id);
    const progressRecords = studentIds.length
      ? await this.progress
          .createQueryBuilder('p')
          .where('p.userId IN (:...ids)', { ids: studentIds })
          .getMany()
      : [];

    const enriched = students.map((s) => {
      const prog = progressRecords.filter((p) => p.userId === s.id);
      const completedRooms = prog.filter((p) => p.completedAt).length;
      return {
        id: s.id,
        name: s.name,
        score: s.score,
        level: LEVEL_LABELS[s.level],
        completedRooms,
      };
    });

    const avgScore = students.length
      ? Math.round(students.reduce((a, s) => a + s.score, 0) / students.length)
      : 0;

    const avgCompletion = enriched.length
      ? Math.round((enriched.reduce((a, s) => a + s.completedRooms, 0) / enriched.length) * (100 / 6))
      : 0;

    return {
      totalStudents: students.length,
      avgScore,
      avgCompletion,
      students: enriched,
    };
  }
}
