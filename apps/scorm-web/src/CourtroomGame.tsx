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
  liable:           { label: 'חייב',          icon: '❌', color: '#c0392b' },
  exempt:           { label: 'פטור',           icon: '✅', color: '#27ae60' },
  partially_liable: { label: 'חייב חלקית',    icon: '⚖️', color: '#e67e22' },
};

type Phase = 'scene' | 'cases' | 'case';
type CaseStep = 'scenario' | 'verdict' | 'result';

const MIN_REASONING = 15;


export function CourtroomGame({ room, progress, token, onClose, onCaseComplete }: Props) {
  const isMobile = typeof window !== 'undefined' &&
    (window.innerWidth <= 768 || 'ontouchstart' in window);
  const [phase, setPhase] = useState<Phase>(isMobile ? 'cases' : 'scene');
  const backToScene = () => isMobile ? onClose() : setPhase('scene');
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [activeCaseIdx, setActiveCaseIdx]     = useState(0);
  const [step, setStep]             = useState<CaseStep>('scenario');
  const [myVerdict, setMyVerdict]   = useState<Verdict | null>(null);
  const [reasoning, setReasoning]   = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [judgeReaction, setJudgeReaction] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const toggleVideo = useCallback(async (lessonId: string, lessonVideoPath: string | null | undefined) => {
    if (!lessonVideoPath) return;
    if (activeVideoId === lessonId) { setActiveVideoId(null); setVideoUrl(null); return; }
    setActiveVideoId(lessonId);
    setVideoLoading(true);
    try {
      const filename = lessonVideoPath.split('/').pop()!;
      const url = await apiGetVideoUrl(token, filename);
      setVideoUrl(url);
    } catch { setVideoUrl(lessonVideoPath); }
    finally { setVideoLoading(false); }
  }, [token, activeVideoId]);

  const activeLesson = room.lessons[activeLessonIdx];
  const activeCase   = activeLesson?.cases[activeCaseIdx] as CaseData | undefined;
  const alreadyDone  = activeCase ? progress.completedCases.includes(activeCase.id) : false;

  function openCase(lIdx: number, cIdx: number) {
    const c = room.lessons[lIdx]?.cases[cIdx];
    if (!c) return;
    setActiveLessonIdx(lIdx);
    setActiveCaseIdx(cIdx);
    const done = progress.completedCases.includes(c.id);
    setStep(done ? 'result' : 'scenario');
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
    setStep('scenario');
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ct-panel {
          position: fixed; inset: 0; z-index: 20;
          display: flex; align-items: center; justify-content: center;
          background: rgba(4,3,6,0.85); backdrop-filter: blur(3px);
        }
        .ct-card {
          width: 90%; max-width: 560px; max-height: 85vh;
          overflow-y: auto;
          background: linear-gradient(160deg,#1a1208 0%,#12100e 100%);
          border: 1px solid rgba(200,160,60,0.35);
          border-radius: 16px;
          padding: 28px 28px 24px;
          direction: rtl;
          font-family: Heebo, sans-serif;
          color: #f0e8d0;
          box-shadow: 0 24px 64px rgba(0,0,0,0.7);
          animation: panelIn 0.3s ease;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .ct-panel { align-items: flex-end; background: rgba(4,3,6,0.96); }
          .ct-card {
            width: 100%; max-width: 100%; max-height: 94vh;
            border-radius: 18px 18px 0 0;
            padding: 20px 16px 28px;
          }
          .ct-btn, .ct-btn-ghost, .ct-verdict-btn { min-height: 48px; font-size: 1rem; }
          .ct-textarea { font-size: 1rem; }
        }
        .ct-btn {
          background: linear-gradient(135deg,#b8921a,#e4b84a);
          color: #1a0f00; border: none; border-radius: 10px;
          padding: 10px 22px; font-size: 0.95rem; font-weight: 800;
          cursor: pointer; font-family: Heebo,sans-serif;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ct-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(184,146,26,0.4); }
        .ct-btn:disabled { opacity: 0.4; cursor: default; transform: none; }
        .ct-btn-ghost {
          background: transparent; color: rgba(240,232,208,0.6);
          border: 1px solid rgba(200,160,60,0.25); border-radius: 10px;
          padding: 8px 18px; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; font-family: Heebo,sans-serif;
        }
        .ct-btn-ghost:hover { border-color: rgba(200,160,60,0.5); color: #f0e8d0; }
        .ct-verdict-btn {
          display: flex; align-items: center; gap: 10px;
          border: 2px solid transparent; border-radius: 10px;
          padding: 12px 16px; cursor: pointer; font-family: Heebo,sans-serif;
          font-weight: 700; font-size: 0.95rem; transition: all 0.15s;
          background: rgba(255,255,255,0.04); color: #f0e8d0; width: 100%;
        }
        .ct-verdict-btn:hover { background: rgba(255,255,255,0.08); }
        .ct-verdict-btn.selected { background: rgba(255,255,255,0.1); }
        .ct-textarea {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(200,160,60,0.3);
          border-radius: 8px; color: #f0e8d0; font-family: Heebo,sans-serif;
          font-size: 0.9rem; padding: 10px 12px; resize: vertical; min-height: 80px;
          direction: rtl;
        }
        .ct-textarea:focus { outline: none; border-color: rgba(200,160,60,0.6); }
        .ct-label { font-size: 0.75rem; color: rgba(240,232,208,0.55); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .ct-case-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 10px; cursor: pointer; transition: background 0.15s;
          border: 1px solid rgba(200,160,60,0.1);
        }
        .ct-case-row:hover { background: rgba(200,160,60,0.08); border-color: rgba(200,160,60,0.3); }
        .ct-case-done { color: #4caf50; font-size: 0.8rem; margin-right: auto; }
      `}</style>

      {/* 3D Scene — desktop only (touch devices skip to cases) */}
      {isMobile ? (
        <div style={{ width: '100%', height: '100vh', background: 'linear-gradient(160deg,#0e0b06 0%,#1a1208 100%)' }} />
      ) : (
        <CourtroomScene
          roomName={room.titleHe}
          onClose={onClose}
          onEnterCase={() => setPhase('cases')}
        />
      )}

      {/* Judge reaction overlay */}
      <JudgeCharacter reaction={judgeReaction} onDone={() => setJudgeReaction('idle')} />

      {/* ── Case List Panel ─────────────────────────────────── */}
      {phase === 'cases' && (
        <div className="ct-panel" onClick={e => e.target === e.currentTarget && backToScene()}>
          <div className="ct-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#e4b84a' }}>⚖️ {room.titleHe}</h2>
              <button className="ct-btn-ghost" onClick={backToScene}>✕ סגור</button>
            </div>

            {room.lessons.map((lesson, lIdx) => (
              <div key={lesson.id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: '#e4b84a', fontWeight: 700, letterSpacing: 0.5, flex: 1 }}>
                    שיעור {lesson.order}: {lesson.title}
                  </div>
                  {lesson.videoUrl && (
                    <button
                      className="ct-btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                      onClick={() => toggleVideo(lesson.id, lesson.videoUrl)}
                      disabled={videoLoading && activeVideoId !== lesson.id}
                    >
                      {videoLoading && activeVideoId === lesson.id ? '⏳' : activeVideoId === lesson.id ? '✕ סגור סרטון' : '▶ סרטון'}
                    </button>
                  )}
                </div>

                {activeVideoId === lesson.id && videoUrl && (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    style={{
                      width: '100%', borderRadius: 8, marginBottom: 10,
                      border: '1px solid rgba(200,160,60,0.3)',
                    }}
                  />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lesson.cases.map((c, cIdx) => {
                    const done = progress.completedCases.includes(c.id);
                    return (
                      <div key={c.id} className="ct-case-row" onClick={() => openCase(lIdx, cIdx)}>
                        <span style={{ fontSize: '1rem' }}>{done ? '✅' : '📄'}</span>
                        <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 600 }}>{c.title}</span>
                        {done && <span className="ct-case-done">הושלם</span>}
                        <span style={{ color: 'rgba(240,232,208,0.4)', fontSize: '0.8rem' }}>←</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Case Panel ──────────────────────────────────────── */}
      {phase === 'case' && activeCase && (
        <div className="ct-panel" onClick={e => e.target === e.currentTarget && setPhase('cases')}>
          <div className="ct-card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button className="ct-btn-ghost" onClick={() => setPhase('cases')}>← חזרה לתיקים</button>
              <span style={{ fontSize: '0.8rem', color: 'rgba(240,232,208,0.5)' }}>
                {activeLesson.title}
              </span>
            </div>

            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#e4b84a' }}>
              📁 {activeCase.title}
            </h3>

            {/* ── Scenario ── */}
            {step === 'scenario' && (
              <>
                <div className="ct-label">תיאור המקרה</div>
                <p style={{ lineHeight: 1.7, margin: '0 0 24px', fontSize: '0.93rem', color: '#ede0c4' }}>
                  {activeCase.scenario}
                </p>
                <div style={{ textAlign: 'left' }}>
                  <button className="ct-btn" onClick={() => setStep('verdict')}>
                    הגיע הזמן לפסוק ←
                  </button>
                </div>
              </>
            )}

            {/* ── Verdict ── */}
            {step === 'verdict' && !submitted && (
              <>
                <div className="ct-label" style={{ marginBottom: 10 }}>מה פסיקתך?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {(['liable', 'exempt', 'partially_liable'] as Verdict[]).map(v => {
                    const m = VERDICT_META[v];
                    return (
                      <button
                        key={v}
                        className={`ct-verdict-btn${myVerdict === v ? ' selected' : ''}`}
                        style={{ borderColor: myVerdict === v ? m.color : 'transparent' }}
                        onClick={() => setMyVerdict(v)}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
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
                  <div style={{ fontSize: '0.78rem', color: '#e67e22', margin: '4px 0 0' }}>
                    ⚠️ יש לכתוב לפחות {MIN_REASONING} תווים
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                  <button className="ct-btn-ghost" onClick={() => setStep('scenario')}>← חזרה</button>
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

            {/* ── Result ── */}
            {step === 'result' && myVerdict && (
              <>
                <div style={{
                  background: myVerdict === activeCase.verdict
                    ? 'rgba(39,174,96,0.15)' : 'rgba(192,57,43,0.15)',
                  border: `1px solid ${myVerdict === activeCase.verdict ? '#27ae60' : '#c0392b'}44`,
                  borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                  fontSize: '0.95rem', fontWeight: 700,
                  color: myVerdict === activeCase.verdict ? '#4caf50' : '#e74c3c',
                }}>
                  {myVerdict === activeCase.verdict
                    ? '🎉 פסיקה נכונה! אתה דיין מצוין!'
                    : '📚 הגמרא פוסקת אחרת — אבל למדת!'}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                    padding: '8px 12px', fontSize: '0.85rem', textAlign: 'center',
                  }}>
                    <div style={{ color: 'rgba(240,232,208,0.5)', fontSize: '0.7rem', marginBottom: 4 }}>פסיקתך</div>
                    <span style={{ color: VERDICT_META[myVerdict].color, fontWeight: 800 }}>
                      {VERDICT_META[myVerdict].icon} {VERDICT_META[myVerdict].label}
                    </span>
                  </div>
                  <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                    padding: '8px 12px', fontSize: '0.85rem', textAlign: 'center',
                  }}>
                    <div style={{ color: 'rgba(240,232,208,0.5)', fontSize: '0.7rem', marginBottom: 4 }}>הדין</div>
                    <span style={{ color: VERDICT_META[activeCase.verdict].color, fontWeight: 800 }}>
                      {VERDICT_META[activeCase.verdict].icon} {VERDICT_META[activeCase.verdict].label}
                    </span>
                  </div>
                </div>

                <div className="ct-label">הסבר הדין</div>
                <p style={{ lineHeight: 1.7, margin: '0 0 20px', fontSize: '0.9rem', color: '#ede0c4' }}>
                  {activeCase.explanation}
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  {myVerdict !== activeCase.verdict && (
                    <button className="ct-btn-ghost" onClick={handleRetry}>נסה שוב</button>
                  )}
                  <button className="ct-btn" onClick={() => setPhase('cases')}>
                    לתיק הבא ←
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
