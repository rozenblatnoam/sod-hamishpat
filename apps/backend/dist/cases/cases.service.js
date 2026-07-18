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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const case_entity_1 = require("./case.entity");
const progress_entity_1 = require("../progress/progress.entity");
const user_entity_1 = require("../users/user.entity");
const lesson_entity_1 = require("../lessons/lesson.entity");
const room_entity_1 = require("../rooms/room.entity");
const achievement_entity_1 = require("../achievements/achievement.entity");
const constants_1 = require("../shared/constants");
const LEVEL_ORDER_ARR = [
    'student',
    'trainee_judge',
    'judge',
    'chief_judge',
    'expert_judge',
];
let CasesService = class CasesService {
    constructor(cases, progress, users, lessons, rooms, achievements) {
        this.cases = cases;
        this.progress = progress;
        this.users = users;
        this.lessons = lessons;
        this.rooms = rooms;
        this.achievements = achievements;
    }
    findByLesson(lessonId) {
        return this.cases.find({
            where: { lessonId },
            select: { id: true, lessonId: true, title: true, scenario: true, createdAt: true },
        });
    }
    async findOne(id) {
        const c = await this.cases.findOne({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException('תיק לא נמצא');
        return c;
    }
    async submitVerdict(caseId, userId, verdict, _reasoning, hintsUsed = 0) {
        const caseData = await this.findOne(caseId);
        const correct = verdict === caseData.verdict;
        let roomCompleted = false;
        let earnedAchievement = null;
        if (correct) {
            let points = constants_1.POINTS.CORRECT_VERDICT;
            if (hintsUsed === 0)
                points += constants_1.POINTS.NO_HINT_BONUS;
            const user = await this.users.findOne({ where: { id: userId } });
            if (user) {
                user.score += points;
                this.updateLevel(user);
                await this.users.save(user);
            }
            try {
                const lesson = await this.lessons.findOne({ where: { id: caseData.lessonId } });
                if (lesson) {
                    let prog = await this.progress.findOne({ where: { userId, roomId: lesson.roomId } });
                    if (!prog) {
                        prog = this.progress.create({ userId, roomId: lesson.roomId, completedQuestions: [] });
                    }
                    if (!prog.completedQuestions.includes(caseId)) {
                        prog.completedQuestions = [...prog.completedQuestions, caseId];
                    }
                    const roomLessons = await this.lessons.find({ where: { roomId: lesson.roomId } });
                    const totalCases = await this.cases.count({
                        where: { lessonId: (0, typeorm_2.In)(roomLessons.map((l) => l.id)) },
                    });
                    if (totalCases > 0 && prog.completedQuestions.length >= totalCases && !prog.completedAt) {
                        prog.completedAt = new Date();
                        roomCompleted = true;
                        const room = await this.rooms.findOne({ where: { id: lesson.roomId } });
                        if (room) {
                            const condition = `complete_room_${room.order}`;
                            const achievement = await this.achievements.findOne({
                                where: { condition },
                                relations: ['users'],
                            });
                            if (achievement) {
                                const alreadyEarned = achievement.users?.some((u) => u.id === userId);
                                if (!alreadyEarned) {
                                    achievement.users = [...(achievement.users ?? []), { id: userId }];
                                    await this.achievements.save(achievement);
                                }
                                earnedAchievement = {
                                    titleHe: achievement.titleHe,
                                    icon: achievement.icon,
                                    description: achievement.description,
                                    roomTitleHe: room.titleHe,
                                };
                            }
                        }
                    }
                    await this.progress.save(prog);
                }
            }
            catch (_e) { }
        }
        return {
            correct,
            explanation: caseData.explanation,
            points: correct ? constants_1.POINTS.CORRECT_VERDICT + (hintsUsed === 0 ? constants_1.POINTS.NO_HINT_BONUS : 0) : 0,
            roomCompleted,
            achievement: earnedAchievement,
        };
    }
    updateLevel(user) {
        for (let i = LEVEL_ORDER_ARR.length - 1; i >= 0; i--) {
            const lvl = LEVEL_ORDER_ARR[i];
            if (user.score >= constants_1.SCORE_THRESHOLDS[lvl]) {
                user.level = lvl;
                break;
            }
        }
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __param(1, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(4, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(5, (0, typeorm_1.InjectRepository)(achievement_entity_1.Achievement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CasesService);
//# sourceMappingURL=cases.service.js.map