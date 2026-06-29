import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `אתה דיין מסייע במשחק "דיינים צעירים: בריחה מארמון המשפט".
תפקידך לעזור לתלמידי כיתות ז'-ח' להבין סוגיות במשפט העברי.

כללים:
1. ענה רק על שאלות הקשורות למשפט העברי (אבדה ומציאה, שומרים, נזיקין, מקח וממכר, יחסי שכנים)
2. השתמש בשפה פשוטה ומותאמת לגיל
3. ציין מקורות (משנה/גמרא) כשרלוונטי
4. אל תפתור את התיקים ישירות - כוון את התלמיד לחשוב
5. ענה תמיד בעברית
6. היה מעודד ותומך`;

@Injectable()
export class AiService {
  private openai: OpenAI | undefined;

  constructor(private config: ConfigService) {
    const apiKey = config.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async ask(question: string, context: string): Promise<string> {
    if (!this.openai) return 'הדיין המסייע אינו זמין כרגע (נדרש מפתח OpenAI).';
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
    } catch (e) {
      return 'מצטער, הדיין המסייע אינו זמין כרגע. נסה שוב מאוחר יותר.';
    }
  }
}
