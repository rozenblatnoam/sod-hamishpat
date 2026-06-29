import { Room } from '../rooms/room.entity';
import { Case } from '../cases/case.entity';
export declare class Lesson {
    id: string;
    room: Room;
    roomId: string;
    order: number;
    title: string;
    content: string;
    sourceContent: string | null;
    videoUrl: string;
    cases: Case[];
    createdAt: Date;
}
