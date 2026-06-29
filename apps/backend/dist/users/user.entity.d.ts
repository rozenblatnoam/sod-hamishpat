import { UserLevel } from '../shared/constants';
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    school: string;
    class: string;
    level: UserLevel;
    score: number;
    role: 'student' | 'teacher' | 'admin';
    classCode: string | null;
    firebaseUid: string;
    createdAt: Date;
    updatedAt: Date;
}
