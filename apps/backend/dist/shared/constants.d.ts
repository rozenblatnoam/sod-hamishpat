export type UserLevel = 'student' | 'trainee_judge' | 'judge' | 'chief_judge' | 'expert_judge';
export type VerdictOption = 'liable' | 'exempt' | 'partially_liable';
export declare const LEVEL_LABELS: Record<UserLevel, string>;
export declare const SCORE_THRESHOLDS: Record<UserLevel, number>;
export declare const POINTS: {
    WATCH_VIDEO: number;
    SOLVE_RIDDLE: number;
    CORRECT_VERDICT: number;
    NO_HINT_BONUS: number;
};
export declare const TOTAL_CASES = 38;
export declare const HINT_PENALTY = 2;
export declare const LEVEL_ORDER: UserLevel[];
