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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_entity_1 = require("./class.entity");
const user_entity_1 = require("../users/user.entity");
const progress_entity_1 = require("../progress/progress.entity");
const room_entity_1 = require("../rooms/room.entity");
const lesson_entity_1 = require("../lessons/lesson.entity");
const case_entity_1 = require("../cases/case.entity");
const constants_1 = require("../shared/constants");
let ClassesService = class ClassesService {
    constructor(classes, users, progress, rooms, lessons, cases) {
        this.classes = classes;
        this.users = users;
        this.progress = progress;
        this.rooms = rooms;
        this.lessons = lessons;
        this.cases = cases;
    }
    async generateCode() {
        while (true) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const exists = await this.classes.findOne({ where: { code } });
            if (!exists)
                return code;
        }
    }
    async createClass(teacher, name) {
        const code = await this.generateCode();
        const cls = this.classes.create({ name, teacherId: teacher.id, school: teacher.school, code });
        return this.classes.save(cls);
    }
    async getClasses(teacher) {
        const classList = await this.classes.find({ where: { teacherId: teacher.id } });
        return Promise.all(classList.map(async (cls) => {
            const studentCount = await this.users.count({ where: { classCode: cls.code } });
            return { ...cls, studentCount };
        }));
    }
    async deleteClass(teacher, classId) {
        const cls = await this.classes.findOne({ where: { id: classId, teacherId: teacher.id } });
        if (!cls)
            throw new common_1.NotFoundException('כיתה לא נמצאה');
        await this.classes.remove(cls);
        return { success: true };
    }
    async getClassStudents(teacher, classId) {
        const cls = await this.classes.findOne({ where: { id: classId, teacherId: teacher.id } });
        if (!cls)
            throw new common_1.NotFoundException('כיתה לא נמצאה');
        const students = await this.users.find({ where: { classCode: cls.code } });
        if (!students.length)
            return [];
        const progressRecords = await this.progress
            .createQueryBuilder('p')
            .where('p.userId IN (:...ids)', { ids: students.map((s) => s.id) })
            .getMany();
        const totalCases = await this.countTotalCases();
        return students.map((s) => {
            const prog = progressRecords.filter((p) => p.userId === s.id);
            const completedRooms = prog.filter((p) => p.completedAt).length;
            const completedCases = prog.reduce((acc, p) => acc + (p.completedQuestions?.length ?? 0), 0);
            return {
                id: s.id,
                name: s.name,
                score: s.score,
                level: constants_1.LEVEL_LABELS[s.level] ?? s.level,
                completedRooms,
                progressPercent: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
            };
        });
    }
    async getAllStudents(teacher) {
        const classList = await this.classes.find({ where: { teacherId: teacher.id } });
        if (!classList.length)
            return [];
        const codes = classList.map((c) => c.code);
        const students = await this.users
            .createQueryBuilder('u')
            .where('u.classCode IN (:...codes)', { codes })
            .getMany();
        return students
            .map((s) => ({
            id: s.id,
            name: s.name,
            score: s.score,
            level: constants_1.LEVEL_LABELS[s.level] ?? s.level,
            classCode: s.classCode,
        }))
            .sort((a, b) => b.score - a.score);
    }
    async getRoomsOverview() {
        const allRooms = await this.rooms.find({ order: { order: 'ASC' } });
        return Promise.all(allRooms.map(async (room) => {
            const roomLessons = await this.lessons.find({ where: { roomId: room.id } });
            const caseCount = roomLessons.length > 0
                ? await this.cases.count({ where: { lessonId: (0, typeorm_2.In)(roomLessons.map((l) => l.id)) } })
                : 0;
            return {
                id: room.id,
                titleHe: room.titleHe,
                topic: room.topic,
                lessonCount: roomLessons.length,
                caseCount,
                lessons: roomLessons
                    .sort((a, b) => a.order - b.order)
                    .map((l) => ({ id: l.id, title: l.title, order: l.order })),
            };
        }));
    }
    async joinClass(student, code) {
        const cls = await this.classes.findOne({ where: { code: code.toUpperCase() } });
        if (!cls)
            throw new common_1.NotFoundException('קוד כיתה לא נמצא');
        await this.users.update(student.id, { classCode: code.toUpperCase() });
        return { success: true, className: cls.name };
    }
    async countTotalCases() {
        const allRooms = await this.rooms.find();
        let total = 0;
        for (const room of allRooms) {
            const roomLessons = await this.lessons.find({ where: { roomId: room.id } });
            if (roomLessons.length > 0) {
                total += await this.cases.count({ where: { lessonId: (0, typeorm_2.In)(roomLessons.map((l) => l.id)) } });
            }
        }
        return total;
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_entity_1.ClassRoom)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(3, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(4, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(5, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ClassesService);
//# sourceMappingURL=classes.service.js.map