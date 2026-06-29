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
        user: any;
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        user: any;
    }>;
    findById(id: string): Promise<User | null>;
    sanitize(user: User): any;
}
