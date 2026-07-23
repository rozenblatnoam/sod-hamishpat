import { useEffect, useState } from 'react';

// Spritesheet: 500×500px, 5 cols × 3 rows.
// We only use row 0 (y=0) to avoid imprecise row-offset issues.
// Correct → slow bounce + green glow.
// Wrong   → fast frantic + red shake.

type Reaction = 'correct' | 'wrong' | 'idle';

interface JudgeCharacterProps {
  reaction: Reaction;
  onDone?: () => void;
}

export function JudgeCharacter({ reaction, onDone }: JudgeCharacterProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reaction === 'idle') { setVisible(false); return; }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, reaction === 'correct' ? 1800 : 2200);
    return () => clearTimeout(timer);
  }, [reaction, onDone]);

  if (!visible) return null;

  const isCorrect = reaction === 'correct';

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: '5%',
      width: 100,
      height: 167,
      zIndex: 1000,
      animation: isCorrect
        ? 'judgeEnter 0.3s ease, judgeBounce 0.6s ease 0.3s infinite alternate'
        : 'judgeEnter 0.3s ease, judgeShake 0.4s ease 0.3s 3',
      filter: isCorrect
        ? 'drop-shadow(0 0 14px rgba(60,220,80,0.8))'
        : 'drop-shadow(0 0 14px rgba(220,50,50,0.85))',
    }}>
      <div style={{
        width: 100,
        height: 167,
        backgroundImage: 'url(/assets/sprites/judge_spritesheet.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPositionY: '0px',
        animation: isCorrect
          ? 'judgeSprite 1.2s steps(5) infinite'
          : 'judgeSprite 0.5s steps(5) infinite',
      }} />
      <style>{`
        @keyframes judgeSprite {
          from { background-position-x: 0; }
          to   { background-position-x: -500px; }
        }
        @keyframes judgeEnter {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes judgeBounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-10px); }
        }
        @keyframes judgeShake {
          0%   { transform: translateX(0) rotate(0deg); }
          20%  { transform: translateX(-9px) rotate(-3deg); }
          40%  { transform: translateX(9px) rotate(3deg); }
          60%  { transform: translateX(-6px) rotate(-2deg); }
          80%  { transform: translateX(6px) rotate(2deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
