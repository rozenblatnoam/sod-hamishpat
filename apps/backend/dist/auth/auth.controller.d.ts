import { AuthService } from './auth.service';
declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    school: string;
    role?: 'student' | 'teacher';
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
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    googleLogin(idToken: string): Promise<{
        token: string;
        user: any;
    }>;
    me(user: any): any;
}
export {};
