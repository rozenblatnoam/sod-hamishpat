"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const bcrypt = require("bcryptjs");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'postgres',
    database: process.env.DB_NAME ?? 'dyanim',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
});
async function seed() {
    await AppDataSource.initialize();
    const roomRepo = AppDataSource.getRepository('rooms');
    const lessonRepo = AppDataSource.getRepository('lessons');
    const caseRepo = AppDataSource.getRepository('cases');
    const userRepo = AppDataSource.getRepository('users');
    const achievementRepo = AppDataSource.getRepository('achievements');
    const rooms = await roomRepo.save([
        { order: 1, title: 'Lost and Found Hall', titleHe: 'אולם האבידות', topic: 'אבדה ומציאה', description: 'בחדר זה תלמד על חוקי אבדה ומציאה', isLocked: false },
        { order: 2, title: 'Guardians Room', titleHe: 'חדר השומרים', topic: 'שומרים', description: 'גלה את ההבדלים בין סוגי השומרים', isLocked: true },
        { order: 3, title: 'Damages Palace', titleHe: 'ארמון הנזיקין', topic: 'נזקי ממון', description: 'למד על אחריות נזיקית', isLocked: true },
        { order: 4, title: 'Neighbors Room', titleHe: 'חדר השכנים', topic: 'יחסי שכנים', description: 'פסוק בסכסוכי שכנים', isLocked: true },
        { order: 5, title: 'Commerce Hall', titleHe: 'היכל המסחר', topic: 'מקח וממכר', description: 'הכר את חוקי המסחר', isLocked: true },
        { order: 6, title: 'Grand Court', titleHe: 'אולם בית הדין הגדול', topic: 'פסק דין מורכב', description: 'אתגר הסיום - פסיקה מורכבת', isLocked: true },
    ]);
    const lesson1 = await lessonRepo.save({
        roomId: rooms[0].id,
        order: 1,
        title: 'מהי אבדה?',
        content: 'אבדה היא חפץ שאבד לבעליו. כאשר מוצאים חפץ אבוד, יש חובה להשיבו לבעלים אם ניתן לזהות אותם.',
        videoUrl: 'asset:avida',
    });
    await caseRepo.save({
        lessonId: lesson1.id,
        title: 'הארנק האבוד',
        scenario: 'ראובן מצא ארנק ברחוב. בארנק יש תמונות אישיות ותעודת זהות. שמעון טוען שהארנק שלו. האם ראובן חייב להחזיר את הארנק לשמעון?',
        verdict: 'liable',
        explanation: 'ראובן חייב להחזיר את הארנק. תעודת הזהות מהווה "סימן מובהק" המעיד בצורה ברורה על בעלות שמעון. הכלל הוא: כל סימן מובהק - מחזירים.',
    });
    await achievementRepo.save([
        { title: 'Lost Expert', titleHe: 'מומחה אבדה ומציאה', description: 'השלמת את כל תיקי אולם האבידות', icon: '🔍', condition: 'complete_room_1' },
        { title: 'Guardians Expert', titleHe: 'מומחה שומרים', description: 'השלמת את כל תיקי חדר השומרים', icon: '🛡️', condition: 'complete_room_2' },
        { title: 'Top Investigator', titleHe: 'חוקר מצטיין', description: 'פתרת 10 תיקים ללא רמזים', icon: '🏅', condition: 'no_hints_10' },
        { title: 'Speed Judge', titleHe: 'דיין מהיר', description: 'פסקת 5 תיקים בפחות מדקה כל אחד', icon: '⚡', condition: 'fast_verdicts_5' },
        { title: 'Chief Judge', titleHe: 'אב בית דין', description: 'הגעת לדרגת אב בית דין', icon: '🏛️', condition: 'level_chief_judge' },
    ]);
    const hash = await bcrypt.hash('teacher123', 10);
    await userRepo.save({
        name: 'מורה לדוגמה',
        email: 'teacher@demo.com',
        passwordHash: hash,
        school: 'בית ספר לדוגמה',
        class: 'מורה',
        role: 'teacher',
    });
    console.log('✅ Seed completed successfully');
    await AppDataSource.destroy();
}
seed().catch(console.error);
//# sourceMappingURL=seed.js.map