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
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const constants_1 = require("../shared/constants");
const TOTAL_ROOMS = 6;
let TeacherService = class TeacherService {
    constructor(users) {
        this.users = users;
    }
    async getClassStats(teacher) {
        if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
            throw new common_1.ForbiddenException('גישה לאזור מורה בלבד');
        }
        if (!teacher.school)
            return { totalStudents: 0, avgScore: 0, avgCompletion: 0, students: [] };
        const where = { school: teacher.school, role: 'student' };
        if (teacher.class)
            where.class = teacher.class;
        const students = await this.users.find({ where });
        const enriched = students.map((s) => {
            const completedRooms = s.scormProgress?.completedRooms?.length ?? 0;
            const completedCases = s.scormProgress?.completedCases?.length ?? 0;
            return {
                id: s.id,
                name: s.name,
                score: s.score,
                level: constants_1.LEVEL_LABELS[s.level],
                completedRooms,
                completedCases,
            };
        });
        const avgScore = students.length
            ? Math.round(students.reduce((a, s) => a + s.score, 0) / students.length)
            : 0;
        const avgCompletion = enriched.length
            ? Math.round((enriched.reduce((a, s) => a + s.completedRooms, 0) / enriched.length) *
                (100 / TOTAL_ROOMS))
            : 0;
        return {
            totalStudents: students.length,
            avgScore,
            avgCompletion,
            students: enriched,
        };
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map