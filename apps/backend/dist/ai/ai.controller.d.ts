import { AiService } from './ai.service';
declare class AskDto {
    question: string;
    context: string;
}
export declare class AiController {
    private ai;
    constructor(ai: AiService);
    ask(dto: AskDto): Promise<{
        answer: string;
    }>;
}
export {};
