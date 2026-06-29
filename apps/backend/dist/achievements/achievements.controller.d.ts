import { AchievementsService } from './achievements.service';
export declare class AchievementsController {
    private achievements;
    constructor(achievements: AchievementsService);
    findAll(): Promise<import("./achievement.entity").Achievement[]>;
    findMine(user: any): Promise<import("./achievement.entity").Achievement[]>;
}
