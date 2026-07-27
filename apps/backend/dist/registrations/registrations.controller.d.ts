import { RegistrationsService } from './registrations.service';
declare class RegisterPublicDto {
    name: string;
    phone: string;
    email: string;
    marketingConsent: boolean;
}
export declare class RegistrationsController {
    private registrations;
    constructor(registrations: RegistrationsService);
    register(dto: RegisterPublicDto): Promise<{
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
export {};
