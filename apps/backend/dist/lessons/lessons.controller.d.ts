import { LessonsService } from './lessons.service';
export declare class LessonsController {
    private lessons;
    constructor(lessons: LessonsService);
    findByRoom(roomId: string): Promise<import("./lesson.entity").Lesson[]>;
    findOne(id: string): Promise<import("./lesson.entity").Lesson>;
}
