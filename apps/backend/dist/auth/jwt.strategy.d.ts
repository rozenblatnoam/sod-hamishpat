import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private auth;
    constructor(config: ConfigService, auth: AuthService);
    validate(payload: {
        sub: string;
    }): Promise<import("../users/user.entity").User>;
}
export {};
