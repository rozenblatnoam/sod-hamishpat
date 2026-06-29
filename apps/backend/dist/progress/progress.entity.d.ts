import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';
export declare class Progress {
    id: string;
    userId: string;
    user: User;
    roomId: string;
    room: Room;
    lessonId: string;
    completedQuestions: string[];
    score: number;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
