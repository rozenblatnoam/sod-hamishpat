"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const SYSTEM_PROMPT = `אתה דיין מסייע במשחק "דיינים צעירים: בריחה מארמון המשפט".
תפקידך לעזור לתלמידי כיתות ז'-ח' להבין סוגיות במשפט העברי.

כללים:
1. ענה רק על שאלות הקשורות למשפט העברי (אבדה ומציאה, שומרים, נזיקין, מקח וממכר, יחסי שכנים)
2. השתמש בשפה פשוטה ומותאמת לגיל
3. ציין מקורות (משנה/גמרא) כשרלוונטי
4. אל תפתור את התיקים ישירות - כוון את התלמיד לחשוב
5. ענה תמיד בעברית
6. היה מעודד ותומך`;
let AiService = class AiService {
    constructor(config) {
        this.config = config;
        const apiKey = config.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new openai_1.default({ apiKey });
        }
    }
    async ask(question, context) {
        if (!this.openai)
            return 'הדיין המסייע אינו זמין כרגע (נדרש מפתח OpenAI).';
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `הקשר: ${context}\n\nשאלה: ${question}` },
                ],
                max_tokens: 500,
                temperature: 0.7,
            });
            return completion.choices[0].message.content ?? 'לא הצלחתי לענות';
        }
        catch (e) {
            return 'מצטער, הדיין המסייע אינו זמין כרגע. נסה שוב מאוחר יותר.';
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map