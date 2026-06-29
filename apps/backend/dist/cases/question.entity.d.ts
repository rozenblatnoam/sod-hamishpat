import { Case } from './case.entity';
export declare class Question {
    id: string;
    case: Case;
    caseId: string;
    order: number;
    text: string;
    type: 'multiple_choice' | 'open' | 'verdict';
    options: string[] | null;
    correctAnswer: string;
    points: number;
    createdAt: Date;
}
