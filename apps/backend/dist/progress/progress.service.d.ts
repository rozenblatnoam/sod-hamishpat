import { Repository } from 'typeorm';
import { Progress } from './progress.entity';
import { User } from '../users/user.entity';
export declare class ProgressService {
    private progress;
    private users;
    constructor(progress: Repository<Progress>, users: Repository<User>);
    findAllByUser(userId: string): Promise<Progress[]>;
    update(userId: string, roomId: string, action: string, payload: any): Promise<Progress>;
}
