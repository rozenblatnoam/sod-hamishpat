import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ROOMS, ROOM_ACHIEVEMENTS, TOTAL_CASES } from './content/rooms';
import type { RoomData, LessonData, CaseData, Verdict } from './content/types';
import { scorm } from './scorm/ScormAPI';
import { apiLogin, apiRegister, apiGetClassStats, type AuthUser, type ClassStats } from './api';
import './index.css';

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
}

function progressKey(userId: number) { return `escape_progress_${userId}`; }

function loadProgress(userId: number): Progress {
  const s = scorm.getSuspendData() as Progress | null;
  if (s?.completedCases) return { completedCases: s.completedCases, completedRooms: s.completedRooms, reasoning: s.reasoning ?? {} };
  try { const ls = localStorage.getItem(progressKey(userId)); if (ls) return JSON.parse(ls); } catch {}
  return { completedCases: [], completedRooms: [], reasoning: {} };
}
function saveProgress(p: Progress, userId: number) {
  scorm.setSuspendData(p);
  localStorage.setItem(progressKey(userId), JSON.stringify(p));
  const pct = TOTAL_CASES > 0 ? Math.round((p.completedCases.length / TOTAL_CASES) * 100) : 0;
  scorm.setScore(pct);
  scorm.setStatus(pct >= 70 ? 'passed' : 'incomplete');
}

// ─── Screen types ──────────────────────────────────────────────────────────
type AppScreen =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'intro' }
  | { name: 'home' }
  | { name: 'room'; room: RoomData }
  | { name: 'lesson'; room: RoomData; lesson: LessonData }
  | { name: 'case'; room: RoomData; lesson: LessonData; caseData: CaseData; caseIndex: number }
  | { name: 'teacher-dashboard' };

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

// ─── Login / Register ──────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (auth: AuthState) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');

  function switchMode(m: 'login' | 'register') { setMode(m); setError(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setError('נא למלא אימייל וסיסמה'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiLogin(loginEmail.trim(), loginPassword);
      saveAuth(data); onLogin(data);
    } catch (err: any) { setError(err.message ?? 'שגיאה לא ידועה'); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim()) { setError('נא להזין שם מלא'); return; }
    if (!regEmail.trim()) { setError('נא להזין אימייל'); return; }
    if (regPassword.length < 6) { setError('סיסמה חייבת לפחות 6 תווים'); return; }
    if (regPassword !== regPassword2) { setError('הסיסמאות אינן תואמות'); return; }
    if (!regSchool.trim()) { setError('נא להזין שם בית ספר'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiRegister({
        name: regName.trim(), email: regEmail.trim(),
        password: regPassword, school: regSchool.trim(),
        class: regClass.trim() || undefined, role: regRole,
      });
      saveAuth(data); onLogin(data);
    } catch (err: any) { setError(err.message ?? 'שגיאה לא ידועה'); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img src="./logo.png" alt="סוד המשפט" className="login-logo" />
        </div>
        <h1 className="login-title">סוד המשפט</h1>
        <p className="login-subtitle">תוכנית דיינים צעירים</p>

        {/* Mode toggle */}
        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' auth-tab-active' : ''}`} onClick={() => switchMode('login')}>כניסה</button>
          <button className={`auth-tab${mode === 'register' ? ' auth-tab-active' : ''}`} onClick={() => switchMode('register')}>הרשמה</button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="form-field">
              <label className="form-label">אימייל</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                autoComplete="email" dir="ltr" />
            </div>
            <div className="form-field">
              <label className="form-label">סיסמה</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                autoComplete="current-password" dir="ltr" />
            </div>
            {error && <div className="login-error">⚠️ {error}</div>}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'מתחבר...' : 'כניסה →'}
            </button>
            <button type="button" className="switch-mode-link" onClick={() => switchMode('register')}>
              עדיין אין חשבון? הירשם כאן
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form className="login-form" onSubmit={handleRegister} noValidate>
            <div className="form-field">
              <label className="form-label">שם מלא</label>
              <input className="form-input" type="text" placeholder="ישראל ישראלי"
                value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">אימייל</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={regEmail} onChange={e => setRegEmail(e.target.value)}
                autoComplete="email" dir="ltr" />
            </div>
            <div className="form-field">
              <label className="form-label">סיסמה</label>
              <input className="form-input" type="password" placeholder="לפחות 6 תווים"
                value={regPassword} onChange={e => setRegPassword(e.target.value)}
                autoComplete="new-password" dir="ltr" />
            </div>
            <div className="form-field">
              <label className="form-label">אימות סיסמה</label>
              <input className={`form-input${regPassword2 && regPassword2 !== regPassword ? ' input-error' : ''}`}
                type="password" placeholder="חזור על הסיסמה"
                value={regPassword2} onChange={e => setRegPassword2(e.target.value)}
                autoComplete="new-password" dir="ltr" />
            </div>
            <div className="form-field">
              <label className="form-label">בית ספר</label>
              <input className="form-input" type="text" placeholder="שם בית הספר"
                value={regSchool} onChange={e => setRegSchool(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">כיתה (אופציונלי)</label>
                <input className="form-input" type="text" placeholder='ז׳, ח׳...'
                  value={regClass} onChange={e => setRegClass(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">תפקיד</label>
                <div className="role-select">
                  <button type="button"
                    className={`role-select-btn${regRole === 'student' ? ' role-select-active' : ''}`}
                    onClick={() => setRegRole('student')}>👤 תלמיד</button>
                  <button type="button"
                    className={`role-select-btn${regRole === 'teacher' ? ' role-select-active' : ''}`}
                    onClick={() => setRegRole('teacher')}>🎓 מורה</button>
                </div>
              </div>
            </div>
            {error && <div className="login-error">⚠️ {error}</div>}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'נרשם...' : 'הרשמה →'}
            </button>
            <button type="button" className="switch-mode-link" onClick={() => switchMode('login')}>
              יש לך כבר חשבון? כנס כאן
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Teacher Dashboard ─────────────────────────────────────────────────────
function TeacherDashboard({ auth, onBrowse, onLogout }: {
  auth: AuthState; onBrowse: () => void; onLogout: () => void;
}) {
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetClassStats(auth.token)
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [auth.token]);

  return (
    <div className="screen teacher-screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onLogout}>יציאה</button>
        <span className="top-bar-title">דשבורד מורה</span>
        <button className="teacher-browse-btn" onClick={onBrowse}>עיון בחומר ›</button>
      </div>

      <div className="teacher-hero">
        <div className="teacher-hero-icon">🎓</div>
        <div>
          <div className="teacher-hero-name">שלום, {auth.user.name}</div>
          <div className="teacher-hero-school">{auth.user.school ?? 'מורה'}</div>
        </div>
      </div>

      {loading && <div className="loading-msg">⏳ טוען נתוני כיתה...</div>}
      {error && <div className="error-msg">⚠️ {error}</div>}

      {stats && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{stats.totalStudents}</div>
              <div className="stat-label">תלמידים</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.avgScore}</div>
              <div className="stat-label">ציון ממוצע</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.avgCompletion}%</div>
              <div className="stat-label">השלמה ממוצעת</div>
            </div>
          </div>

          <div className="section-label">תלמידי הכיתה</div>
          <div className="students-list">
            {stats.students.length === 0
              ? <div className="empty-hint">אין תלמידים רשומים עדיין</div>
              : stats.students.map(s => (
                <div key={s.id} className="student-card">
                  <div className="student-avatar">{s.name.charAt(0)}</div>
                  <div className="student-info">
                    <div className="student-name">{s.name}</div>
                    <div className="student-meta">{s.level} · ציון: {s.score}</div>
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
            <div className="escape-stat"><div className="escape-stat-num">{ROOMS.length}</div><div className="escape-stat-label">חדרים</div></div>
            <div className="escape-stat"><div className="escape-stat-num">{TOTAL_CASES}</div><div className="escape-stat-label">תיקים</div></div>
            <div className="escape-stat"><div className="escape-stat-num">{ROOMS.reduce((s, r) => s + r.lessons.length, 0)}</div><div className="escape-stat-label">שיעורים</div></div>
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
function HomeScreen({ progress, onSelectRoom, onShowIntro, auth, onDashboard, onLogout, teacherMode }: {
  progress: Progress; onSelectRoom: (r: RoomData) => void;
  onShowIntro: () => void; auth: AuthState;
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
        <div className="home-logo-wrap"><img src="./logo.png" alt="סוד המשפט" className="home-logo-img" /></div>
        <h1 className="home-title">סוד המשפט</h1>
        <h2 className="home-subtitle">תוכנית דיינים צעירים</h2>
        {teacherMode
          ? <p className="home-tagline teacher-mode-badge">🎓 מצב עיון מורה — לצפייה בלבד</p>
          : <p className="home-tagline">למד, חקור, פסוק — הפוך לדיין!</p>}
        {!teacherMode && <button className="home-how-btn" onClick={onShowIntro}>❓ כיצד משחקים</button>}
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
        {ROOMS.map(room => {
          const roomCases = room.lessons.flatMap(l => l.cases);
          const roomDone = roomCases.filter(c => progress.completedCases.includes(c.id)).length;
          const roomPct = roomCases.length > 0 ? Math.round((roomDone / roomCases.length) * 100) : 0;
          const isCompleted = progress.completedRooms.includes(room.id);
          return (
            <div key={room.id}
              className={`room-card${isCompleted ? ' room-card-completed' : ''}`}
              style={{ '--room-color': room.color } as React.CSSProperties}
              onClick={() => onSelectRoom(room)}>
              {isCompleted && <div className="room-done-badge">✓ הושלם</div>}
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
              const room = ROOMS.find(r => r.id === rid);
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
function LessonScreen({ room, lesson, progress, teacherMode, onBack, onSelectCase }: {
  room: RoomData; lesson: LessonData; progress: Progress; teacherMode?: boolean;
  onBack: () => void; onSelectCase: (c: CaseData, idx: number) => void;
}) {
  type Tab = 'video' | 'content' | 'source' | 'cases';
  const hasTabs: Tab[] = [...(lesson.videoUrl ? ['video' as Tab] : []), 'content', ...(lesson.sourceContent ? ['source' as Tab] : []), 'cases'];
  const [tab, setTab] = useState<Tab>(hasTabs[0]);
  const TAB_ICONS: Record<Tab, string> = { video: '🎬 סרטון', content: '📖 תוכן', source: '📜 מקורות', cases: '⚖️ תיקים' };

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
            <video className="lesson-video" src={lesson.videoUrl} controls controlsList="nodownload" playsInline />
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

function TeacherCaseView({ caseData, caseIndex, onBack }: {
  caseData: CaseData; caseIndex: number; onBack: () => void;
}) {
  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>← חזרה</button>
        <span className="top-bar-title">תיק {caseIndex + 1} — עיון מורה</span>
      </div>
      <div className="case-body">
        <div className="case-panel">
          <div className="teacher-view-badge">🎓 תצוגת מורה — כל המידע גלוי</div>
          <h2 className="case-panel-title">{caseData.title}</h2>
          <div className="scenario-card">
            <div className="scenario-card-label">תיאור המקרה</div>
            <p className="scenario-card-text">{caseData.scenario}</p>
          </div>
          <div className="teacher-verdict-card" style={{ borderColor: VERDICT_META[caseData.verdict].color }}>
            <div className="teacher-verdict-label">הדין ההלכתי</div>
            <div className="teacher-verdict-answer" style={{ color: VERDICT_META[caseData.verdict].color }}>
              {VERDICT_META[caseData.verdict].icon} {VERDICT_META[caseData.verdict].label}
            </div>
          </div>
          <div className="explanation-box">
            <div className="explanation-header">📖 הסבר הדין</div>
            <p className="explanation-text">{caseData.explanation}</p>
          </div>
          <button className="primary-btn full-btn" onClick={onBack}>← חזרה לרשימת התיקים</button>
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

function CaseScreen({ room, lesson, caseData, caseIndex, progress, teacherMode, onComplete, onBack }: {
  room: RoomData; lesson: LessonData; caseData: CaseData; caseIndex: number;
  progress: Progress; teacherMode?: boolean; onComplete: (reasoning: string) => void; onBack: () => void;
}) {
  if (teacherMode) return <TeacherCaseView caseData={caseData} caseIndex={caseIndex} onBack={onBack} />;

  const alreadyDone = progress.completedCases.includes(caseData.id);
  const savedReasoning = progress.reasoning[caseData.id] ?? '';
  const [step, setStep] = useState<CaseStep>(alreadyDone ? 'result' : 'scenario');
  const [myVerdict, setMyVerdict] = useState<Verdict | null>(alreadyDone ? caseData.verdict : null);
  const [reasoning, setReasoning] = useState(savedReasoning);
  const [submitted, setSubmitted] = useState(alreadyDone);
  const reasoningRef = useRef<HTMLTextAreaElement>(null);

  const stepIdx = ALL_STEPS.indexOf(step);
  const isCorrect = submitted && myVerdict === caseData.verdict;
  const canSubmit = !!myVerdict && reasoning.trim().length >= MIN_REASONING;

  const totalInRoom = ROOMS.find(r => r.id === room.id)?.lessons.flatMap(l => l.cases).length ?? 0;
  const doneInRoom = progress.completedCases.filter(id =>
    ROOMS.find(r => r.id === room.id)?.lessons.flatMap(l => l.cases).some(c => c.id === id)
  ).length;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
    setStep('result');
    if (!alreadyDone) onComplete(reasoning.trim());
  }

  return (
    <div className="screen">
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
            <div className="case-panel-icon">📋</div>
            <h2 className="case-panel-title">{caseData.title}</h2>
            <div className="scenario-card">
              <div className="scenario-card-label">תיאור המקרה</div>
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
              <div className="investigate-q">• מהו סוג הנזק: פשיעה, גנבה, אבידה או אונס?</div>
              <div className="investigate-q">• מה סוג הקשר לחפץ: שומר, שואל, שוכר?</div>
              <div className="investigate-q">• אילו עקרונות הלכתיים רלוונטיים?</div>
            </div>
            <div className="scenario-card">
              <div className="scenario-card-label">📋 תזכורת — המקרה</div>
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
            <div className="two-btn-row">
              <button className="secondary-btn" onClick={() => setStep('investigate')}>→ חזרה</button>
              <button className={`primary-btn${!canSubmit ? ' btn-disabled' : ''}`} disabled={!canSubmit} onClick={handleSubmit}>הגש פסיקה ←</button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && submitted && myVerdict && (
          <div className="case-panel">
            <div className={`result-banner${isCorrect ? ' banner-correct' : ' banner-wrong'}`}>
              <span className="result-banner-icon">{isCorrect ? '🎉' : '📚'}</span>
              <span>{isCorrect ? 'פסיקה נכונה! אתה דיין מצוין!' : 'הגמרא פוסקת אחרת — אבל למדת!'}</span>
            </div>
            <div className="verdict-comparison">
              <div className="verdict-chip" style={{ backgroundColor: VERDICT_META[myVerdict].color }}>פסיקתך: {VERDICT_META[myVerdict].label}</div>
              {!isCorrect && <div className="verdict-chip" style={{ backgroundColor: VERDICT_META[caseData.verdict].color }}>הדין: {VERDICT_META[caseData.verdict].label}</div>}
            </div>

            {/* Show submitted reasoning */}
            <div className="reasoning-result-box">
              <div className="reasoning-result-label">✍️ הנימוק שלך</div>
              <p className="reasoning-result-text">{reasoning || savedReasoning}</p>
            </div>

            <div className="explanation-box">
              <div className="explanation-header">📖 הסבר הדין</div>
              <p className="explanation-text">{caseData.explanation}</p>
            </div>
            <div className="case-escape-progress after-result">
              {doneInRoom + (alreadyDone ? 0 : 1)}/{totalInRoom} תיקים בחדר · {Math.max(0, totalInRoom - doneInRoom - (alreadyDone ? 0 : 1))} נותרו לצאת
            </div>
            <button className="primary-btn full-btn" onClick={onBack}>סיום תיק ←</button>
          </div>
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
  return (
    <div className="modal-overlay" onClick={onClose}>
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
  const [progress, setProgress] = useState<Progress>({ completedCases: [], completedRooms: [], reasoning: {} });
  const [cert, setCert] = useState<{ roomTitle: string; ach: (typeof ROOM_ACHIEVEMENTS)[number] } | null>(null);
  const [teacherBrowse, setTeacherBrowse] = useState(false);

  useEffect(() => { scorm.init(); return () => { scorm.finish(); }; }, []);

  // Load progress when auth is set
  useEffect(() => {
    if (auth) setProgress(loadProgress(auth.user.id));
  }, [auth?.user.id]);

  function handleLogin(a: AuthState) {
    setAuth(a);
    setProgress(loadProgress(a.user.id));
    if (a.user.role === 'teacher' || a.user.role === 'admin') {
      setTeacherBrowse(false);
      setScreen({ name: 'teacher-dashboard' });
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

  const completeCase = useCallback((caseId: string, roomId: string, roomOrder: number, reasoning: string) => {
    if (!auth) return;
    setProgress(prev => {
      const newCases = prev.completedCases.includes(caseId) ? prev.completedCases : [...prev.completedCases, caseId];
      const newReasoning = { ...prev.reasoning, [caseId]: reasoning };
      const room = ROOMS.find(r => r.id === roomId);
      const allIds = room?.lessons.flatMap(l => l.cases).map(c => c.id) ?? [];
      const roomNowComplete = allIds.length > 0 && allIds.every(id => newCases.includes(id));
      const newRooms = roomNowComplete && !prev.completedRooms.includes(roomId)
        ? [...prev.completedRooms, roomId] : prev.completedRooms;
      const next = { completedCases: newCases, completedRooms: newRooms, reasoning: newReasoning };
      saveProgress(next, auth.user.id);
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

    if (screen.name === 'teacher-dashboard') return (
      <TeacherDashboard auth={auth}
        onBrowse={() => { setTeacherBrowse(true); setScreen({ name: 'home' }); }}
        onLogout={handleLogout} />
    );

    const tMode = teacherBrowse && isTeacher;

    if (screen.name === 'home') return (
      <HomeScreen progress={progress} teacherMode={tMode} auth={auth}
        onSelectRoom={r => setScreen({ name: 'room', room: r })}
        onShowIntro={() => setScreen({ name: 'intro' })}
        onDashboard={isTeacher ? () => setScreen({ name: 'teacher-dashboard' }) : undefined}
        onLogout={handleLogout} />
    );
    if (screen.name === 'room') return (
      <RoomScreen room={screen.room} progress={progress} teacherMode={tMode}
        onBack={() => setScreen({ name: 'home' })}
        onSelectLesson={l => setScreen({ name: 'lesson', room: screen.room, lesson: l })} />
    );
    if (screen.name === 'lesson') return (
      <LessonScreen room={screen.room} lesson={screen.lesson} progress={progress} teacherMode={tMode}
        onBack={() => setScreen({ name: 'room', room: screen.room })}
        onSelectCase={(c, idx) => setScreen({ name: 'case', room: screen.room, lesson: screen.lesson, caseData: c, caseIndex: idx })} />
    );
    if (screen.name === 'case') return (
      <CaseScreen room={screen.room} lesson={screen.lesson} caseData={screen.caseData}
        caseIndex={screen.caseIndex} progress={progress} teacherMode={tMode}
        onComplete={(r) => completeCase(screen.caseData.id, screen.room.id, screen.room.order, r)}
        onBack={() => setScreen({ name: 'lesson', room: screen.room, lesson: screen.lesson })} />
    );
    return null;
  };

  return (
    <div className="app-root" dir="rtl">
      {render()}
      {cert && auth && (
        <CertificateModal roomTitle={cert.roomTitle} achievement={cert.ach}
          userName={auth.user.name} onClose={() => setCert(null)} />
      )}
    </div>
  );
}
