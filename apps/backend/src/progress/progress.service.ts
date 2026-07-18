import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './progress.entity';
import { User } from '../users/user.entity';
import { POINTS, TOTAL_CASES, HINT_PENALTY } from '../shared/constants';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress) private progress: Repository<Progress>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  findAllByUser(userId: string) {
    return this.progress.find({ where: { userId } });
  }

  async update(
    userId: string,
    roomId: string,
    action: string,
    payload: any,
  ) {
    let prog = await this.progress.findOne({ where: { userId, roomId } });
    if (!prog) {
      prog = this.progress.create({ userId, roomId, completedQuestions: [] });
    }

    if (action === 'watch_video') {
      const user = await this.users.findOne({ where: { id: userId } });
      if (user) {
        user.score += POINTS.WATCH_VIDEO;
        await this.users.save(user);
      }
    }

    if (action === 'solve_riddle') {
      const user = await this.users.findOne({ where: { id: userId } });
      if (user) {
        user.score += POINTS.SOLVE_RIDDLE;
        await this.users.save(user);
      }
      if (payload.questionId && !prog.completedQuestions.includes(payload.questionId)) {
        prog.completedQuestions = [...prog.completedQuestions, payload.questionId];
      }
    }

    await this.progress.save(prog);
    return prog;
  }

  async syncScorm(
    userId: string,
    data: { hintsUsed?: number },
  ) {
    // Derive progress from DB — never trust client-supplied case lists
    const progRecords = await this.progress.find({ where: { userId } });
    const uniqueCases = [...new Set(progRecords.flatMap((p) => p.completedQuestions ?? []))];
    const uniqueRooms = [...new Set(
      progRecords.filter((p) => p.completedAt != null).map((p) => p.roomId),
    )];
    const hintsUsed = Math.max(0, Math.floor(data.hintsUsed ?? 0));
    const baseScore = Math.min(100, Math.round((uniqueCases.length / TOTAL_CASES) * 100));
    const score = Math.max(0, baseScore - hintsUsed * HINT_PENALTY);
    await this.users.update(userId, {
      scormProgress: {
        completedCases: uniqueCases,
        completedRooms: uniqueRooms,
        score,
        syncedAt: new Date().toISOString(),
      },
      score,
    });
    return { ok: true };
  }
}
