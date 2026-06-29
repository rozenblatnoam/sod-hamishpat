import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './progress.entity';
import { User } from '../users/user.entity';
import { POINTS } from '../shared/constants';

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
}
