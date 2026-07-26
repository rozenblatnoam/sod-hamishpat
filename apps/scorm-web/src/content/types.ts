export type Verdict = 'liable' | 'exempt' | 'partially_liable';

export const VERDICT_META: Record<Verdict, { label: string; icon: string; color: string }> = {
  liable:           { label: 'חייב',       icon: '❌', color: '#c0392b' },
  exempt:           { label: 'פטור',        icon: '✅', color: '#27ae60' },
  partially_liable: { label: 'חייב חלקית', icon: '⚖️', color: '#e67e22' },
};

export const MIN_REASONING = 15;

export interface CaseData {
  id: string;
  title: string;
  scenario: string;
  verdict: Verdict;
  explanation: string;
}

export interface LessonData {
  id: string;
  order: number;
  title: string;
  content: string;
  sourceContent?: string;
  videoUrl?: string | null;
  cases: CaseData[];
}

export interface RoomData {
  id: string;
  order: number;
  titleHe: string;
  topic: string;
  description: string;
  icon: string;
  color: string;
  lessons: LessonData[];
}
