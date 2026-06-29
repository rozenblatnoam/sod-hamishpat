import { User } from '../users/user.entity';
import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    private guard;
    getStats(user: User): Promise<{
        totalUsers: number;
        totalTeachers: number;
        totalStudents: number;
        totalClasses: number;
        totalRooms: number;
        topStudents: User[];
    }>;
    getUsers(user: User): Promise<User[]>;
    updateRole(user: User, id: string, body: {
        role: 'student' | 'teacher' | 'admin';
    }): Promise<{
        success: boolean;
    }>;
    deleteUser(user: User, id: string): Promise<{
        success: boolean;
    }>;
    getRooms(user: User): Promise<import("../rooms/room.entity").Room[]>;
    toggleLock(user: User, id: string, body: {
        isLocked: boolean;
    }): Promise<{
        success: boolean;
    }>;
    resetProgress(user: User, id: string): Promise<{
        success: boolean;
    }>;
}
