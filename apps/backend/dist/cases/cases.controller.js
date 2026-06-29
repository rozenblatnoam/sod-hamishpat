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
exports.CasesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const cases_service_1 = require("./cases.service");
class VerdictDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['liable', 'exempt', 'partially_liable']),
    __metadata("design:type", String)
], VerdictDto.prototype, "verdict", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerdictDto.prototype, "reasoning", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VerdictDto.prototype, "hintsUsed", void 0);
let CasesController = class CasesController {
    constructor(cases) {
        this.cases = cases;
    }
    findByLesson(lessonId) {
        return this.cases.findByLesson(lessonId);
    }
    findOne(id) {
        return this.cases.findOne(id);
    }
    submitVerdict(id, dto, user) {
        return this.cases.submitVerdict(id, user.id, dto.verdict, dto.reasoning, dto.hintsUsed);
    }
};
exports.CasesController = CasesController;
__decorate([
    (0, common_1.Get)('lessons/:lessonId/cases'),
    __param(0, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "findByLesson", null);
__decorate([
    (0, common_1.Get)('cases/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('cases/:id/verdict'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, VerdictDto, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "submitVerdict", null);
exports.CasesController = CasesController = __decorate([
    (0, swagger_1.ApiTags)('cases'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [cases_service_1.CasesService])
], CasesController);
//# sourceMappingURL=cases.controller.js.map