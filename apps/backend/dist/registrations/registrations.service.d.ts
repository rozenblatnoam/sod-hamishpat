import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Registration } from './registration.entity';
import { User } from '../users/user.entity';
export declare class RegistrationsService {
    private registrations;
    private users;
    private jwt;
    constructor(registrations: Repository<Registration>, users: Repository<User>, jwt: JwtService);
    register(dto: {
        name: string;
        phone: string;
        email: string;
        marketingConsent: boolean;
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
}
