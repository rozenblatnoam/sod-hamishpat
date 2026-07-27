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
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const registration_entity_1 = require("./registration.entity");
const user_entity_1 = require("../users/user.entity");
let RegistrationsService = class RegistrationsService {
    constructor(registrations, users, jwt) {
        this.registrations = registrations;
        this.users = users;
        this.jwt = jwt;
    }
    async register(dto) {
        const reg = this.registrations.create(dto);
        await this.registrations.save(reg);
        let user = await this.users.findOne({ where: { email: dto.email } });
        if (!user) {
            user = this.users.create({
                name: dto.name,
                email: dto.email,
                passwordHash: '',
                school: '',
                role: 'student',
            });
            await this.users.save(user);
        }
        const token = this.jwt.sign({ sub: user.id, email: user.email });
        const { passwordHash: _pw, ...safeUser } = user;
        return { token, user: safeUser };
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(registration_entity_1.Registration)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map