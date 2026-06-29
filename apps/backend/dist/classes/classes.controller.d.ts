import { ClassesService } from './classes.service';
export declare class ClassesController {
    private classesService;
    constructor(classesService: ClassesService);
    getClasses(user: any): Promise<{
        studentCount: number;
        id: string;
        name: string;
        teacherId: string;
        code: string;
        school: string;
        createdAt: Date;
    }[]>;
    createClass(user: any, body: {
        name: string;
    }): Promise<import("./class.entity").ClassRoom>;
    deleteClass(user: any, id: string): Promise<{
        success: boolean;
    }>;
    getClassStudents(user: any, id: string): Promise<{
        id: string;
        name: string;
        score: number;
        level: string;
        completedRooms: number;
        progressPercent: number;
    }[]>;
    getAllStudents(user: any): Promise<{
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
    joinClass(user: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
        className: string;
    }>;
}
