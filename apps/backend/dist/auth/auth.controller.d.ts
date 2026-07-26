import { AuthService } from './auth.service';
declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    school: string;
    class?: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
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
    login(dto: LoginDto): Promise<{
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
    googleLogin(idToken: string): Promise<{
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
    me(user: any): {
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
export {};
