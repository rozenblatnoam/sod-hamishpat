import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Case } from './case.entity';
import { Progress } from '../progress/progress.entity';
import { User } from '../users/user.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Room } from '../rooms/room.entity';
import { Achievement } from '../achievements/achievement.entity';
import { POINTS, SCORE_THRESHOLDS } from '../shared/constants';

const LEVEL_ORDER_ARR = [
  'student',
  'trainee_judge',
  'judge',
  'chief_judge',
  'expert_judge',
] as const;

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case) private cases: Repository<Case>,
    @InjectRepository(Progress) private progress: Repository<Progress>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Lesson) private lessons: Repository<Lesson>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Achievement) private achievements: Repository<Achievement>,
  ) {}

  findByLesson(lessonId: string) {
    return this.cases.find({
      where: { lessonId },
      select: { id: true, lessonId: true, title: true, scenario: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const c = await this.cases.findOne({ where: { id } });
    if (!c) throw new NotFoundException('תיק לא נמצא');
    return c;
  }

  async submitVerdict(
    caseId: string,
    userId: string,
    verdict: string,
    _reasoning: string,
    hintsUsed: number = 0,
  ) {
    const caseData = await this.findOne(caseId);
    const correct = verdict === caseData.verdict;
    let roomCompleted = false;
    let earnedAchievement: { titleHe: string; icon: string; description: string; roomTitleHe: string } | null = null;

    if (correct) {
      let points = POINTS.CORRECT_VERDICT;
      if (hintsUsed === 0) points += POINTS.NO_HINT_BONUS;

      const user = await this.users.findOne({ where: { id: userId } });
      if (user) {
        user.score += points;
        this.updateLevel(user);
        await this.users.save(user);
      }

      try {
        const lesson = await this.lessons.findOne({ where: { id: caseData.lessonId } });
        if (lesson) {
          let prog = await this.progress.findOne({ where: { userId, roomId: lesson.roomId } });
          if (!prog) {
            prog = this.progress.create({ userId, roomId: lesson.roomId, completedQuestions: [] });
          }
          if (!prog.completedQuestions.includes(caseId)) {
            prog.completedQuestions = [...prog.completedQuestions, caseId];
          }

          const roomLessons = await this.lessons.find({ where: { roomId: lesson.roomId } });
          const totalCases = await this.cases.count({
            where: { lessonId: In(roomLessons.map((l) => l.id)) },
          });

          if (totalCases > 0 && prog.completedQuestions.length >= totalCases && !prog.completedAt) {
            prog.completedAt = new Date();
            roomCompleted = true;

            // Grant achievement for completing this room
            const room = await this.rooms.findOne({ where: { id: lesson.roomId } });
            if (room) {
              const condition = `complete_room_${room.order}`;
              const achievement = await this.achievements.findOne({
                where: { condition },
                relations: ['users'],
              });
              if (achievement) {
                const alreadyEarned = achievement.users?.some((u) => u.id === userId);
                if (!alreadyEarned) {
                  achievement.users = [...(achievement.users ?? []), { id: userId } as User];
                  await this.achievements.save(achievement);
                }
                earnedAchievement = {
                  titleHe: achievement.titleHe,
                  icon: achievement.icon,
                  description: achievement.description,
                  roomTitleHe: room.titleHe,
                };
              }
            }
          }

          await this.progress.save(prog);
        }
      } catch (_e) {}
    }

    return {
      correct,
      explanation: caseData.explanation,
      points: correct ? POINTS.CORRECT_VERDICT + (hintsUsed === 0 ? POINTS.NO_HINT_BONUS : 0) : 0,
      roomCompleted,
      achievement: earnedAchievement,
    };
  }

  private updateLevel(user: User) {
    for (let i = LEVEL_ORDER_ARR.length - 1; i >= 0; i--) {
      const lvl = LEVEL_ORDER_ARR[i];
      if (user.score >= SCORE_THRESHOLDS[lvl]) {
        user.level = lvl;
        break;
      }
    }
  }
}
