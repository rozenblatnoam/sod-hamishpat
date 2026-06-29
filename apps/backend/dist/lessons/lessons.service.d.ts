import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
export declare class LessonsService {
    private lessons;
    constructor(lessons: Repository<Lesson>);
    findByRoom(roomId: string): Promise<Lesson[]>;
    findOne(id: string): Promise<Lesson>;
}
