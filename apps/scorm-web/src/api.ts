const API = (import.meta.env.VITE_API_URL as string) || '';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  school?: string;
  class?: string;
  classCode?: string | null;
}

export interface ClassStats {
  totalStudents: number;
  avgScore: number;
  avgCompletion: number;
  students: { id: string; name: string; score: number; level: string; completedRooms: number; completedCases: number }[];
}

export interface ClassRoom {
  id: string;
  name: string;
  code: string;
  school: string;
  studentCount: number;
}

export interface LeaderboardStudent {
  id: string;
  name: string;
  score: number;
  level: string;
  completedRooms: number;
  classCode?: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function apiGoogleLogin(idToken: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('כניסה עם Google נכשלה — נסה שוב');
  return res.json();
}

export async function apiGetClassStats(token: string): Promise<ClassStats> {
  const res = await fetch(`${API}/teacher/class-stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('שגיאה בטעינת נתוני הכיתה');
  return res.json();
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function apiGetMyClasses(token: string): Promise<ClassRoom[]> {
  const res = await fetch(`${API}/teacher/classes`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('שגיאה בטעינת הכיתות');
  return res.json();
}

export async function apiCreateClass(token: string, name: string): Promise<ClassRoom> {
  const res = await fetch(`${API}/teacher/classes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('שגיאה ביצירת הכיתה');
  return res.json();
}

export async function apiJoinClass(token: string, code: string): Promise<{ success: boolean; className: string }> {
  const res = await fetch(`${API}/teacher/join-class`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
  if (res.status === 404) throw new Error('קוד כיתה לא נמצא — בדוק שהקוד נכון');
  if (!res.ok) throw new Error('שגיאה בהצטרפות לכיתה');
  return res.json();
}

export async function apiGetLeaderboard(token: string): Promise<LeaderboardStudent[]> {
  const res = await fetch(`${API}/teacher/all-students`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('שגיאה בטעינת הלוח');
  return res.json();
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export async function apiGetVideoUrl(token: string, filename: string): Promise<string> {
  const res = await fetch(`${API}/videos/signed/${filename}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('שגיאה בטעינת הסרטון');
  const { url } = await res.json();
  return url;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export async function apiSyncProgress(
  token: string,
  data: { completedCases: string[]; completedRooms: string[]; hintsUsed?: number },
): Promise<void> {
  await fetch(`${API}/progress/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}
