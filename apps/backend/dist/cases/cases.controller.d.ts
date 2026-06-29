import { CasesService } from './cases.service';
declare class VerdictDto {
    verdict: string;
    reasoning: string;
    hintsUsed?: number;
}
export declare class CasesController {
    private cases;
    constructor(cases: CasesService);
    findByLesson(lessonId: string): Promise<import("./case.entity").Case[]>;
    findOne(id: string): Promise<import("./case.entity").Case>;
    submitVerdict(id: string, dto: VerdictDto, user: any): Promise<{
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
}
export {};
