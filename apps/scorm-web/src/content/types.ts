export type Verdict = 'liable' | 'exempt' | 'partially_liable';

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
