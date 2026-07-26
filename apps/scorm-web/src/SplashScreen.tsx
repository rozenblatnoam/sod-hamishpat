import { useState, useEffect } from 'react';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 1000);
    return () => clearTimeout(t);
  }, []);

  function start() {
    if (phase === 'exit') return;
    setPhase('exit');
    setTimeout(onDone, 550);
  }

  return (
    <div
      className={`sp-root${phase === 'exit' ? ' sp-exit' : ''}`}
      onClick={start}
    >
      <style>{`
        * { box-sizing: border-box; }

        /* ── Root ───────────────────────────────── */
        .sp-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 50% 80%, #1e1006 0%, #080509 55%, #030206 100%);
          overflow: hidden; cursor: pointer; direction: rtl;
          font-family: Heebo, sans-serif;
          transition: opacity 0.55s ease;
        }
        .sp-exit { opacity: 0; pointer-events: none; }

        /* ── Background glow ────────────────────── */
        .sp-glow {
          position: absolute; bottom: -80px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(184,146,26,0.18) 0%, transparent 70%);
          pointer-events: none;
          animation: spGlowPulse 3s ease-in-out infinite;
        }

        /* ── Stars ──────────────────────────────── */
        .sp-stars {
          position: absolute; inset: 0; pointer-events: none;
          overflow: hidden;
        }
        .sp-star {
          position: absolute; border-radius: 50%;
          background: rgba(228,184,74,0.6);
          animation: spStarFloat linear infinite;
        }

        /* ── Judge character ────────────────────── */
        .sp-judge {
          position: relative; z-index: 2;
          width: 260px; height: 260px;
          display: flex; align-items: flex-end; justify-content: center;
          margin-bottom: 8px;
        }
        .sp-judge img {
          width: 100%; height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 16px 40px rgba(0,0,0,0.6));
        }
        .sp-judge-enter img { animation: spJudgeEnter 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
        .sp-judge-idle  img { animation: spJudgeFloat 3.2s ease-in-out infinite, spGavelBang 6s ease-in-out infinite; }

        @media (max-width: 480px) {
          .sp-judge { width: 210px; height: 210px; }
        }

        /* ── Title ──────────────────────────────── */
        .sp-title {
          position: relative; z-index: 2;
          font-size: 3rem; font-weight: 900; margin: 0 0 8px;
          line-height: 1.1; text-align: center;
          animation: spTitleIn 0.7s 0.4s both ease;
        }
        .sp-title-main   { color: #f0e8d0; }
        .sp-title-accent {
          color: #e4b84a;
          text-shadow: 0 0 30px rgba(228,184,74,0.5), 0 0 60px rgba(228,184,74,0.25);
          animation: spGoldGlow 2.5s ease-in-out infinite;
        }
        @media (max-width: 480px) { .sp-title { font-size: 2.4rem; } }

        /* ── Tagline ────────────────────────────── */
        .sp-tagline {
          position: relative; z-index: 2;
          font-size: 0.88rem; color: rgba(240,232,208,0.45);
          margin: 0 0 32px; text-align: center;
          animation: spFadeUp 0.6s 0.7s both ease;
          letter-spacing: 0.5px;
        }

        /* ── Button ─────────────────────────────── */
        .sp-btn {
          position: relative; z-index: 2;
          background: linear-gradient(135deg,#b8921a,#e4b84a);
          color: #1a0f00; border: none; border-radius: 14px;
          padding: 14px 40px; font-size: 1.05rem; font-weight: 900;
          cursor: pointer; font-family: Heebo,sans-serif;
          box-shadow: 0 6px 28px rgba(184,146,26,0.45);
          animation: spBtnIn 0.5s 1s both cubic-bezier(0.16,1,0.3,1), spBtnPulse 2.5s 1.5s ease-in-out infinite;
          letter-spacing: 0.3px;
        }
        .sp-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(184,146,26,0.55); }

        /* ── Tap hint ───────────────────────────── */
        .sp-hint {
          position: absolute; bottom: 28px;
          font-size: 0.72rem; color: rgba(240,232,208,0.22);
          letter-spacing: 1px; animation: spFadeUp 0.5s 1.4s both ease;
        }

        /* ── Keyframes ──────────────────────────── */
        @keyframes spJudgeEnter {
          0%   { transform: rotate(-540deg) scale(0.2) translateY(40px); opacity: 0; }
          75%  { transform: rotate(12deg)  scale(1.08) translateY(-8px); opacity: 1; }
          88%  { transform: rotate(-4deg)  scale(0.97) translateY(4px); }
          100% { transform: rotate(0deg)   scale(1)    translateY(0);   opacity: 1; }
        }
        @keyframes spJudgeFloat {
          0%, 100% { transform: translateY(0)    rotate(0deg); }
          35%       { transform: translateY(-14px) rotate(2deg); }
          70%       { transform: translateY(-7px)  rotate(-1deg); }
        }
        @keyframes spGavelBang {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          8%        { transform: rotate(-18deg) translateY(-10px); }
          16%       { transform: rotate(12deg)  translateY(6px); }
          24%       { transform: rotate(-6deg)  translateY(-3px); }
          32%       { transform: rotate(0deg)   translateY(0); }
        }
        @keyframes spGoldGlow {
          0%, 100% { text-shadow: 0 0 30px rgba(228,184,74,0.5), 0 0 60px rgba(228,184,74,0.2); }
          50%       { text-shadow: 0 0 50px rgba(228,184,74,0.9), 0 0 100px rgba(228,184,74,0.4); }
        }
        @keyframes spGlowPulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.15); }
        }
        @keyframes spTitleIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes spFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spBtnIn {
          from { opacity: 0; transform: scale(0.8) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes spBtnPulse {
          0%, 100% { box-shadow: 0 6px 28px rgba(184,146,26,0.45); }
          50%       { box-shadow: 0 6px 42px rgba(184,146,26,0.75); }
        }
        @keyframes spStarFloat {
          from { transform: translateY(0) scale(1); opacity: 0.7; }
          to   { transform: translateY(-100vh) scale(0.4); opacity: 0; }
        }
      `}</style>

      {/* Background glow */}
      <div className="sp-glow" />

      {/* Floating particles */}
      <div className="sp-stars">
        {[
          { size: 3, left: 15, delay: 0,   dur: 8  },
          { size: 2, left: 28, delay: 1.2, dur: 11 },
          { size: 4, left: 45, delay: 0.5, dur: 9  },
          { size: 2, left: 62, delay: 2.1, dur: 13 },
          { size: 3, left: 75, delay: 0.8, dur: 10 },
          { size: 2, left: 88, delay: 1.7, dur: 7  },
          { size: 3, left: 35, delay: 3,   dur: 12 },
          { size: 2, left: 55, delay: 2.5, dur: 9  },
        ].map((s, i) => (
          <div key={i} className="sp-star" style={{
            width: s.size, height: s.size,
            left: `${s.left}%`, bottom: '-10px',
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>

      {/* Judge character */}
      <div className={`sp-judge ${phase === 'enter' ? 'sp-judge-enter' : 'sp-judge-idle'}`}>
        <img src="/assets/judge-character.png" alt="הדיין הצעיר" draggable={false} />
      </div>

      {/* Title */}
      <h1 className="sp-title">
        <span className="sp-title-main">סוד </span>
        <span className="sp-title-accent">המשפט</span>
      </h1>

      {/* Tagline */}
      <p className="sp-tagline">גלה את סוד הצדק — חדר בריחה משפטי</p>

      {/* Start button */}
      {phase !== 'enter' && (
        <button className="sp-btn" onClick={e => { e.stopPropagation(); start(); }}>
          התחל לחקור ←
        </button>
      )}

      {/* Tap hint */}
      <div className="sp-hint">לחץ בכל מקום להתחיל</div>
    </div>
  );
}
