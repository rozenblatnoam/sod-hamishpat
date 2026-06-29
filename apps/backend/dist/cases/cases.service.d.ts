import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Progress } from '../progress/progress.entity';
import { User } from '../users/user.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Room } from '../rooms/room.entity';
import { Achievement } from '../achievements/achievement.entity';
export declare class CasesService {
    private cases;
    private progress;
    private users;
    private lessons;
    private rooms;
    private achievements;
    constructor(cases: Repository<Case>, progress: Repository<Progress>, users: Repository<User>, lessons: Repository<Lesson>, rooms: Repository<Room>, achievements: Repository<Achievement>);
    findByLesson(lessonId: string): Promise<Case[]>;
    findOne(id: string): Promise<Case>;
    submitVerdict(caseId: string, userId: string, verdict: string, _reasoning: string, hintsUsed?: number): Promise<{
        correct: boolean;
        explanation: string;
        points: number;
        roomCompleted: boolean;
        achievement: {
            titleHe: string;
            icon: string;
            description: string;
            roomTitleHe: string;
        } | null;
    }>;
    private updateLevel;
}
