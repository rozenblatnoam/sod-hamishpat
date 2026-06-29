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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const room_entity_1 = require("../rooms/room.entity");
const progress_entity_1 = require("../progress/progress.entity");
const class_entity_1 = require("../classes/class.entity");
let AdminService = class AdminService {
    constructor(users, rooms, progress, classes) {
        this.users = users;
        this.rooms = rooms;
        this.progress = progress;
        this.classes = classes;
    }
    async getStats() {
        const [totalUsers, totalTeachers, totalStudents, totalClasses, totalRooms] = await Promise.all([
            this.users.count(),
            this.users.count({ where: { role: 'teacher' } }),
            this.users.count({ where: { role: 'student' } }),
            this.classes.count(),
            this.rooms.count(),
        ]);
        const topStudents = await this.users.find({
            where: { role: 'student' },
            order: { score: 'DESC' },
            take: 5,
            select: ['id', 'name', 'email', 'score', 'level'],
        });
        return { totalUsers, totalTeachers, totalStudents, totalClasses, totalRooms, topStudents };
    }
    async getUsers() {
        return this.users.find({
            order: { createdAt: 'DESC' },
            select: ['id', 'name', 'email', 'role', 'score', 'level', 'school', 'classCode', 'createdAt'],
        });
    }
    async updateUserRole(adminId, userId, role) {
        if (adminId === userId)
            throw new common_1.ForbiddenException('לא ניתן לשנות את תפקיד עצמך');
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('משתמש לא נמצא');
        await this.users.update(userId, { role });
        return { success: true };
    }
    async deleteUser(adminId, userId) {
        if (adminId === userId)
            throw new common_1.ForbiddenException('לא ניתן למחוק את עצמך');
        const user = await this.users.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('משתמש לא נמצא');
        await this.users.remove(user);
        return { success: true };
    }
    async getRooms() {
        return this.rooms.find({ order: { order: 'ASC' } });
    }
    async toggleRoomLock(roomId, isLocked) {
        const room = await this.rooms.findOne({ where: { id: roomId } });
        if (!room)
            throw new common_1.NotFoundException('חדר לא נמצא');
        await this.rooms.update(roomId, { isLocked });
        return { success: true };
    }
    async resetUserProgress(userId) {
        await this.progress.delete({ userId });
        await this.users.update(userId, { score: 0 });
        return { success: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(2, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(3, (0, typeorm_1.InjectRepository)(class_entity_1.ClassRoom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map