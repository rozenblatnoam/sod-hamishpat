export type UserLevel =
  | 'student'
  | 'trainee_judge'
  | 'judge'
  | 'chief_judge'
  | 'expert_judge';

export type VerdictOption = 'liable' | 'exempt' | 'partially_liable';

export interface User {
  id: string;
  name: string;
  email: string;
  school: string;
  class: string;
  level: UserLevel;
  score: number;
  role: 'student' | 'teacher' | 'admin';
}

export interface Room {
  id: string;
  order: number;
  title: string;
  titleHe: string;
  description: string;
  topic: string;
  isLocked: boolean;
}

export interface Lesson {
  id: string;
  roomId: string;
  order: number;
  title: string;
  videoUrl: string | null;
  content: string;
}

export interface Case {
  id: string;
  lessonId: string;
  title: string;
  scenario: string;
  verdict: VerdictOption;
  explanation: string;
}

export interface Achievement {
  id: string;
  title: string;
  titleHe: string;
  description: string;
  icon: string;
  condition: string;
}

export interface UserProgress {
  userId: string;
  roomId: string;
  lessonId: string | null;
  completedQuestions: string[];
  score: number;
  completedAt: string | null;
}
