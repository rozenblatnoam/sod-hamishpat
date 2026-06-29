import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Case } from '../cases/case.entity';
import { Progress } from '../progress/progress.entity';
export declare class RoomsService {
    private rooms;
    private lessons;
    private cases;
    private progress;
    constructor(rooms: Repository<Room>, lessons: Repository<Lesson>, cases: Repository<Case>, progress: Repository<Progress>);
    findAll(): Promise<Room[]>;
    findOne(id: string): Promise<Room>;
    findOneForUser(id: string, userId: string): Promise<Room & {
        totalCases: number;
        completedCount: number;
        isCompleted: boolean;
    }>;
    findAllForUser(userId: string): Promise<(Room & {
        totalCases: number;
        completedCount: number;
        isCompleted: boolean;
    })[]>;
    countCasesInRoom(roomId: string): Promise<number>;
}
