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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const room_entity_1 = require("./room.entity");
const lesson_entity_1 = require("../lessons/lesson.entity");
const case_entity_1 = require("../cases/case.entity");
const progress_entity_1 = require("../progress/progress.entity");
let RoomsService = class RoomsService {
    constructor(rooms, lessons, cases, progress) {
        this.rooms = rooms;
        this.lessons = lessons;
        this.cases = cases;
        this.progress = progress;
    }
    findAll() {
        return this.rooms.find({ order: { order: 'ASC' } });
    }
    async findOne(id) {
        const room = await this.rooms.findOne({ where: { id } });
        if (!room)
            throw new common_1.NotFoundException('חדר לא נמצא');
        return room;
    }
    async findOneForUser(id, userId) {
        const rooms = await this.findAllForUser(userId);
        const room = rooms.find((r) => r.id === id);
        if (!room)
            throw new common_1.NotFoundException('חדר לא נמצא');
        return room;
    }
    async findAllForUser(userId) {
        const rooms = await this.findAll();
        const progress = await this.progress.find({ where: { userId } });
        const progressByRoom = new Map(progress.map((p) => [p.roomId, p]));
        const result = [];
        let previousCompleted = true;
        for (const room of rooms) {
            const totalCases = await this.countCasesInRoom(room.id);
            const prog = progressByRoom.get(room.id);
            const completedCount = prog?.completedQuestions?.length ?? 0;
            const isCompleted = totalCases > 0 && completedCount >= totalCases;
            result.push({
                ...room,
                isLocked: room.order > 1 && !previousCompleted,
                totalCases,
                completedCount,
                isCompleted,
            });
            previousCompleted = isCompleted;
        }
        return result;
    }
    async countCasesInRoom(roomId) {
        const lessons = await this.lessons.find({ where: { roomId } });
        if (lessons.length === 0)
            return 0;
        return this.cases.count({ where: { lessonId: (0, typeorm_2.In)(lessons.map((l) => l.id)) } });
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(1, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(2, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __param(3, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map