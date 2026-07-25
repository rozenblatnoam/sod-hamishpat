import { useState, useCallback } from 'react';
import { CourtroomScene } from './CourtroomScene';
import { JudgeCharacter } from './components/JudgeCharacter';
import { apiGetVideoUrl } from './api';
import type { RoomData, CaseData, Verdict } from './content/types';

interface Progress {
  completedCases: string[];
  reasoning: Record<string, string>;
}

interface Props {
  room: RoomData;
  progress: Progress;
  token: string;
  onClose: () => void;
  onCaseComplete: (caseId: string, reasoning: string, hintUsed: boolean) => void;
}

const VERDICT_META: Record<Verdict, { label: string; icon: string; color: string }> = {
  liable:           { label: 'חייב',       icon: '❌', color: '#c0392b' },
  exempt:           { label: 'פטור',        icon: '✅', color: '#27ae60' },
  partially_liable: { label: 'חייב חלקית', icon: '⚖️', color: '#e67e22' },
};

type Phase    = 'scene' | 'cases' | 'case';
type CaseStep = 'entry' | 'scenario' | 'verdict' | 'result';

const CASE_PHASES: { key: CaseStep; icon: string; label: string }[] = [
  { key: 'entry',    icon: '🚪', label: 'כניסה' },
  { key: 'scenario', icon: '🔦', label: 'ראיות' },
  { key: 'verdict',  icon: '🧩', label: 'פסיקה' },
  { key: 'result',   icon: '🗝️', label: 'גילוי' },
];

const MIN_REASONING = 15;

export function CourtroomGame({ room, progress, token, onClose, onCaseComplete }: Props) {
  const isMobile = typeof window !== 'undefined' &&
    (window.innerWidth <= 768 || 'ontouchstart' in window);

  const [phase, setPhase]                     = useState<Phase>('scene');
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [activeCaseIdx, setActiveCaseIdx]     = useState(0);
  const [step, setStep]                       = useState<CaseStep>('entry');
  const [myVerdict, setMyVerdict]             = useState<Verdict | null>(null);
  const [reasoning, setReasoning]             = useState('');
  const [submitted, setSubmitted]             = useState(false);
  const [judgeReaction, setJudgeReaction]     = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [activeVideoId, setActiveVideoId]     = useState<string | null>(null);
  const [videoUrl, setVideoUrl]               = useState<string | null>(null);
  const [videoLoading, setVideoLoading]       = useState(false);

  const totalCases = room.lessons.reduce((n, l) => n + l.cases.length, 0);
  const doneCount  = progress.completedCases.filter(id =>
    room.lessons.some(l => l.cases.some(c => c.id === id))
  ).length;

  const toggleVideo = useCallback(async (lessonId: string, path: string | null | undefined) => {
    if (!path) return;
    if (activeVideoId === lessonId) { setActiveVideoId(null); setVideoUrl(null); return; }
    setActiveVideoId(lessonId);
    setVideoLoading(true);
    try {
      const filename = path.split('/').pop()!;
      const url = await apiGetVideoUrl(token, filename);
      setVideoUrl(url);
    } catch { setVideoUrl(path); }
    finally   { setVideoLoading(false); }
  }, [token, activeVideoId]);

  const activeLesson = room.lessons[activeLessonIdx];
  const activeCase   = activeLesson?.cases[activeCaseIdx] as CaseData | undefined;
  const alreadyDone  = activeCase ? progress.completedCases.includes(activeCase.id) : false;
  const stepIdx      = CASE_PHASES.findIndex(p => p.key === step);

  function openCase(lIdx: number, cIdx: number) {
    const c = room.lessons[lIdx]?.cases[cIdx];
    if (!c) return;
    setActiveLessonIdx(lIdx);
    setActiveCaseIdx(cIdx);
    const done = progress.completedCases.includes(c.id);
    setStep(done ? 'result' : 'entry');
    setMyVerdict(done ? c.verdict : null);
    setReasoning(progress.reasoning[c.id] ?? '');
    setSubmitted(done);
    setPhase('case');
  }

  function handleSubmit() {
    if (!myVerdict || reasoning.trim().length < MIN_REASONING || !activeCase) return;
    const correct = myVerdict === activeCase.verdict;
    setSubmitted(true);
    setStep('result');
    setJudgeReaction(correct ? 'correct' : 'wrong');
    if (!alreadyDone) onCaseComplete(activeCase.id, reasoning.trim(), false);
  }

  function handleRetry() {
    setMyVerdict(null);
    setReasoning('');
    setSubmitted(false);
    setStep('entry');
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <style>{`
        /* ── Animations ─────────────────────────────────── */
        @keyframes panelIn  { from { opacity:0; transform:translateY(20px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes entryIn  { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }
        @keyframes lockAppear { from { transform:scale(.4) rotate(-20deg); opacity:0; } to { transform:scale(1) rotate(0); opacity:1; } }
        @keyframes keyReveal  {
          0%   { transform:scale(.4) rotate(-30deg); opacity:0; }
          60%  { transform:scale(1.3) rotate(12deg); }
          100% { transform:scale(1) rotate(0); opacity:1; }
        }
        @keyframes lockShake  {
          0%,100% { transform:rotate(0); }
          15% { transform:rotate(-15deg); }
          30% { transform:rotate(15deg); }
          50% { transform:rotate(-9deg); }
          70% { transform:rotate(9deg); }
        }
        @keyframes doorOpen {
          from { transform: perspective(600px) rotateY(0deg); }
          to   { transform: perspective(600px) rotateY(-40deg); opacity:.6; }
        }

        /* ── Phase progress bar ─────────────────────────── */
        .ct-phasebar {
          display:flex; align-items:flex-start; justify-content:center;
          gap:0; margin-bottom:22px; direction:ltr;
        }
        .ct-phasestep { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .ct-phasedot  {
          width:34px; height:34px; border-radius:50%; font-size:.95rem;
          display:flex; align-items:center; justify-content:center;
          border:2px solid rgba(200,160,60,.18);
          background:rgba(255,255,255,.03);
          transition:all .35s;
        }
        .ct-phasestep.done .ct-phasedot  { border-color:#4caf50; background:rgba(76,175,80,.15); font-size:.85rem; }
        .ct-phasestep.active .ct-phasedot { border-color:#e4b84a; background:rgba(228,184,74,.18); box-shadow:0 0 14px rgba(228,184,74,.35); }
        .ct-phaselabel { font-size:.62rem; letter-spacing:.4px; color:rgba(240,232,208,.28); font-family:Heebo,sans-serif; }
        .ct-phasestep.done .ct-phaselabel  { color:#4caf50; }
        .ct-phasestep.active .ct-phaselabel { color:#e4b84a; }
        .ct-phaseline {
          width:26px; height:1.5px; align-self:center; margin-bottom:18px;
          background:rgba(200,160,60,.15); transition:background .3s; flex-shrink:0;
        }
        .ct-phaseline.done { background:rgba(76,175,80,.35); }

        /* ── Entry card ─────────────────────────────────── */
        .ct-entry-overlay {
          position:fixed; inset:0; z-index:20;
          display:flex; align-items:center; justify-content:center;
          background:rgba(4,3,6,.6); backdrop-filter:blur(2px);
        }
        .ct-entry-card {
          width:90%; max-width:420px;
          background:linear-gradient(160deg,#1e1508 0%,#110d07 100%);
          border:1px solid rgba(200,160,60,.45); border-radius:22px;
          padding:44px 32px 36px; direction:rtl; font-family:Heebo,sans-serif; color:#f0e8d0;
          box-shadow:0 32px 90px rgba(0,0,0,.85); text-align:center;
          animation:entryIn .45s cubic-bezier(.16,1,.3,1);
        }
        .ct-entry-emblem { font-size:3.4rem; margin-bottom:18px; line-height:1; }
        .ct-entry-title  { font-size:1.75rem; font-weight:900; color:#e4b84a; margin:0 0 10px; line-height:1.2; }
        .ct-entry-rule   { width:56px; height:2px; margin:0 auto 12px;
                           background:linear-gradient(90deg,transparent,#e4b84a55,#e4b84a,#e4b84a55,transparent); }
        .ct-entry-meta   { font-size:.85rem; color:rgba(240,232,208,.45); margin:0 0 10px; }
        .ct-entry-progress { font-size:.82rem; color:rgba(200,160,60,.7); margin:0 0 28px; }
        .ct-entry-btn    { width:100%; padding:15px; font-size:1.05rem; border-radius:13px; margin-bottom:10px; display:block; }
        .ct-entry-back   { width:100%; padding:10px; font-size:.88rem; display:block; }
        @media (max-width:768px) {
          .ct-entry-overlay { background:rgba(6,4,2,.92); backdrop-filter:none; }
          .ct-entry-card { max-width:100%; border-radius:0; padding:56px 24px 40px;
                           min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; }
          .ct-entry-title { font-size:2rem; }
          .ct-entry-btn   { padding:18px; font-size:1.15rem; }
        }

        /* ── Panel / Card ───────────────────────────────── */
        .ct-panel {
          position:fixed; inset:0; z-index:20;
          display:flex; align-items:center; justify-content:center;
          background:rgba(4,3,6,.85); backdrop-filter:blur(3px);
        }
        .ct-card {
          width:90%; max-width:560px; max-height:85vh; overflow-y:auto;
          background:linear-gradient(160deg,#1a1208 0%,#12100e 100%);
          border:1px solid rgba(200,160,60,.35); border-radius:16px;
          padding:24px 28px; direction:rtl; font-family:Heebo,sans-serif; color:#f0e8d0;
          box-shadow:0 24px 64px rgba(0,0,0,.7); animation:panelIn .3s ease; box-sizing:border-box;
        }
        @media (max-width:768px) {
          .ct-panel { align-items:flex-end; background:rgba(4,3,6,.96); }
          .ct-card  { width:100%; max-width:100%; max-height:94vh;
                      border-radius:18px 18px 0 0; padding:20px 16px 28px; }
          .ct-btn,.ct-btn-ghost,.ct-verdict-btn { min-height:48px; font-size:1rem; }
          .ct-textarea { font-size:1rem; }
        }

        /* ── Shared buttons ─────────────────────────────── */
        .ct-btn {
          background:linear-gradient(135deg,#b8921a,#e4b84a);
          color:#1a0f00; border:none; border-radius:10px;
          padding:10px 22px; font-size:.95rem; font-weight:800;
          cursor:pointer; font-family:Heebo,sans-serif;
          transition:transform .15s, box-shadow .15s;
        }
        .ct-btn:hover    { transform:translateY(-1px); box-shadow:0 4px 14px rgba(184,146,26,.4); }
        .ct-btn:disabled { opacity:.4; cursor:default; transform:none; }
        .ct-btn-ghost {
          background:transparent; color:rgba(240,232,208,.6);
          border:1px solid rgba(200,160,60,.25); border-radius:10px;
          padding:8px 18px; font-size:.85rem; font-weight:600;
          cursor:pointer; font-family:Heebo,sans-serif;
        }
        .ct-btn-ghost:hover { border-color:rgba(200,160,60,.5); color:#f0e8d0; }
        .ct-verdict-btn {
          display:flex; align-items:center; gap:10px;
          border:2px solid transparent; border-radius:10px;
          padding:12px 16px; cursor:pointer; font-family:Heebo,sans-serif;
          font-weight:700; font-size:.95rem; transition:all .15s;
          background:rgba(255,255,255,.04); color:#f0e8d0; width:100%;
        }
        .ct-verdict-btn:hover    { background:rgba(255,255,255,.08); }
        .ct-verdict-btn.selected { background:rgba(255,255,255,.1); }
        .ct-textarea {
          width:100%; box-sizing:border-box;
          background:rgba(255,255,255,.05); border:1px solid rgba(200,160,60,.3);
          border-radius:8px; color:#f0e8d0; font-family:Heebo,sans-serif;
          font-size:.9rem; padding:10px 12px; resize:vertical; min-height:80px; direction:rtl;
        }
        .ct-textarea:focus { outline:none; border-color:rgba(200,160,60,.6); }
        .ct-label { font-size:.72rem; color:rgba(240,232,208,.5); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
        .ct-case-row {
          display:flex; align-items:center; gap:10px; padding:10px 12px;
          border-radius:10px; cursor:pointer; transition:background .15s;
          border:1px solid rgba(200,160,60,.1);
        }
        .ct-case-row:hover { background:rgba(200,160,60,.08); border-color:rgba(200,160,60,.3); }
        .ct-case-done { color:#4caf50; font-size:.8rem; margin-right:auto; }

        /* ── Evidence file ──────────────────────────────── */
        .ct-evidence-file {
          background:rgba(255,248,210,.04);
          border:1px solid rgba(200,160,60,.2);
          border-right:3px solid #e4b84a;
          border-radius:0 10px 10px 0;
          padding:16px;
          margin-bottom:14px;
          line-height:1.8; font-size:.93rem; color:#ede0c4;
        }
        .ct-evidence-collected {
          display:flex; align-items:center; gap:8px;
          padding:8px 12px; border-radius:8px; margin-bottom:20px;
          background:rgba(39,174,96,.07); border:1px solid rgba(39,174,96,.2);
          font-size:.82rem; color:rgba(76,175,80,.9);
        }
      `}</style>

      {/* ── Background ───────────────────────────────────── */}
      {isMobile ? (
        <div style={{
          width:'100%', height:'100vh',
          background:'radial-gradient(ellipse at 50% 20%,#2a1906 0%,#110c06 55%,#060403 100%)',
        }} />
      ) : (
        <CourtroomScene roomName={room.titleHe} onClose={onClose} onEnterCase={() => setPhase('cases')} />
      )}

      {/* ── Judge reaction ───────────────────────────────── */}
      <JudgeCharacter reaction={judgeReaction} onDone={() => setJudgeReaction('idle')} />

      {/* ══ Entry Screen ════════════════════════════════════ */}
      {phase === 'scene' && (
        <div className="ct-entry-overlay">
          <div className="ct-entry-card">
            <div className="ct-entry-emblem">⚖️</div>
            <h1 className="ct-entry-title">{room.titleHe}</h1>
            <div className="ct-entry-rule" />
            <p className="ct-entry-meta">{room.lessons.length} שיעורים · {totalCases} תיקים</p>
            {doneCount > 0 && (
              <p className="ct-entry-progress">✅ {doneCount} מתוך {totalCases} הושלמו</p>
            )}
            <button className="ct-btn ct-entry-btn" onClick={() => setPhase('cases')}>
              הכנס לאולם המשפט ←
            </button>
            <button className="ct-btn-ghost ct-entry-back" onClick={onClose}>← חזרה</button>
          </div>
        </div>
      )}

      {/* ══ Case List Panel ══════════════════════════════════ */}
      {phase === 'cases' && (
        <div className="ct-panel" onClick={e => e.target === e.currentTarget && setPhase('scene')}>
          <div className="ct-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:'1.2rem', color:'#e4b84a' }}>⚖️ {room.titleHe}</h2>
              <button className="ct-btn-ghost" onClick={() => setPhase('scene')}>✕ סגור</button>
            </div>

            {room.lessons.map((lesson, lIdx) => (
              <div key={lesson.id} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ fontSize:'.8rem', color:'#e4b84a', fontWeight:700, letterSpacing:.5, flex:1 }}>
                    שיעור {lesson.order}: {lesson.title}
                  </div>
                  {lesson.videoUrl && (
                    <button
                      className="ct-btn-ghost"
                      style={{ fontSize:'.75rem', padding:'4px 10px', whiteSpace:'nowrap' }}
                      onClick={() => toggleVideo(lesson.id, lesson.videoUrl)}
                      disabled={videoLoading && activeVideoId !== lesson.id}
                    >
                      {videoLoading && activeVideoId === lesson.id ? '⏳'
                        : activeVideoId === lesson.id ? '✕ סגור סרטון' : '▶ סרטון'}
                    </button>
                  )}
                </div>

                {activeVideoId === lesson.id && videoUrl && (
                  <video key={videoUrl} src={videoUrl} controls autoPlay
                    style={{ width:'100%', borderRadius:8, marginBottom:10, border:'1px solid rgba(200,160,60,.3)' }} />
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {lesson.cases.map((c, cIdx) => {
                    const done = progress.completedCases.includes(c.id);
                    return (
                      <div key={c.id} className="ct-case-row" onClick={() => openCase(lIdx, cIdx)}>
                        <span style={{ fontSize:'1rem' }}>{done ? '✅' : '📄'}</span>
                        <span style={{ flex:1, fontSize:'.92rem', fontWeight:600 }}>{c.title}</span>
                        {done && <span className="ct-case-done">הושלם</span>}
                        <span style={{ color:'rgba(240,232,208,.4)', fontSize:'.8rem' }}>←</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Case Panel ═══════════════════════════════════════ */}
      {phase === 'case' && activeCase && (
        <div className="ct-panel" onClick={e => e.target === e.currentTarget && setPhase('cases')}>
          <div className="ct-card">

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <button className="ct-btn-ghost" onClick={() => setPhase('cases')}>← תיקים</button>
              <span style={{ fontSize:'.78rem', color:'rgba(240,232,208,.4)' }}>{activeLesson.title}</span>
            </div>

            {/* Phase progress bar */}
            <div className="ct-phasebar">
              {CASE_PHASES.map((p, i) => (
                <div key={p.key} style={{ display:'flex', alignItems:'flex-start' }}>
                  <div className={`ct-phasestep${i < stepIdx ? ' done' : i === stepIdx ? ' active' : ''}`}>
                    <div className="ct-phasedot">{i < stepIdx ? '✓' : p.icon}</div>
                    <div className="ct-phaselabel">{p.label}</div>
                  </div>
                  {i < CASE_PHASES.length - 1 && (
                    <div className={`ct-phaseline${i < stepIdx ? ' done' : ''}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Phase 1: Entry ── */}
            {step === 'entry' && (
              <div style={{ textAlign:'center', padding:'4px 0 8px' }}>
                <div style={{ fontSize:'3.4rem', marginBottom:14, animation:'lockAppear .5s ease', lineHeight:1 }}>
                  🔒
                </div>
                <p style={{ fontSize:'.72rem', color:'rgba(240,232,208,.35)', textTransform:'uppercase', letterSpacing:2, margin:'0 0 8px' }}>
                  תיק חדש
                </p>
                <h3 style={{ margin:'0 0 14px', fontSize:'1.2rem', color:'#e4b84a', lineHeight:1.35 }}>
                  {activeCase.title}
                </h3>
                <div style={{
                  display:'inline-block', padding:'4px 14px', borderRadius:20, marginBottom:20,
                  background:'rgba(192,57,43,.14)', border:'1px solid rgba(192,57,43,.3)',
                  color:'#e74c3c', fontSize:'.77rem', fontWeight:700,
                }}>
                  🔒 הדלת ננעלת
                </div>
                <p style={{ fontSize:'.88rem', color:'rgba(240,232,208,.52)', lineHeight:1.65, margin:'0 0 26px' }}>
                  קראו את הפרטים, אספו ראיות ופסקו בצדק<br/>
                  כדי לפתוח את הדלת ולחשוף את סוד המשפט
                </p>
                <button
                  className="ct-btn"
                  style={{ padding:'13px 28px', fontSize:'1rem', borderRadius:12, width:'100%' }}
                  onClick={() => setStep('scenario')}
                >
                  פתח את התיק ←
                </button>
              </div>
            )}

            {/* ── Phase 2: Evidence ── */}
            {step === 'scenario' && (
              <>
                <div className="ct-label">📋 מסמכי התיק</div>
                <div className="ct-evidence-file">
                  {activeCase.scenario}
                </div>
                <div className="ct-evidence-collected">
                  <span>✅</span>
                  <span>ראיות נאספו — מוכן לפסיקה</span>
                </div>
                <div style={{ textAlign:'left' }}>
                  <button className="ct-btn" onClick={() => setStep('verdict')}>
                    הגיע הזמן לפסוק ←
                  </button>
                </div>
              </>
            )}

            {/* ── Phase 3: Verdict ── */}
            {step === 'verdict' && !submitted && (
              <>
                <div className="ct-label" style={{ marginBottom:10 }}>🧩 מה קרה באמת?</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                  {(['liable','exempt','partially_liable'] as Verdict[]).map(v => {
                    const m = VERDICT_META[v];
                    return (
                      <button
                        key={v}
                        className={`ct-verdict-btn${myVerdict === v ? ' selected' : ''}`}
                        style={{ borderColor: myVerdict === v ? m.color : 'transparent' }}
                        onClick={() => setMyVerdict(v)}
                      >
                        <span>{m.icon}</span><span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="ct-label">נמק את פסיקתך</div>
                <textarea
                  className="ct-textarea"
                  value={reasoning}
                  onChange={e => setReasoning(e.target.value)}
                  placeholder="כתוב כאן את הנימוק שלך..."
                  rows={3}
                />
                {reasoning.trim().length > 0 && reasoning.trim().length < MIN_REASONING && (
                  <div style={{ fontSize:'.78rem', color:'#e67e22', margin:'4px 0 0' }}>
                    ⚠️ יש לכתוב לפחות {MIN_REASONING} תווים
                  </div>
                )}

                <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
                  <button className="ct-btn-ghost" onClick={() => setStep('scenario')}>← ראיות</button>
                  <button
                    className="ct-btn"
                    disabled={!myVerdict || reasoning.trim().length < MIN_REASONING}
                    onClick={handleSubmit}
                  >
                    פסוק! ⚖️
                  </button>
                </div>
              </>
            )}

            {/* ── Phase 4: Reveal ── */}
            {step === 'result' && myVerdict && (() => {
              const correct = myVerdict === activeCase.verdict;
              return (
                <>
                  <div style={{ textAlign:'center', marginBottom:16 }}>
                    <div style={{
                      fontSize:'3.2rem', lineHeight:1, marginBottom:10,
                      animation: correct ? 'keyReveal .65s cubic-bezier(.16,1,.3,1)' : 'lockShake .55s ease',
                    }}>
                      {correct ? '🗝️' : '🔒'}
                    </div>
                    <div style={{
                      display:'inline-block', padding:'6px 18px', borderRadius:20,
                      background: correct ? 'rgba(39,174,96,.15)' : 'rgba(192,57,43,.15)',
                      border: `1px solid ${correct ? '#27ae6044' : '#c0392b44'}`,
                      color: correct ? '#4caf50' : '#e74c3c',
                      fontWeight:800, fontSize:'.95rem',
                    }}>
                      {correct ? '🎉 פסיקה נכונה! הדלת נפתחת!' : '📚 הגמרא פוסקת אחרת — אבל למדת!'}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                    {[{ label:'פסיקתך', v:myVerdict }, { label:'הדין', v:activeCase.verdict }].map(({ label, v }) => (
                      <div key={label} style={{
                        flex:1, background:'rgba(255,255,255,.05)', borderRadius:8,
                        padding:'8px 12px', fontSize:'.85rem', textAlign:'center',
                      }}>
                        <div style={{ color:'rgba(240,232,208,.45)', fontSize:'.7rem', marginBottom:4 }}>{label}</div>
                        <span style={{ color:VERDICT_META[v].color, fontWeight:800 }}>
                          {VERDICT_META[v].icon} {VERDICT_META[v].label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="ct-label">הסבר הדין</div>
                  <p style={{ lineHeight:1.75, margin:'0 0 20px', fontSize:'.9rem', color:'#ede0c4' }}>
                    {activeCase.explanation}
                  </p>

                  <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                    {!correct && (
                      <button className="ct-btn-ghost" onClick={handleRetry}>נסה שוב 🔄</button>
                    )}
                    <button className="ct-btn" onClick={() => setPhase('cases')}>
                      {correct ? 'לתיק הבא ←' : 'המשך ←'}
                    </button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}
