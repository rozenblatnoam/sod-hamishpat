import { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, SpriteManager, Sprite } from '@babylonjs/core';

interface JudgeCharacterProps {
  currentAction: 'idle' | 'strike';
}

// Spritesheet layout: 5 columns × 3 rows = 15 frames, each ~100×125px
// Row 0 (frames 0–4):  idle / standing poses
// Row 1 (frames 5–9):  gavel raising
// Row 2 (frames 10–14): gavel strike + holding book

export function JudgeCharacter({ currentAction }: JudgeCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const judgeSpriteRef = useRef<Sprite | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2.5, 5, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // 500×500px sheet, 5 cols × 3 rows → each frame 100×167px
    // Row 0 (0-4): idle/standing  Row 1 (5-9): gavel raise  Row 2 (10-14): strike/book
    const spriteManager = new SpriteManager(
      'judgeManager',
      '/assets/sprites/judge_spritesheet.png',
      1,
      { width: 100, height: 167 },
      scene
    );

    const judge = new Sprite('judge', spriteManager);
    judge.width = 2.5;
    judge.height = 3.0;
    judge.position = new Vector3(0, 0, 0);
    judgeSpriteRef.current = judge;

    judge.playAnimation(0, 4, true, 150);

    engine.runRenderLoop(() => scene.render());

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const judge = judgeSpriteRef.current;
    if (!judge) return;

    if (currentAction === 'idle') {
      judge.playAnimation(0, 4, true, 150);
    } else if (currentAction === 'strike') {
      judge.playAnimation(5, 9, false, 100, () => {
        judge.playAnimation(0, 4, true, 150);
      });
    }
  }, [currentAction]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', outline: 'none' }} />;
}
