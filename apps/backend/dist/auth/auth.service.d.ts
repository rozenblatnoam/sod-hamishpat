import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
export declare class AuthService {
    private users;
    private jwt;
    constructor(users: Repository<User>, jwt: JwtService);
    register(dto: {
        name: string;
        email: string;
        password: string;
        school: string;
        class?: string;
        role?: 'student' | 'teacher';
    }): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            school: string;
            class: string;
            level: import("../shared/constants").UserLevel;
            score: number;
            role: "student" | "teacher" | "admin";
            classCode: string | null;
            firebaseUid: string;
            scormProgress: {
                completedCases: string[];
                completedRooms: string[];
                score: number;
                syncedAt: string;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            school: string;
            class: string;
            level: import("../shared/constants").UserLevel;
            score: number;
            role: "student" | "teacher" | "admin";
            classCode: string | null;
            firebaseUid: string;
            scormProgress: {
                completedCases: string[];
                completedRooms: string[];
                score: number;
                syncedAt: string;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    loginWithFirebase(idToken: string): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            school: string;
            class: string;
            level: import("../shared/constants").UserLevel;
            score: number;
            role: "student" | "teacher" | "admin";
            classCode: string | null;
            firebaseUid: string;
            scormProgress: {
                completedCases: string[];
                completedRooms: string[];
                score: number;
                syncedAt: string;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    findById(id: string): Promise<User | null>;
    sanitize(user: User): {
        id: string;
        name: string;
        email: string;
        school: string;
        class: string;
        level: import("../shared/constants").UserLevel;
        score: number;
        role: "student" | "teacher" | "admin";
        classCode: string | null;
        firebaseUid: string;
        scormProgress: {
            completedCases: string[];
            completedRooms: string[];
            score: number;
            syncedAt: string;
        } | null;
        createdAt: Date;
        updatedAt: Date;
    };
}
