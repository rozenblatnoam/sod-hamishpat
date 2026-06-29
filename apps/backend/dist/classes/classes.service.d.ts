import { Repository } from 'typeorm';
import { ClassRoom } from './class.entity';
import { User } from '../users/user.entity';
import { Progress } from '../progress/progress.entity';
import { Room } from '../rooms/room.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Case } from '../cases/case.entity';
export declare class ClassesService {
    private classes;
    private users;
    private progress;
    private rooms;
    private lessons;
    private cases;
    constructor(classes: Repository<ClassRoom>, users: Repository<User>, progress: Repository<Progress>, rooms: Repository<Room>, lessons: Repository<Lesson>, cases: Repository<Case>);
    private generateCode;
    createClass(teacher: User, name: string): Promise<ClassRoom>;
    getClasses(teacher: User): Promise<{
        studentCount: number;
        id: string;
        name: string;
        teacherId: string;
        code: string;
        school: string;
        createdAt: Date;
    }[]>;
    deleteClass(teacher: User, classId: string): Promise<{
        success: boolean;
    }>;
    getClassStudents(teacher: User, classId: string): Promise<{
        id: string;
        name: string;
        score: number;
        level: string;
        completedRooms: number;
        progressPercent: number;
    }[]>;
    getAllStudents(teacher: User): Promise<{
        id: string;
        name: string;
        score: number;
        level: string;
        classCode: string | null;
    }[]>;
    getRoomsOverview(): Promise<{
        id: string;
        titleHe: string;
        topic: string;
        lessonCount: number;
        caseCount: number;
        lessons: {
            id: string;
            title: string;
            order: number;
        }[];
    }[]>;
    joinClass(student: User, code: string): Promise<{
        success: boolean;
        className: string;
    }>;
    private countTotalCases;
}
