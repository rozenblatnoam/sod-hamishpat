import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class TeacherService {
    private users;
    constructor(users: Repository<User>);
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
            completedCases: number;
        }[];
    }>;
}
