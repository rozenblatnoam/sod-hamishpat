import { Lesson } from '../lessons/lesson.entity';
import { Question } from '../cases/question.entity';
import { VerdictOption } from '../shared/constants';
export declare class Case {
    id: string;
    lesson: Lesson;
    lessonId: string;
    title: string;
    scenario: string;
    verdict: VerdictOption;
    explanation: string;
    questions: Question[];
    createdAt: Date;
}
