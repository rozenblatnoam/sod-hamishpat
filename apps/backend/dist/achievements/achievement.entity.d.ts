import { User } from '../users/user.entity';
export declare class Achievement {
    id: string;
    title: string;
    titleHe: string;
    description: string;
    icon: string;
    condition: string;
    users: User[];
    createdAt: Date;
}
