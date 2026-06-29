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

export const ROOMS = [
  { id: 'room_1', order: 1, titleHe: 'אולם האבידות', topic: 'אבדה ומציאה' },
  { id: 'room_2', order: 2, titleHe: 'חדר השומרים', topic: 'שומרים' },
  { id: 'room_3', order: 3, titleHe: 'ארמון הנזיקין', topic: 'נזקי ממון' },
  { id: 'room_4', order: 4, titleHe: 'חדר השכנים', topic: 'יחסי שכנים' },
  { id: 'room_5', order: 5, titleHe: 'היכל המסחר', topic: 'מקח וממכר' },
  { id: 'room_6', order: 6, titleHe: 'אולם בית הדין הגדול', topic: 'פסק דין מורכב' },
];
