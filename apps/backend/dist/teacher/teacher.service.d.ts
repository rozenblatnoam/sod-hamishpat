import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Progress } from '../progress/progress.entity';
export declare class TeacherService {
    private users;
    private progress;
    constructor(users: Repository<User>, progress: Repository<Progress>);
    getClassStats(teacher: User): Promise<{
        totalStudents: number;
        avgScore: number;
        avgCompletion: number;
        students: {
            id: string;
            name: string;
            score: number;
            level: string;
            completedRooms: number;
        }[];
    }>;
}
