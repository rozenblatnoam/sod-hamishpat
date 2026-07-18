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
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const progress_entity_1 = require("./progress.entity");
const user_entity_1 = require("../users/user.entity");
const constants_1 = require("../shared/constants");
let ProgressService = class ProgressService {
    constructor(progress, users) {
        this.progress = progress;
        this.users = users;
    }
    findAllByUser(userId) {
        return this.progress.find({ where: { userId } });
    }
    async update(userId, roomId, action, payload) {
        let prog = await this.progress.findOne({ where: { userId, roomId } });
        if (!prog) {
            prog = this.progress.create({ userId, roomId, completedQuestions: [] });
        }
        if (action === 'watch_video') {
            const user = await this.users.findOne({ where: { id: userId } });
            if (user) {
                user.score += constants_1.POINTS.WATCH_VIDEO;
                await this.users.save(user);
            }
        }
        if (action === 'solve_riddle') {
            const user = await this.users.findOne({ where: { id: userId } });
            if (user) {
                user.score += constants_1.POINTS.SOLVE_RIDDLE;
                await this.users.save(user);
            }
            if (payload.questionId && !prog.completedQuestions.includes(payload.questionId)) {
                prog.completedQuestions = [...prog.completedQuestions, payload.questionId];
            }
        }
        await this.progress.save(prog);
        return prog;
    }
    async syncScorm(userId, data) {
        const progRecords = await this.progress.find({ where: { userId } });
        const uniqueCases = [...new Set(progRecords.flatMap((p) => p.completedQuestions ?? []))];
        const uniqueRooms = [...new Set(progRecords.filter((p) => p.completedAt != null).map((p) => p.roomId))];
        const hintsUsed = Math.max(0, Math.floor(data.hintsUsed ?? 0));
        const baseScore = Math.min(100, Math.round((uniqueCases.length / constants_1.TOTAL_CASES) * 100));
        const score = Math.max(0, baseScore - hintsUsed * constants_1.HINT_PENALTY);
        await this.users.update(userId, {
            scormProgress: {
                completedCases: uniqueCases,
                completedRooms: uniqueRooms,
                score,
                syncedAt: new Date().toISOString(),
            },
            score,
        });
        return { ok: true };
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProgressService);
//# sourceMappingURL=progress.service.js.map