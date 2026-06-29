import { ProgressService } from './progress.service';
export declare class ProgressController {
    private progress;
    constructor(progress: ProgressService);
    findAll(user: any): Promise<import("./progress.entity").Progress[]>;
    update(roomId: string, body: {
        action: string;
        [key: string]: any;
    }, user: any): Promise<import("./progress.entity").Progress>;
}
