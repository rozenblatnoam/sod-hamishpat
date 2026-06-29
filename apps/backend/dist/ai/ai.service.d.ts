import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private config;
    private openai;
    constructor(config: ConfigService);
    ask(question: string, context: string): Promise<string>;
}
