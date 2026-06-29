import { Lesson } from '../lessons/lesson.entity';
export declare class Room {
    id: string;
    order: number;
    title: string;
    titleHe: string;
    description: string;
    topic: string;
    isLocked: boolean;
    lessons: Lesson[];
    createdAt: Date;
}
