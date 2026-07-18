const API = (import.meta.env.VITE_API_URL as string) || '';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  school?: string;
  class?: string;
}

export interface ClassStats {
  totalStudents: number;
  avgScore: number;
  avgCompletion: number;
  students: { id: string; name: string; score: number; level: string; completedRooms: number; completedCases: number }[];
}

export async function apiRegister(dto: {
  name: string; email: string; password: string;
  school: string; class?: string; role: 'student' | 'teacher';
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (res.status === 409) throw new Error('אימייל כבר קיים במערכת');
  if (!res.ok) throw new Error('שגיאת שרת — נסה שוב');
  return res.json();
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) throw new Error('שם משתמש או סיסמה שגויים');
  if (!res.ok) throw new Error('שגיאת שרת — נסה שוב');
  return res.json();
}

export async function apiGetClassStats(token: string): Promise<ClassStats> {
  const res = await fetch(`${API}/teacher/class-stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('שגיאה בטעינת נתוני הכיתה');
  return res.json();
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
