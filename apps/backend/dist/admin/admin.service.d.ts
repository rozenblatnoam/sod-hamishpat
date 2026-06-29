import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';
import { Progress } from '../progress/progress.entity';
import { ClassRoom } from '../classes/class.entity';
export declare class AdminService {
    private users;
    private rooms;
    private progress;
    private classes;
    constructor(users: Repository<User>, rooms: Repository<Room>, progress: Repository<Progress>, classes: Repository<ClassRoom>);
    getStats(): Promise<{
        totalUsers: number;
        totalTeachers: number;
        totalStudents: number;
        totalClasses: number;
        totalRooms: number;
        topStudents: User[];
    }>;
    getUsers(): Promise<User[]>;
    updateUserRole(adminId: string, userId: string, role: 'student' | 'teacher' | 'admin'): Promise<{
        success: boolean;
    }>;
    deleteUser(adminId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getRooms(): Promise<Room[]>;
    toggleRoomLock(roomId: string, isLocked: boolean): Promise<{
        success: boolean;
    }>;
    resetUserProgress(userId: string): Promise<{
        success: boolean;
    }>;
}
