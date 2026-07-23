import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CourtroomScene } from './CourtroomScene';
import { JudgeCharacter } from './components/JudgeCharacter';
import { ROOMS, ROOM_ACHIEVEMENTS, TOTAL_CASES } from './content/rooms';
import type { RoomData, LessonData, CaseData, Verdict } from './content/types';
import { scorm } from './scorm/ScormAPI';
import { apiSyncProgress, apiGoogleLogin, apiGetVideoUrl, apiJoinClass, apiGetMyClasses, apiCreateClass, apiGetLeaderboard, type AuthUser, type ClassRoom, type LeaderboardStudent } from './api';
import { signInWithGoogle } from './firebase';
import './index.css';

const ROOM_LIMIT = parseInt((import.meta.env.VITE_ROOM_LIMIT as string) || '99');
const ACTIVE_ROOMS = ROOMS.slice(0, ROOM_LIMIT);

// ─── Auth ─────────────────────────────────────────────────────────────────
interface AuthState { user: AuthUser; token: string; }

function loadAuth(): AuthState | null {
  try { const s = localStorage.getItem('escape_auth'); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveAuth(a: AuthState) { localStorage.setItem('escape_auth', JSON.stringify(a)); }
function clearAuth() { localStorage.removeItem('escape_auth'); }

// ─── Progress ──────────────────────────────────────────────────────────────
interface Progress {
  completedCases: string[];
  completedRooms: string[];
  reasoning: Record<string, string>;
  usedHints: string[];
}

function progressKey(userId: string) { return `escape_progress_${userId}`; }

function loadProgress(userId: string): Progress {
  const s = scorm.getSuspendData() as Progress | null;
  if (s?.completedCases) return { completedCases: s.completedCases, completedRooms: s.completedRooms ?? [], reasoning: s.reasoning ?? {}, usedHints: s.usedHints ?? [] };
  try { const ls = localStorage.getItem(progressKey(userId)); if (ls) { const p = JSON.parse(ls); return { ...p, completedRooms: p.completedRooms ?? [], usedHints: p.usedHints ?? [] } as Progress; } } catch {}
  return { completedCases: [], completedRooms: [], reasoning: {}, usedHints: [] };
}
function saveProgress(p: Progress, userId: string) {
  scorm.setSuspendData(p);
  localStorage.setItem(progressKey(userId), JSON.stringify(p));
  const pct = TOTAL_CASES > 0 ? Math.round((p.completedCases.length / TOTAL_CASES) * 100) : 0;
  scorm.setScore(pct);
  scorm.setStatus(pct >= 70 ? 'passed' : 'incomplete');
}

// ─── Toast ────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; message: string; type: 'error' | 'success' | 'info'; }

function Toast({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

// ─── Screen types ──────────────────────────────────────────────────────────
type AppScreen =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'join-class' }
  | { name: 'intro' }
  | { name: 'home' }
  | { name: 'room'; room: RoomData }
  | { name: 'lesson'; room: RoomData; lesson: LessonData }
  | { name: 'case'; room: RoomData; lesson: LessonData; caseData: CaseData; caseIndex: number }
  | { name: 'teacher-dashboard' }
  | { name: 'leaderboard' }
  | { name: 'courtroom'; room: RoomData };

// ─── Splash ────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1200);
    const t4 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);
  return (
    <div className="splash" onClick={onDone}>
      <div className={`splash-logo-img ${phase >= 1 ? 'splash-show' : ''}`}>
        <img src="./logo.png" alt="סוד המשפט" />
      </div>
      <div className={`splash-title ${phase >= 2 ? 'splash-show' : ''}`}>סוד המשפט</div>
      <div className={`splash-sub ${phase >= 2 ? 'splash-show' : ''}`}>תוכנית דיינים צעירים</div>
      {phase >= 3 && <div className="splash-bar-wrap"><div className="splash-bar" /></div>}
      <div className={`splash-tap ${phase >= 3 ? 'splash-show' : ''}`}>לחץ לדילוג</div>
    </div>
  );
}

// ─── Login ─────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (auth: AuthState) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleLogin() {
    setLoading(true); setError('');
    try {
      const idToken = await signInWithGoogle();
      const data = await apiGoogleLogin(idToken);
      saveAuth(data); onLogin(data);
    } catch (err: any) { setError(err.message ?? 'כניסה עם Google נכשלה'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-screen">
      <div className="login-card login-card-google-only">
        <div className="login-logo-wrap">
          <img src="./logo.png" alt="סוד המשפט" className="login-logo" />
        </div>
        <h1 className="login-title">סוד המשפט</h1>
        <p className="login-subtitle">תוכנית דיינים צעירים</p>
        <p className="login-google-hint">כנס עם חשבון Google שלך כדי להתחיל</p>
        {error && <div className="login-error">⚠️ {error}</div>}
        <button type="button" className="google-btn google-btn-large" onClick={handleGoogleLogin} disabled={loading}>
          {loading
            ? <span className="google-btn-spinner" />
            : <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          }
          {loading ? 'מתחבר...' : 'כניסה עם Google'}
        </button>
      </div>
    </div>
  );
}

// ─── Join Class ────────────────────────────────────────────────────────────
function JoinClassScreen({ auth, onJoined, onSkip }: {
  auth: AuthState; onJoined: (className: string) => void; onSkip: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    if (code.trim().length < 4) { setError('נא להזין קוד כיתה תקין'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiJoinClass(auth.token, code.trim().toUpperCase());
      onJoined(res.className);
    } catch (err: any) { setError(err.message ?? 'שגיאה בהצטרפות'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-screen">
      <div className="login-card login-card-google-only">
        <div className="join-class-icon">🏫</div>
        <h1 className="login-title">הצטרף לכיתה</h1>
        <p className="login-google-hint">בקש מהמורה שלך את קוד הכיתה</p>
        <input
          className="form-input join-code-input"
          placeholder="קוד כיתה (לדוגמה: ABC123)"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          dir="ltr"
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
        />
        {error && <div className="login-error">⚠️ {error}</div>}
        <button className="login-btn" onClick={handleJoin} disabled={loading || !code.trim()}>
          {loading ? 'מצטרף...' : 'הצטרף לכיתה ←'}
        </button>
        <button className="switch-mode-link" onClick={onSkip}>
          המשך בלי כיתה
        </button>
      </div>
    </div>
  );
}

// ─── Leaderboard Screen ─────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉'];

function LeaderboardScreen({ auth, onClose }: { auth: AuthState; onClose: () => void }) {
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    apiGetLeaderboard(auth.token).then(s => { setStudents(s); setLoading(false); }).catch(() => setLoading(false));
  }, [auth.token]);

  const top = students.slice(0, 3);
  const rest = students.slice(3);

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-header">
        <span className="leaderboard-title">🏆 לוח תוצאות</span>
        <button className="leaderboard-close" onClick={onClose}>✕</button>
      </div>

      {loading && <div className="loading-msg">⏳ טוען...</div>}

      {!loading && (
        <>
          {/* Top 3 podium */}
          <div className="podium-row">
            {[1, 0, 2].map(i => {
              const s = top[i];
              if (!s) return <div key={i} className="podium-slot" />;
              const shown = reveal > i;
              return (
                <div key={i} className={`podium-slot podium-${i + 1} ${shown ? 'podium-revealed' : ''}`}>
                  {shown && (
                    <>
                      <div className="podium-medal">{MEDALS[i]}</div>
                      <div className="podium-name">{s.name}</div>
                      <div className="podium-score">{s.score} נק׳</div>
                      <div className="podium-rooms">{s.completedRooms} חדרים</div>
                    </>
                  )}
                  <div className="podium-block podium-block-h" />
                </div>
              );
            })}
          </div>

          {/* Reveal buttons */}
          {reveal < 3 && (
            <button className="leaderboard-reveal-btn" onClick={() => setReveal(r => r + 1)}>
              {reveal === 0 ? '🥉 גלה מקום שלישי' : reveal === 1 ? '🥈 גלה מקום שני' : '🥇 גלה מקום ראשון'}
            </button>
          )}

          {/* Rest of class */}
          {reveal >= 3 && rest.length > 0 && (
            <div className="leaderboard-rest">
              {rest.map((s, i) => (
                <div key={s.id} className="leaderboard-row">
                  <span className="lb-rank">{i + 4}</span>
                  <span className="lb-name">{s.name}</span>
                  <span className="lb-score">{s.score} נק׳</span>
                  <span className="lb-rooms">{s.completedRooms} חדרים</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Teacher Dashboard ─────────────────────────────────────────────────────
function TeacherDashboard({ auth, onBrowse, onLogout, onLeaderboard }: {
  auth: AuthState; onBrowse: () => void; onLogout: () => void; onLeaderboard: () => void;
}) {
  const [myClass, setMyClass] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'rooms' | 'name'>('score');

  function reload() {
    setLoading(true); setError('');
    Promise.all([apiGetMyClasses(auth.token), apiGetLeaderboard(auth.token)])
      .then(([classes, lb]) => {
        setMyClass(classes[0] ?? null);
        setStudents(lb);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [auth.token]);

  async function handleCreateClass() {
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      const cls = await apiCreateClass(auth.token, newClassName.trim());
      setMyClass(cls); setNewClassName('');
    } catch (e: any) { setError(e.message); }
    finally { setCreating(false); }
  }

  function copyCode() {
    if (!myClass) return;
    navigator.clipboard.writeText(myClass.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const sorted = [...students].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'he');
    if (sortBy === 'rooms') return b.completedRooms - a.completedRooms;
    return b.score - a.score;
  });

  return (
    <div className="screen teacher-screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onLogout}>יציאה</button>
        <span className="top-bar-title">דשבורד מורה</span>
        <button className="teacher-browse-btn" onClick={onBrowse}>עיון ›</button>
      </div>

      <div className="teacher-hero">
        <div className="teacher-hero-icon">🎓</div>
        <div>
          <div className="teacher-hero-name">שלום, {auth.user.name}</div>
          <div className="teacher-hero-school">{auth.user.school ?? 'מורה'}</div>
        </div>
      </div>

      {/* Class code card */}
      {myClass ? (
        <div className="class-code-card">
          <div className="class-code-label">📋 קוד הכיתה — שתף עם התלמידים</div>
          <div className="class-code-row">
            <span className="class-code-value">{myClass.code}</span>
            <button className="class-code-copy" onClick={copyCode}>
              {codeCopied ? '✓ הועתק' : '📋 העתק'}
            </button>
          </div>
          <div className="class-code-name">{myClass.name} · {myClass.studentCount} תלמידים</div>
        </div>
      ) : (
        <div className="create-class-card">
          <div className="create-class-title">➕ צור כיתה</div>
          <div className="create-class-row">
            <input className="form-input" placeholder="שם הכיתה (לדוגמה: ז׳1)"
              value={newClassName} onChange={e => setNewClassName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateClass()} />
            <button className="login-btn create-class-btn" onClick={handleCreateClass} disabled={creating || !newClassName.trim()}>
              {creating ? '...' : 'צור'}
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard button */}
      <button className="leaderboard-launch-btn" onClick={onLeaderboard}>
        🏆 הצג לוח תוצאות — פרסים ל-3 הראשונים
      </button>

      {loading && <div className="loading-msg">⏳ טוען...</div>}
      {error && <div className="error-msg">⚠️ {error} <button className="retry-btn" onClick={reload}>↺</button></div>}

      {!loading && (
        <>
          <div className="section-label-row">
            <span className="section-label" style={{ padding: 0 }}>דירוג תלמידים</span>
            <div className="sort-btns">
              {(['score', 'rooms', 'name'] as const).map(key => (
                <button key={key} className={`sort-btn${sortBy === key ? ' sort-btn-active' : ''}`}
                  onClick={() => setSortBy(key)}>
                  {{ score: 'ציון', rooms: 'חדרים', name: 'שם' }[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="students-list">
            {sorted.length === 0
              ? <div className="empty-hint">אין תלמידים עדיין — שתף את קוד הכיתה</div>
              : sorted.map((s, i) => (
                <div key={s.id} className={`student-card${i < 3 ? ' student-card-top' : ''}`}>
                  <div className="student-rank">{i < 3 ? MEDALS[i] : i + 1}</div>
                  <div className="student-avatar">{s.name.charAt(0)}</div>
                  <div className="student-info">
                    <div className="student-name">{s.name}</div>
                    <div className="student-meta">{s.level}</div>
                  </div>
                  <div className="student-rooms">
                    <div className="student-rooms-num">{s.score}</div>
                    <div className="student-rooms-label">ציון</div>
                  </div>
                  <div className="student-rooms">
                    <div className="student-rooms-num">{s.completedRooms}</div>
                    <div className="student-rooms-label">חדרים</div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Intro ─────────────────────────────────────────────────────────────────
const HOW_STEPS = [
  { icon: '🏛️', title: 'בחר חדר', desc: 'כל חדר בריחה עוסק בנושא הלכתי אחר.' },
  { icon: '📖', title: 'למד את החומר', desc: 'קרא תוכן, עיין במקורות, וצפה בסרטון ההסבר.' },
  { icon: '✍️', title: 'נמק ופסוק', desc: 'כתוב את נימוקך ההלכתי ופסוק כדיין אמיתי!' },
  { icon: '🔓', title: 'צא מהחדר', desc: 'השלם את כל תיקי הדין בחדר — וזכה בתעודה!' },
];

function IntroScreen({ onStart, userName }: { onStart: () => void; userName: string }) {
  return (
    <div className="screen intro-screen">
      <div className="intro-hero">
        <div className="intro-hero-logo-wrap">
          <img src="./logo.png" alt="סוד המשפט" className="intro-hero-logo" />
        </div>
        <h1 className="intro-hero-title">ברוך הבא, {userName}!</h1>
        <p className="intro-hero-desc">סוד המשפט — תוכנית דיינים צעירים. למד הלכה, חקור תיקים ופסוק!</p>
      </div>
      <div className="intro-section">
        <div className="section-label">כיצד משחקים?</div>
        <div className="how-steps">
          {HOW_STEPS.map((s, i) => (
            <div key={i} className="how-step">
              <div className="how-step-num">{i + 1}</div>
              <div className="how-step-icon">{s.icon}</div>
              <div className="how-step-body">
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="intro-section">
        <div className="section-label">מה נדרש לצאת מחדר?</div>
        <div className="escape-rules-card">
          <div className="escape-rules-row">
            <span className="escape-rule-icon">🔓</span>
            <div><div className="escape-rule-title">השלם את כל תיקי הדין בחדר</div>
              <div className="escape-rule-desc">כל תיק דורש נימוק + פסיקה.</div></div>
          </div>
          <div className="escape-rules-row">
            <span className="escape-rule-icon">🏆</span>
            <div><div className="escape-rule-title">ציון עובר: 70%</div>
              <div className="escape-rule-desc">השלמת {Math.ceil(TOTAL_CASES * 0.7)}/{TOTAL_CASES} תיקים מעניקה "עובר".</div></div>
          </div>
          <div className="escape-rules-divider" />
          <div className="escape-rules-stats">
            <div className="escape-stat"><div className="escape-stat-num">{ACTIVE_ROOMS.length}</div><div className="escape-stat-label">חדרים</div></div>
            <div className="escape-stat"><div className="escape-stat-num">{ACTIVE_ROOMS.flatMap(r => r.lessons.flatMap(l => l.cases)).length}</div><div className="escape-stat-label">תיקים</div></div>
            <div className="escape-stat"><div className="escape-stat-num">{ACTIVE_ROOMS.reduce((s, r) => s + r.lessons.length, 0)}</div><div className="escape-stat-label">שיעורים</div></div>
          </div>
        </div>
      </div>
      <div className="intro-cta">
        <button className="cta-btn" onClick={onStart}>🚀 התחל את ההרפתקה!</button>
      </div>
    </div>
  );
}

// ─── User header strip ──────────────────────────────────────────────────────
function UserStrip({ user, isTeacher, onDashboard, onLogout }: {
  user: AuthUser; isTeacher: boolean; onDashboard?: () => void; onLogout: () => void;
}) {
  return (
    <div className={`user-strip ${isTeacher ? 'user-strip-teacher' : ''}`}>
      <span className="user-strip-name">{isTeacher ? '🎓' : '👤'} {user.name}</span>
      {isTeacher && onDashboard && (
        <button className="strip-btn" onClick={onDashboard}>דשבורד</button>
      )}
      <button className="strip-btn strip-btn-logout" onClick={onLogout}>יציאה</button>
    </div>
  );
}

// ─── Home ──────────────────────────────────────────────────────────────────
function HomeScreen({ progress, onSelectRoom, onShowIntro, onEnterCourtroom, auth, onDashboard, onLogout, teacherMode }: {
  progress: Progress; onSelectRoom: (r: RoomData) => void;
  onShowIntro: () => void; onEnterCourtroom: (r: RoomData) => void; auth: AuthState;
  onDashboard?: () => void; onLogout: () => void;
  teacherMode?: boolean;
}) {
  const done = progress.completedCases.length;
  const pct = TOTAL_CASES > 0 ? Math.round((done / TOTAL_CASES) * 100) : 0;
  const isTeacher = auth.user.role === 'teacher' || auth.user.role === 'admin';

  return (
    <div className="screen home-screen">
      <UserStrip user={auth.user} isTeacher={isTeacher} onDashboard={onDashboard} onLogout={onLogout} />
      <div className="home-hero">
        <HomeCourtArch />
        <div className="home-logo-wrap"><img src="./logo.png" alt="סוד המשפט" className="home-logo-img" /></div>
        <h1 className="home-title">סוד המשפט</h1>
        <h2 className="home-subtitle">תוכנית דיינים צעירים</h2>
        {teacherMode
          ? <p className="home-tagline teacher-mode-badge">🎓 מצב עיון מורה — לצפייה בלבד</p>
          : <p className="home-tagline">למד, חקור, פסוק — הפוך לדיין!</p>}
        {!teacherMode && <button className="home-how-btn" onClick={onShowIntro}>❓ כיצד משחקים</button>}
        {!teacherMode && <button className="home-courtroom-btn" onClick={() => onEnterCourtroom(ACTIVE_ROOMS[0])}>🏛️ כנס לאולם 3D (בטא)</button>}
      </div>

      {!teacherMode && done > 0 && (
        <div className="home-progress-card">
          <div className="home-progress-row">
            <span>התקדמות כללית</span><span>{done}/{TOTAL_CASES} תיקים</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="home-progress-pct">{pct}% · {pct >= 70 ? '✅ עובר' : `נדרש עוד ${Math.ceil(TOTAL_CASES * 0.7) - done} תיקים`}</div>
        </div>
      )}

      <div className="section-label">חדרי הבריחה</div>
      <div className="rooms-grid">
        {ACTIVE_ROOMS.map(room => {
          const roomCases = room.lessons.flatMap(l => l.cases);
          const roomDone = roomCases.filter(c => progress.completedCases.includes(c.id)).length;
          const roomPct = roomCases.length > 0 ? Math.round((roomDone / roomCases.length) * 100) : 0;
          const isCompleted = progress.completedRooms.includes(room.id);
          return (
            <div key={room.id}
              className={`room-card${isCompleted ? ' room-card-completed' : ''}${room.id === 'room-1' && !teacherMode ? ' room-card-beta' : ''}`}
              style={{ '--room-color': room.color } as React.CSSProperties}
              onClick={() => room.id === 'room-1' && !teacherMode ? onEnterCourtroom(room) : onSelectRoom(room)}>
              {isCompleted && <div className="room-done-badge">✓ הושלם</div>}
              {room.id === 'room-1' && !teacherMode && <div className="room-beta-badge">🏛️ בטא 3D</div>}
              <div className="room-card-icon">{room.icon}</div>
              <div className="room-card-order">חדר {room.order}</div>
              <div className="room-card-title">{room.titleHe}</div>
              <div className="room-card-topic">{room.topic}</div>
              {!isCompleted && !teacherMode && (
                <div className="room-card-escape-hint">🔒 {roomCases.length - roomDone} תיקים לצאת</div>
              )}
              <div className="room-card-progress-row">
                <div className="room-progress-bar"><div className="room-progress-fill" style={{ width: `${roomPct}%` }} /></div>
                <span className="room-progress-label">{teacherMode ? `${roomCases.length} תיקים` : `${roomDone}/${roomCases.length}`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!teacherMode && progress.completedRooms.length > 0 && (
        <>
          <div className="section-label">הישגים שלי</div>
          <div className="achievements-row">
            {progress.completedRooms.map(rid => {
              const room = ACTIVE_ROOMS.find(r => r.id === rid);
              const ach = room ? ROOM_ACHIEVEMENTS[room.order] : null;
              if (!ach) return null;
              return <div key={rid} className="achievement-chip"><span>{ach.icon}</span><span>{ach.titleHe}</span></div>;
            })}
          </div>
        </>
      )}
      <div className="home-footer">פותח ע"י צוות "דיינים צעירים"</div>
    </div>
  );
}

// ─── Room ──────────────────────────────────────────────────────────────────
function RoomScreen({ room, progress, teacherMode, onBack, onSelectLesson }: {
  room: RoomData; progress: Progress; teacherMode?: boolean;
  onBack: () => void; onSelectLesson: (l: LessonData) => void;
}) {
  const roomCases = room.lessons.flatMap(l => l.cases);
  const roomDone = roomCases.filter(c => progress.completedCases.includes(c.id)).length;
  const roomPct = roomCases.length > 0 ? Math.round((roomDone / roomCases.length) * 100) : 0;
  const isCompleted = progress.completedRooms.includes(room.id);

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>← חזרה</button>
        <span className="top-bar-title">{room.titleHe}</span>
      </div>
      <div className="room-header" style={{ backgroundColor: room.color }}>
        <div className="room-header-icon">{room.icon}</div>
        <h1 className="room-header-title">{room.titleHe}</h1>
        <p className="room-header-topic">{room.topic}</p>
        <div className="room-header-progress">
          <div className="room-header-bar"><div className="room-header-fill" style={{ width: `${roomPct}%` }} /></div>
          <span className="room-header-label">{roomDone}/{roomCases.length} תיקים</span>
        </div>
      </div>

      {!teacherMode && (
        <div className={`escape-banner ${isCompleted ? 'escape-banner-done' : ''}`}>
          <span className="escape-banner-icon">{isCompleted ? '🔓' : '🔒'}</span>
          <div>
            <div className="escape-banner-title">{isCompleted ? 'חדר זה הושלם! יצאת!' : 'כדי לצאת מהחדר:'}</div>
            <div className="escape-banner-sub">{isCompleted ? `השלמת את כל ${roomCases.length} התיקים` : `פסוק בכל ${roomCases.length} תיקי הדין · נותרו ${roomCases.length - roomDone}`}</div>
          </div>
        </div>
      )}

      <div className="list-section">
        <div className="section-label">שיעורים בחדר</div>
        {room.lessons.map((lesson, idx) => {
          const ld = lesson.cases.filter(c => progress.completedCases.includes(c.id)).length;
          const full = ld === lesson.cases.length && lesson.cases.length > 0;
          return (
            <div key={lesson.id} className={`list-card${full ? ' list-card-done' : ''}`} onClick={() => onSelectLesson(lesson)}>
              <div className="list-card-num">{idx + 1}</div>
              <div className="list-card-body">
                <div className="list-card-title">{lesson.title}{lesson.videoUrl && <span className="video-badge">🎬</span>}</div>
                <div className="list-card-meta">{lesson.cases.length} תיקים · {!teacherMode ? `${ld} הושלמו` : 'עיון'}</div>
              </div>
              {full && !teacherMode ? <div className="list-check">✓</div> : <div className="list-arrow">›</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lesson ────────────────────────────────────────────────────────────────
function LessonScreen({ room, lesson, progress, teacherMode, auth, onBack, onSelectCase }: {
  room: RoomData; lesson: LessonData; progress: Progress; teacherMode?: boolean;
  auth: AuthState; onBack: () => void; onSelectCase: (c: CaseData, idx: number) => void;
}) {
  type Tab = 'video' | 'content' | 'source' | 'cases';
  const hasTabs: Tab[] = [...(lesson.videoUrl ? ['video' as Tab] : []), 'content', ...(lesson.sourceContent ? ['source' as Tab] : []), 'cases'];
  const [tab, setTab] = useState<Tab>(hasTabs[0]);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const TAB_ICONS: Record<Tab, string> = { video: '🎬 סרטון', content: '📖 תוכן', source: '📜 מקורות', cases: '⚖️ תיקים' };

  useEffect(() => {
    if (!lesson.videoUrl) return;
    const filename = lesson.videoUrl.replace('./videos/', '');
    apiGetVideoUrl(auth.token, filename)
      .then(setSignedVideoUrl)
      .catch(() => {});
  }, [lesson.videoUrl, auth.token]);

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>← חזרה</button>
        <span className="top-bar-title">{room.titleHe}</span>
      </div>
      <div className="lesson-hero">
        <div className="lesson-hero-icon">{room.icon}</div>
        <h2 className="lesson-hero-title">{lesson.title}</h2>
      </div>
      <div className="tab-bar">
        {hasTabs.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' tab-active' : ''}`} onClick={() => setTab(t)}>{TAB_ICONS[t]}</button>
        ))}
      </div>
      <div className="tab-body">
        {tab === 'video' && lesson.videoUrl && (
          <div className="video-container">
            {signedVideoUrl
              ? <video className="lesson-video" src={signedVideoUrl} controls controlsList="nodownload" playsInline />
              : <div className="video-loading">⏳ טוען סרטון...</div>}
            <div className="video-hint">📌 צפה בסרטון ואז עבור ללשונית <strong>תיקים</strong></div>
          </div>
        )}
        {tab === 'content' && (
          <div className="content-text">
            {lesson.content
              ? lesson.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
              : <p className="empty-hint">📖 עבור ללשונית "תיקים" כדי להתחיל!</p>}
          </div>
        )}
        {tab === 'source' && lesson.sourceContent && (
          <div className="source-box">
            <div className="source-box-header">📜 מקורות הלכתיים</div>
            <div className="source-text">{lesson.sourceContent.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
          </div>
        )}
        {tab === 'cases' && (
          <>
            {!teacherMode && (
              <div className="cases-escape-hint">
                <span>⚖️</span><span>פסוק בכל {lesson.cases.length} תיקי הדין כדי להשלים שיעור זה</span>
              </div>
            )}
            {lesson.cases.map((c, idx) => {
              const done = progress.completedCases.includes(c.id);
              return (
                <div key={c.id} className={`list-card${done ? ' list-card-done' : ''}`} onClick={() => onSelectCase(c, idx)}>
                  <div className="case-card-status-icon">{done ? '✅' : teacherMode ? '📋' : '⚖️'}</div>
                  <div className="list-card-body">
                    <div className="list-card-title">{c.title}</div>
                    <div className="list-card-meta">{teacherMode ? 'לחץ לצפייה' : done ? '✓ הושלם' : 'ממתין לפסיקתך'}</div>
                  </div>
                  <div className="list-arrow">›</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Case (teacher read-only view) ────────────────────────────────────────
const VERDICT_META: Record<Verdict, { label: string; icon: string; color: string }> = {
  liable:           { label: 'חייב',       icon: '❌', color: '#c0392b' },
  exempt:           { label: 'פטור',        icon: '✅', color: '#27ae60' },
  partially_liable: { label: 'חייב חלקית', icon: '⚖️', color: '#e67e22' },
};

// ─── Speech synthesis ──────────────────────────────────────────────────────
function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'he-IL'; utt.rate = 0.88;
    utt.onstart = () => { if (mounted.current) setSpeaking(true); };
    utt.onend   = () => { if (mounted.current) setSpeaking(false); };
    utt.onerror = () => { if (mounted.current) setSpeaking(false); };
    window.speechSynthesis.speak(utt);
  }, []);
  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (mounted.current) setSpeaking(false);
  }, []);
  return { speak, stop, speaking };
}

function SpeechBtn({ text }: { text: string }) {
  const { speak, stop, speaking } = useSpeech();
  if (!('speechSynthesis' in window)) return null;
  return (
    <button className={`speech-btn${speaking ? ' speech-active' : ''}`} type="button"
      onClick={() => speaking ? stop() : speak(text)}
      title={speaking ? 'עצור הקראה' : 'הקרא בקול'}>
      {speaking ? '⏹' : '🔊'}
    </button>
  );
}

// ─── Courtroom decorations ─────────────────────────────────────────────────
function HomeCourtArch() {
  return (
    <svg className="home-arch-bg" viewBox="0 0 600 200" preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0 200 L0 100 Q300 0 600 100 L600 200" fill="#b8872e" fillOpacity="0.04"/>
      <path d="M0 105 Q300 5 600 105" fill="none" stroke="#b8872e" strokeWidth="2.5" strokeOpacity="0.09"/>
      <path d="M30 130 Q300 40 570 130" fill="none" stroke="#b8872e" strokeWidth="1.5" strokeOpacity="0.05"/>
      <rect x="0" y="55" width="26" height="145" rx="6" fill="#b8872e" fillOpacity="0.06"/>
      <rect x="0" y="44" width="40" height="13" rx="4" fill="#b8872e" fillOpacity="0.08"/>
      <rect x="574" y="55" width="26" height="145" rx="6" fill="#b8872e" fillOpacity="0.06"/>
      <rect x="560" y="44" width="40" height="13" rx="4" fill="#b8872e" fillOpacity="0.08"/>
      <rect x="190" y="175" width="220" height="18" rx="6" fill="#b8872e" fillOpacity="0.05"/>
      <rect x="172" y="163" width="256" height="13" rx="5" fill="#b8872e" fillOpacity="0.04"/>
      <text x="300" y="158" textAnchor="middle"
        fontFamily="'Heebo', Arial Hebrew, Arial, sans-serif"
        fontSize="15" fontWeight="700" fill="#b8872e" fillOpacity="0.13" letterSpacing="5">
        בית הדין
      </text>
    </svg>
  );
}

function CaseFigures({ roomIcon }: { roomIcon: string }) {
  return (
    <div className="case-figures">
      <svg className="case-arch-svg" viewBox="0 0 320 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10 56 L10 28 Q160 -8 310 28 L310 56" fill="#b8872e" fillOpacity="0.05"/>
        <path d="M10 28 Q160 -8 310 28" fill="none" stroke="#b8872e" strokeWidth="2" strokeOpacity="0.1"/>
        <rect x="10" y="0" width="10" height="56" rx="3" fill="#b8872e" fillOpacity="0.07"/>
        <rect x="300" y="0" width="10" height="56" rx="3" fill="#b8872e" fillOpacity="0.07"/>
      </svg>
      <div className="case-figures-row">
        <div className="ct-fig">
          <svg viewBox="0 0 40 68" width="38" height="68" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="13" r="10" fill="currentColor" opacity="0.22"/>
            <path d="M8 22 Q8 19 20 22 Q32 19 32 22 L30 60 Q20 64 10 60 Z" fill="currentColor" opacity="0.18"/>
            <path d="M8 30 Q3 40 5 50" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0.18"/>
          </svg>
          <span className="ct-label">תובע</span>
        </div>
        <div className="ct-center-icon">{roomIcon}</div>
        <div className="ct-fig">
          <svg viewBox="0 0 40 68" width="38" height="68" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="13" r="10" fill="currentColor" opacity="0.22"/>
            <path d="M8 22 Q8 19 20 22 Q32 19 32 22 L30 60 Q20 64 10 60 Z" fill="currentColor" opacity="0.18"/>
            <path d="M32 30 Q37 40 35 50" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0.18"/>
          </svg>
          <span className="ct-label">נתבע</span>
        </div>
      </div>
    </div>
  );
}

function TeacherCaseView({ caseData, caseIndex, lesson: _lesson, onBack, onProject }: {
  caseData: CaseData; caseIndex: number; lesson: LessonData;
  onBack: () => void; onProject?: () => void;
}) {
  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>← חזרה</button>
        <span className="top-bar-title">תיק {caseIndex + 1} — עיון מורה</span>
        {onProject && (
          <button className="project-launch-btn" onClick={onProject}>📡 הקרן</button>
        )}
      </div>
      <div className="case-body">
        <div className="case-panel">
          <div className="teacher-view-badge">🎓 תצוגת מורה — כל המידע גלוי</div>
          <h2 className="case-panel-title">{caseData.title}</h2>
          <div className="scenario-card">
            <div className="scenario-card-label">
              <span>תיאור המקרה</span>
              <SpeechBtn text={caseData.scenario} />
            </div>
            <p className="scenario-card-text">{caseData.scenario}</p>
          </div>
          <div className="teacher-verdict-card" style={{ borderColor: VERDICT_META[caseData.verdict].color }}>
            <div className="teacher-verdict-label">הדין ההלכתי</div>
            <div className="teacher-verdict-answer" style={{ color: VERDICT_META[caseData.verdict].color }}>
              {VERDICT_META[caseData.verdict].icon} {VERDICT_META[caseData.verdict].label}
            </div>
          </div>
          <div className="explanation-box">
            <div className="explanation-header">
              <span>📖 הסבר הדין</span>
              <SpeechBtn text={caseData.explanation} />
            </div>
            <p className="explanation-text">{caseData.explanation}</p>
          </div>
          {onProject && (
            <button className="primary-btn full-btn projection-big-btn" onClick={onProject}>
              📡 הקרן תיק זה על המסך
            </button>
          )}
          <button className="secondary-btn full-btn" onClick={onBack}>← חזרה לרשימת התיקים</button>
        </div>
      </div>
    </div>
  );
}

// ─── Case (student game) ───────────────────────────────────────────────────
type CaseStep = 'scenario' | 'investigate' | 'verdict' | 'result';
const STEP_LABELS: Record<CaseStep, string> = { scenario: 'תיאור', investigate: 'חקירה', verdict: 'פסיקה', result: 'תוצאה' };
const ALL_STEPS: CaseStep[] = ['scenario', 'investigate', 'verdict', 'result'];
const MIN_REASONING = 15;

function CaseScreen({ room, lesson, caseData, caseIndex, progress, teacherMode, streak, onComplete, onBack, onProject }: {
  room: RoomData; lesson: LessonData; caseData: CaseData; caseIndex: number;
  progress: Progress; teacherMode?: boolean; streak?: number;
  onComplete: (reasoning: string, hintUsed: boolean) => void; onBack: () => void; onProject?: () => void;
}) {
  if (teacherMode) return <TeacherCaseView caseData={caseData} caseIndex={caseIndex} lesson={lesson} onBack={onBack} onProject={onProject} />;

  const alreadyDone = progress.completedCases.includes(caseData.id);
  const savedReasoning = progress.reasoning[caseData.id] ?? '';
  const [step, setStep] = useState<CaseStep>(alreadyDone ? 'result' : 'scenario');
  const [myVerdict, setMyVerdict] = useState<Verdict | null>(alreadyDone ? caseData.verdict : null);
  const [reasoning, setReasoning] = useState(savedReasoning);
  const [submitted, setSubmitted] = useState(alreadyDone);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [judgeReaction, setJudgeReaction] = useState<'correct' | 'wrong' | 'idle'>('idle');
  const reasoningRef = useRef<HTMLTextAreaElement>(null);

  const stepIdx = ALL_STEPS.indexOf(step);
  const isCorrect = submitted && myVerdict === caseData.verdict;
  const canSubmit = !!myVerdict && reasoning.trim().length >= MIN_REASONING;

  const totalInRoom = ACTIVE_ROOMS.find(r => r.id === room.id)?.lessons.flatMap(l => l.cases).length ?? 0;
  const doneInRoom = progress.completedCases.filter(id =>
    ACTIVE_ROOMS.find(r => r.id === room.id)?.lessons.flatMap(l => l.cases).some(c => c.id === id)
  ).length;

  function handleSubmit() {
    if (!canSubmit) return;
    const correct = myVerdict === caseData.verdict;
    setSubmitted(true);
    setStep('result');
    setJudgeReaction(correct ? 'correct' : 'wrong');
    if (!alreadyDone && correct) {
      onComplete(reasoning.trim(), hintUsed);
      const xp = hintUsed ? 25 : 50;
      setXpEarned(xp);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1800);
    }
  }

  function handleRetry() {
    setStep('scenario');
    setMyVerdict(null);
    setReasoning('');
    setSubmitted(false);
    setHintRevealed(false);
  }

  return (
    <div className="screen">
      <JudgeCharacter reaction={judgeReaction} onDone={() => setJudgeReaction('idle')} />
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>← חזרה</button>
        <span className="top-bar-title">תיק {caseIndex + 1} מתוך {lesson.cases.length}</span>
      </div>
      <div className="step-bar">
        {ALL_STEPS.map((s, i) => (
          <div key={s} className={`step-item${i <= stepIdx ? ' step-past' : ''}${i === stepIdx ? ' step-current' : ''}`}>
            <div className="step-dot">{i < stepIdx ? '✓' : i + 1}</div>
            <div className="step-label">{STEP_LABELS[s]}</div>
          </div>
        ))}
      </div>

      <div className="case-body">
        {/* SCENARIO */}
        {step === 'scenario' && (
          <div className="case-panel">
            <CaseFigures roomIcon={room.icon} />
            <h2 className="case-panel-title">{caseData.title}</h2>
            <div className="scenario-card">
              <div className="scenario-card-label">
                <span>תיאור המקרה</span>
                <SpeechBtn text={caseData.scenario} />
              </div>
              <p className="scenario-card-text">{caseData.scenario}</p>
            </div>
            <div className="case-escape-progress">
              🔒 {doneInRoom}/{totalInRoom} תיקים הושלמו בחדר
            </div>
            <button className="primary-btn full-btn" onClick={() => setStep('investigate')}>חקור את המקרה ←</button>
          </div>
        )}

        {/* INVESTIGATE */}
        {step === 'investigate' && (
          <div className="case-panel">
            <div className="case-panel-icon">🔍</div>
            <h2 className="case-panel-title">חקירת המקרה</h2>
            <div className="investigate-box">
              <div className="investigate-header">⚖️ שאלות לבחינה לפני פסיקה:</div>
              <div className="investigate-q">• מי הצדדים במקרה? מה טענת כל צד?</div>
              <div className="investigate-q">• מה בדיוק קרה? מה גרם לסכסוך?</div>
              <div className="investigate-q">• אילו כללים הלכתיים שלמדת בשיעור זה עשויים לחול?</div>
              <div className="investigate-q">• האם יש פרטים מיוחדים שעשויים לשנות את הדין?</div>
            </div>
            <div className="scenario-card">
              <div className="scenario-card-label">
                <span>📋 תזכורת — המקרה</span>
                <SpeechBtn text={caseData.scenario} />
              </div>
              <p className="scenario-card-text">{caseData.scenario}</p>
            </div>
            <div className="two-btn-row">
              <button className="secondary-btn" onClick={() => setStep('scenario')}>→ חזרה</button>
              <button className="primary-btn" onClick={() => { setStep('verdict'); setTimeout(() => reasoningRef.current?.focus(), 100); }}>לפסיקה ←</button>
            </div>
          </div>
        )}

        {/* VERDICT + REASONING */}
        {step === 'verdict' && !submitted && (
          <div className="case-panel">
            <div className="case-panel-icon">⚖️</div>
            <h2 className="case-panel-title">פסיקתך</h2>

            {/* Reasoning textarea */}
            <div className="reasoning-box">
              <div className="reasoning-label">✍️ נמק את פסיקתך <span className="reasoning-required">(חובה)</span></div>
              <textarea
                ref={reasoningRef}
                className="reasoning-textarea"
                placeholder="כתוב כאן את נימוקך ההלכתי — איזה כלל חל? מדוע?"
                value={reasoning}
                onChange={e => setReasoning(e.target.value)}
                rows={4}
              />
              <div className={`reasoning-counter ${reasoning.trim().length >= MIN_REASONING ? 'counter-ok' : ''}`}>
                {reasoning.trim().length}/{MIN_REASONING} תווים מינימום
              </div>
            </div>

            {/* Verdict buttons */}
            <p className="verdict-prompt">כעת בחר את פסיקתך:</p>
            <div className="verdict-options">
              {(['liable', 'exempt', 'partially_liable'] as Verdict[]).map(v => {
                const m = VERDICT_META[v];
                return (
                  <button key={v}
                    className={`verdict-btn verdict-btn-${v}${myVerdict === v ? ' verdict-selected' : ''}`}
                    onClick={() => setMyVerdict(v)}>
                    <div className="verdict-btn-icon">{m.icon}</div>
                    <div className="verdict-btn-label">{m.label}</div>
                    {myVerdict === v && <div className="verdict-check-mark">✓</div>}
                  </button>
                );
              })}
            </div>

            {!canSubmit && myVerdict && reasoning.trim().length < MIN_REASONING && (
              <div className="submit-hint">⚠️ יש לכתוב נימוק של לפחות {MIN_REASONING} תווים</div>
            )}
            <div className="hint-section">
              {!hintRevealed ? (
                <button className="hint-btn" onClick={() => { setHintUsed(true); setHintRevealed(true); }}>
                  💡 {hintUsed ? 'הצג שוב את הרמז' : 'רמז (−2 נקודות)'}
                </button>
              ) : (
                <div className="hint-box">
                  <div className="hint-box-header">💡 רמז מהמקורות<span className="hint-penalty"> — −2 נקודות מציונך</span></div>
                  <p className="hint-box-text">{lesson.sourceContent || lesson.content}</p>
                </div>
              )}
            </div>
            <div className="two-btn-row">
              <button className="secondary-btn" onClick={() => setStep('investigate')}>→ חזרה</button>
              <button className={`primary-btn${!canSubmit ? ' btn-disabled' : ''}`} disabled={!canSubmit} onClick={handleSubmit}>הגש פסיקה ←</button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && submitted && myVerdict && (
          <div className="case-panel">
            {showXP && <div className="xp-popup">+{xpEarned} XP ⚖️</div>}
            <div className={`result-banner${isCorrect ? ' banner-correct' : ' banner-wrong'}`}>
              <span className="result-banner-icon">{isCorrect ? '🎉' : '📚'}</span>
              <span>{isCorrect ? 'פסיקה נכונה! אתה דיין מצוין!' : 'הגמרא פוסקת אחרת — אבל למדת!'}</span>
            </div>
            {isCorrect && !alreadyDone && streak !== undefined && streak >= 2 && (
              <div className="streak-badge">🔥 {streak} ברצף!</div>
            )}
            <div className="verdict-comparison">
              <div className="verdict-chip" style={{ backgroundColor: VERDICT_META[myVerdict].color }}>פסיקתך: {VERDICT_META[myVerdict].label}</div>
              <div className="verdict-chip" style={{ backgroundColor: VERDICT_META[caseData.verdict].color }}>הדין: {VERDICT_META[caseData.verdict].label}</div>
            </div>

            {/* Show submitted reasoning */}
            <div className="reasoning-result-box">
              <div className="reasoning-result-label">✍️ הנימוק שלך</div>
              <p className="reasoning-result-text">{reasoning || savedReasoning}</p>
            </div>

            <div className="explanation-box">
              <div className="explanation-header">
                <span>📖 הסבר הדין</span>
                <SpeechBtn text={caseData.explanation} />
              </div>
              <p className="explanation-text">{caseData.explanation}</p>
            </div>
            <div className="case-escape-progress after-result">
              {doneInRoom + (alreadyDone || !isCorrect ? 0 : 1)}/{totalInRoom} תיקים בחדר · {Math.max(0, totalInRoom - doneInRoom - (alreadyDone || !isCorrect ? 0 : 1))} נותרו לצאת
            </div>
            {!isCorrect && (
              <button className="secondary-btn full-btn" onClick={handleRetry}>↺ נסה שוב</button>
            )}
            <button className="primary-btn full-btn" onClick={onBack}>סיום תיק ←</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Projection mode ───────────────────────────────────────────────────────
type ProjStep = 'scenario' | 'verdict' | 'explanation';

function ProjectionScreen({ room, lesson, caseData, caseIndex, totalCases, onNext, onPrev, onClose }: {
  room: RoomData; lesson: LessonData; caseData: CaseData;
  caseIndex: number; totalCases: number;
  onNext: () => void; onPrev: () => void; onClose: () => void;
}) {
  const [step, setStep] = useState<ProjStep>('scenario');
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onNextRef.current = onNext; onPrevRef.current = onPrev; onCloseRef.current = onClose; });
  useEffect(() => { setStep('scenario'); }, [caseData.id]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key === 'ArrowLeft')  { onNextRef.current(); return; }
      if (e.key === 'ArrowRight') { onPrevRef.current(); return; }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setStep(s => s === 'scenario' ? 'verdict' : s === 'verdict' ? 'explanation' : 'explanation');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const m = VERDICT_META[caseData.verdict];
  return (
    <div className="projection-overlay">
      <div className="projection-top-bar">
        <button className="projection-close-btn" onClick={onClose}>✕ סגור</button>
        <div className="projection-crumbs">{room.icon} {room.titleHe} · {lesson.title}</div>
        <div className="projection-nav-group">
          <button className="projection-nav-btn" onClick={onPrev} disabled={caseIndex === 0}>→</button>
          <span className="projection-nav-pos">{caseIndex + 1} / {totalCases}</span>
          <button className="projection-nav-btn" onClick={onNext} disabled={caseIndex === totalCases - 1}>←</button>
        </div>
      </div>
      <div className="projection-content">
        <h1 className="projection-title">{caseData.title}</h1>
        <div className="projection-card">
          <div className="projection-card-label">📋 תיאור המקרה</div>
          <p className="projection-card-text">{caseData.scenario}</p>
        </div>
        {step !== 'scenario' && (
          <div className="projection-card projection-verdict-card" style={{ borderColor: m.color }}>
            <div className="projection-card-label">⚖️ הדין ההלכתי</div>
            <div className="projection-verdict-answer" style={{ color: m.color }}>{m.icon} {m.label}</div>
          </div>
        )}
        {step === 'explanation' && (
          <div className="projection-card projection-expl-card">
            <div className="projection-card-label">📖 הסבר הדין</div>
            <p className="projection-card-text">{caseData.explanation}</p>
          </div>
        )}
      </div>
      <div className="projection-footer">
        {step === 'scenario' && (
          <button className="projection-advance-btn" onClick={() => setStep('verdict')}>גלה פסיקה ←</button>
        )}
        {step === 'verdict' && (
          <button className="projection-advance-btn" onClick={() => setStep('explanation')}>גלה הסבר ←</button>
        )}
        {step === 'explanation' && (
          <div className="projection-keyboard-hint">← → — ניווט בין תיקים · Esc — סגור</div>
        )}
      </div>
    </div>
  );
}

// ─── Certificate ───────────────────────────────────────────────────────────
function CertificateModal({ roomTitle, achievement, userName, onClose }: {
  roomTitle: string; achievement: { titleHe: string; icon: string; description: string };
  userName: string; onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;
    const cw = canvas.width;
    const ch = canvas.height;
    const COLORS = ['#b8872e', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#c026d3', '#e11d48', '#06b6d4'];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * cw,
      y: -30 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 5,
      vy: 3 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 7 + Math.random() * 7,
      h: 11 + Math.random() * 7,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 9,
    }));
    let raf = 0;
    let alive = true;
    function draw() {
      if (!alive) return;
      ctx.clearRect(0, 0, cw, ch);
      let active = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.rot += p.rotV;
        if (p.y < ch + 20) active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (active) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <canvas ref={canvasRef} className="confetti-canvas" />
      <div className="certificate-modal" onClick={e => e.stopPropagation()}>
        <span className="cert-corner tl">✦</span><span className="cert-corner tr">✦</span>
        <span className="cert-corner bl">✦</span><span className="cert-corner br">✦</span>
        <div className="cert-header-text">בית הדין של דיינים צעירים</div>
        <div className="cert-subtitle">מעניק בזאת תעודה של הצטיינות</div>
        <div className="cert-icon-circle">{achievement.icon}</div>
        <div className="cert-title">{achievement.titleHe}</div>
        <div className="cert-name">מוענק ל: {userName}</div>
        <div className="cert-room-badge">{roomTitle}</div>
        <div className="cert-description">{achievement.description}</div>
        <div className="cert-divider" />
        <div className="cert-stamp">✍ חתימת הדיין הראשי</div>
        <button className="cert-close-btn" onClick={onClose}>🎉 המשך בהצלחה!</button>
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<AppScreen>({ name: 'splash' });
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [progress, setProgress] = useState<Progress>({ completedCases: [], completedRooms: [], reasoning: {}, usedHints: [] });
  const [cert, setCert] = useState<{ roomTitle: string; ach: (typeof ROOM_ACHIEVEMENTS)[number] } | null>(null);
  const [teacherBrowse, setTeacherBrowse] = useState(false);
  const [projecting, setProjecting] = useState<{ room: RoomData; lesson: LessonData; caseIndex: number } | null>(null);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => { scorm.init(); return () => { scorm.finish(); }; }, []);

  // Load progress when auth is set
  useEffect(() => {
    if (auth) setProgress(loadProgress(auth.user.id));
  }, [auth?.user.id]);

  // Sync progress to backend whenever completed cases change
  useEffect(() => {
    if (!auth || auth.user.role === 'teacher' || auth.user.role === 'admin') return;
    if (progress.completedCases.length === 0) return;
    apiSyncProgress(auth.token, {
      completedCases: progress.completedCases,
      completedRooms: progress.completedRooms,
      hintsUsed: progress.usedHints.length,
    }).catch(() => showToast('ההתקדמות לא נשמרה לשרת — בדוק חיבור לאינטרנט', 'error'));
  }, [progress.completedCases.length, progress.usedHints.length, auth?.token]);

  function handleLogin(a: AuthState) {
    setAuth(a);
    setProgress(loadProgress(a.user.id));
    if (a.user.role === 'teacher' || a.user.role === 'admin') {
      setTeacherBrowse(false);
      setScreen({ name: 'teacher-dashboard' });
    } else if (!a.user.classCode) {
      setScreen({ name: 'join-class' });
    } else {
      const saw = localStorage.getItem(`escape_intro_${a.user.id}`);
      setScreen(saw ? { name: 'home' } : { name: 'intro' });
    }
  }

  function handleLogout() {
    clearAuth();
    setAuth(null);
    setTeacherBrowse(false);
    setScreen({ name: 'login' });
  }

  const isTeacher = auth?.user.role === 'teacher' || auth?.user.role === 'admin';

  const completeCase = useCallback((caseId: string, roomId: string, roomOrder: number, reasoning: string, hintUsed: boolean) => {
    if (!auth) return;
    setProgress(prev => {
      const newCases = prev.completedCases.includes(caseId) ? prev.completedCases : [...prev.completedCases, caseId];
      const newReasoning = { ...prev.reasoning, [caseId]: reasoning };
      const newHints = hintUsed && !prev.usedHints.includes(caseId)
        ? [...prev.usedHints, caseId] : prev.usedHints;
      const room = ACTIVE_ROOMS.find(r => r.id === roomId);
      const allIds = room?.lessons.flatMap(l => l.cases).map(c => c.id) ?? [];
      const roomNowComplete = allIds.length > 0 && allIds.every(id => newCases.includes(id));
      const newRooms = roomNowComplete && !prev.completedRooms.includes(roomId)
        ? [...prev.completedRooms, roomId] : prev.completedRooms;
      const next = { completedCases: newCases, completedRooms: newRooms, reasoning: newReasoning, usedHints: newHints };
      saveProgress(next, auth.user.id);
      if (!prev.completedCases.includes(caseId)) {
        const count = newCases.length;
        setTimeout(() => setSessionStreak(s => s + 1), 0);
        if (count === 10) setTimeout(() => showToast('🎯 10 פסיקות! ממשיכים בקצב!', 'success'), 700);
        else if (count === 19) setTimeout(() => showToast('⭐ חצי הדרך — 19 תיקים מאחורינו!', 'success'), 700);
        else if (count === 30) setTimeout(() => showToast('🏃 עוד 8 תיקים — כמעט גמרנו!', 'success'), 700);
        else if (count === TOTAL_CASES) setTimeout(() => showToast('🏆 כל 38 התיקים הושלמו!', 'success'), 700);
      }
      if (roomNowComplete && !prev.completedRooms.includes(roomId)) {
        const ach = ROOM_ACHIEVEMENTS[roomOrder];
        if (ach && room) setTimeout(() => setCert({ roomTitle: room.titleHe, ach }), 500);
      }
      return next;
    });
  }, [auth]);

  function afterSplash() {
    if (auth) {
      if (isTeacher) setScreen({ name: 'teacher-dashboard' });
      else setScreen({ name: 'home' });
    } else {
      setScreen({ name: 'login' });
    }
  }

  const render = () => {
    if (screen.name === 'splash') return <SplashScreen onDone={afterSplash} />;
    if (screen.name === 'login') return <LoginScreen onLogin={handleLogin} />;
    if (!auth) return <LoginScreen onLogin={handleLogin} />;

    if (screen.name === 'intro') return (
      <IntroScreen userName={auth.user.name} onStart={() => {
        localStorage.setItem(`escape_intro_${auth.user.id}`, '1');
        setScreen({ name: 'home' });
      }} />
    );

    if (screen.name === 'join-class') return (
      <JoinClassScreen auth={auth}
        onJoined={(_className) => {
          const saw = localStorage.getItem(`escape_intro_${auth.user.id}`);
          setScreen(saw ? { name: 'home' } : { name: 'intro' });
        }}
        onSkip={() => {
          const saw = localStorage.getItem(`escape_intro_${auth.user.id}`);
          setScreen(saw ? { name: 'home' } : { name: 'intro' });
        }} />
    );

    if (screen.name === 'leaderboard') return (
      <LeaderboardScreen auth={auth} onClose={() => setScreen({ name: 'teacher-dashboard' })} />
    );

    if (screen.name === 'teacher-dashboard') return (
      <TeacherDashboard auth={auth}
        onBrowse={() => { setTeacherBrowse(true); setScreen({ name: 'home' }); }}
        onLogout={handleLogout}
        onLeaderboard={() => setScreen({ name: 'leaderboard' })} />
    );

    const tMode = teacherBrowse && isTeacher;

    if (screen.name === 'courtroom') return (
      <CourtroomScene
        roomName={screen.room.titleHe}
        onClose={() => setScreen({ name: 'home' })}
        onEnterCase={() => setScreen({ name: 'room', room: screen.room })}
      />
    );

    if (screen.name === 'home') return (
      <HomeScreen progress={progress} teacherMode={tMode} auth={auth}
        onSelectRoom={r => setScreen({ name: 'room', room: r })}
        onShowIntro={() => setScreen({ name: 'intro' })}
        onEnterCourtroom={r => setScreen({ name: 'courtroom', room: r })}
        onDashboard={isTeacher ? () => setScreen({ name: 'teacher-dashboard' }) : undefined}
        onLogout={handleLogout} />
    );
    if (screen.name === 'room') return (
      <RoomScreen room={screen.room} progress={progress} teacherMode={tMode}
        onBack={() => setScreen({ name: 'home' })}
        onSelectLesson={l => setScreen({ name: 'lesson', room: screen.room, lesson: l })} />
    );
    if (screen.name === 'lesson') return (
      <LessonScreen room={screen.room} lesson={screen.lesson} progress={progress} teacherMode={tMode} auth={auth}
        onBack={() => setScreen({ name: 'room', room: screen.room })}
        onSelectCase={(c, idx) => setScreen({ name: 'case', room: screen.room, lesson: screen.lesson, caseData: c, caseIndex: idx })} />
    );
    if (screen.name === 'case') return (
      <CaseScreen room={screen.room} lesson={screen.lesson} caseData={screen.caseData}
        caseIndex={screen.caseIndex} progress={progress} teacherMode={tMode} streak={sessionStreak}
        onComplete={(r, h) => completeCase(screen.caseData.id, screen.room.id, screen.room.order, r, h)}
        onBack={() => setScreen({ name: 'lesson', room: screen.room, lesson: screen.lesson })}
        onProject={tMode ? () => setProjecting({ room: screen.room, lesson: screen.lesson, caseIndex: screen.caseIndex }) : undefined} />
    );
    return null;
  };

  return (
    <div className="app-root" dir="rtl">
      {render()}
      {projecting && (() => {
        const p = projecting;
        const total = p.lesson.cases.length;
        const cd = p.lesson.cases[p.caseIndex];
        return (
          <ProjectionScreen
            room={p.room} lesson={p.lesson} caseData={cd}
            caseIndex={p.caseIndex} totalCases={total}
            onNext={() => setProjecting(prev => prev && prev.caseIndex < total - 1 ? { ...prev, caseIndex: prev.caseIndex + 1 } : prev)}
            onPrev={() => setProjecting(prev => prev && prev.caseIndex > 0 ? { ...prev, caseIndex: prev.caseIndex - 1 } : prev)}
            onClose={() => setProjecting(null)} />
        );
      })()}
      {cert && auth && (
        <CertificateModal roomTitle={cert.roomTitle} achievement={cert.ach}
          userName={auth.user.name} onClose={() => setCert(null)} />
      )}
      <Toast toasts={toasts} />
    </div>
  );
}
