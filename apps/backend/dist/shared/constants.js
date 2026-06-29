"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL_ORDER = exports.POINTS = exports.SCORE_THRESHOLDS = exports.LEVEL_LABELS = void 0;
exports.LEVEL_LABELS = {
    student: 'תלמיד',
    trainee_judge: 'דיין מתלמד',
    judge: 'דיין',
    chief_judge: 'אב בית דין',
    expert_judge: 'דיין מומחה',
};
exports.SCORE_THRESHOLDS = {
    student: 0,
    trainee_judge: 200,
    judge: 600,
    chief_judge: 1200,
    expert_judge: 2500,
};
exports.POINTS = {
    WATCH_VIDEO: 10,
    SOLVE_RIDDLE: 20,
    CORRECT_VERDICT: 50,
    NO_HINT_BONUS: 15,
};
exports.LEVEL_ORDER = [
    'student',
    'trainee_judge',
    'judge',
    'chief_judge',
    'expert_judge',
];
//# sourceMappingURL=constants.js.map