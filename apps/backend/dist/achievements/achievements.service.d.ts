import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';
export declare class AchievementsService {
    private achievements;
    constructor(achievements: Repository<Achievement>);
    findAll(): Promise<Achievement[]>;
    findUserAchievements(userId: string): Promise<Achievement[]>;
}
