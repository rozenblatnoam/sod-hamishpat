import { TeacherService } from './teacher.service';
export declare class TeacherController {
    private teacher;
    constructor(teacher: TeacherService);
    getClassStats(user: any): Promise<{
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
