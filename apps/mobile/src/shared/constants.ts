import { UserLevel } from './types';

export const LEVEL_LABELS: Record<UserLevel, string> = {
  student: 'תלמיד',
  trainee_judge: 'דיין מתלמד',
  judge: 'דיין',
  chief_judge: 'אב בית דין',
  expert_judge: 'דיין מומחה',
};

export const LEVEL_COLORS: Record<UserLevel, string> = {
  student: '#4CAF50',
  trainee_judge: '#2196F3',
  judge: '#9C27B0',
  chief_judge: '#FF9800',
  expert_judge: '#FFD700',
};

export const SCORE_THRESHOLDS: Record<UserLevel, number> = {
  student: 0,
  trainee_judge: 200,
  judge: 600,
  chief_judge: 1200,
  expert_judge: 2500,
};

export const POINTS = {
  WATCH_VIDEO: 10,
  SOLVE_RIDDLE: 20,
  CORRECT_VERDICT: 50,
  NO_HINT_BONUS: 15,
};
