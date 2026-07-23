import { useEffect, useState } from 'react';

// Spritesheet: 500×500px, 5 cols × 3 rows, each frame 100×167px
// Row 0 (y=0):   idle / standing poses  → correct answer
// Row 2 (y=334): gavel strike poses     → wrong answer

type Reaction = 'correct' | 'wrong' | 'idle';

interface JudgeCharacterProps {
  reaction: Reaction;
  onDone?: () => void;
}

const ROW: Record<Reaction, number> = {
  idle:    0,
  correct: 0,
  wrong:   334, // 2 * 167
};

export function JudgeCharacter({ reaction, onDone }: JudgeCharacterProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (reaction === 'idle') return;

    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, reaction === 'correct' ? 1500 : 2000);

    return () => clearTimeout(timer);
  }, [reaction, onDone]);

  if (!visible) return null;

  const animName = reaction === 'wrong' ? 'judge-strike' : 'judge-idle';

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: '5%',
      width: 100,
      height: 167,
      zIndex: 1000,
      animation: 'judgeEnter 0.3s ease',
      filter: reaction === 'correct'
        ? 'drop-shadow(0 0 12px rgba(80,220,80,0.7))'
        : reaction === 'wrong'
        ? 'drop-shadow(0 0 12px rgba(220,60,60,0.7))'
        : 'none',
    }}>
      <div style={{
        width: 100,
        height: 167,
        backgroundImage: 'url(/assets/sprites/judge_spritesheet.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPositionY: `-${ROW[reaction]}px`,
        animationName: animName,
        animationDuration: reaction === 'wrong' ? '0.8s' : '1s',
        animationTimingFunction: 'steps(5)',
        animationIterationCount: reaction === 'idle' ? 'infinite' : '2',
        animationFillMode: 'forwards',
      }} />
      <style>{`
        @keyframes judge-idle {
          from { background-position-x: 0; }
          to   { background-position-x: -500px; }
        }
        @keyframes judge-strike {
          from { background-position-x: 0; }
          to   { background-position-x: -500px; }
        }
        @keyframes judgeEnter {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
