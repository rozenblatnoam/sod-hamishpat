import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private rooms;
    constructor(rooms: RoomsService);
    findAll(user: any): Promise<(import("./room.entity").Room & {
        totalCases: number;
        completedCount: number;
        isCompleted: boolean;
    })[]>;
    findOne(id: string, user: any): Promise<import("./room.entity").Room & {
        totalCases: number;
        completedCount: number;
        isCompleted: boolean;
    }>;
}
