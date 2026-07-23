import { useEffect, useRef, useState } from 'react';
import {
  Engine, Scene, Vector3, FreeCamera,
  HemisphericLight, PointLight, SpotLight,
  MeshBuilder, StandardMaterial, Color3, Color4,
  Animation, ActionManager, ExecuteCodeAction,
  ShadowGenerator,
} from '@babylonjs/core';

interface Props {
  roomName: string;
  onClose: () => void;
  onEnterCase: () => void;
}

export function CourtroomScene({ roomName, onClose, onEnterCase }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hint, setHint] = useState('לחץ על דוכן העדים כדי להתחיל');

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.03, 0.05, 1);

    // ── Camera ──────────────────────────────────────────────────────────────
    const camera = new FreeCamera('cam', new Vector3(0, 3.5, -9), scene);
    camera.setTarget(new Vector3(0, 1.8, 0));

    // ── Lights ──────────────────────────────────────────────────────────────
    const ambient = new HemisphericLight('amb', new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.25;
    ambient.diffuse = new Color3(1, 0.85, 0.6);
    ambient.groundColor = new Color3(0.1, 0.06, 0.03);

    const judgeLight = new SpotLight(
      'judgeLight', new Vector3(0, 6, 3),
      new Vector3(0, -1, 0), Math.PI / 3, 2, scene
    );
    judgeLight.intensity = 1.4;
    judgeLight.diffuse = new Color3(1, 0.9, 0.65);

    const witnessLight = new PointLight('witnessLight', new Vector3(-3.5, 3, 1), scene);
    witnessLight.intensity = 0.8;
    witnessLight.diffuse = new Color3(1, 0.8, 0.5);

    // ── Shadow ──────────────────────────────────────────────────────────────
    const shadows = new ShadowGenerator(512, judgeLight);
    shadows.useBlurExponentialShadowMap = true;

    // ── Materials ────────────────────────────────────────────────────────────
    const darkWood = new StandardMaterial('darkWood', scene);
    darkWood.diffuseColor = new Color3(0.22, 0.12, 0.06);
    darkWood.specularColor = new Color3(0.3, 0.2, 0.1);

    const lightWood = new StandardMaterial('lightWood', scene);
    lightWood.diffuseColor = new Color3(0.45, 0.28, 0.12);

    const wallMat = new StandardMaterial('wall', scene);
    wallMat.diffuseColor = new Color3(0.16, 0.11, 0.08);

    const marbleMat = new StandardMaterial('marble', scene);
    marbleMat.diffuseColor = new Color3(0.85, 0.82, 0.75);
    marbleMat.specularColor = new Color3(0.4, 0.4, 0.4);

    const goldMat = new StandardMaterial('gold', scene);
    goldMat.diffuseColor = new Color3(0.8, 0.65, 0.1);
    goldMat.specularColor = new Color3(1, 0.9, 0.3);
    goldMat.specularPower = 64;

    // ── Floor ────────────────────────────────────────────────────────────────
    const floor = MeshBuilder.CreateBox('floor', { width: 14, height: 0.15, depth: 12 }, scene);
    floor.position.y = -0.08;
    floor.material = darkWood;
    shadows.addShadowCaster(floor);
    floor.receiveShadows = true;

    // ── Walls ─────────────────────────────────────────────────────────────────
    const backWall = MeshBuilder.CreateBox('backWall', { width: 14, height: 8, depth: 0.25 }, scene);
    backWall.position.set(0, 4, 5.8);
    backWall.material = wallMat;

    const leftWall = MeshBuilder.CreateBox('leftWall', { width: 0.25, height: 8, depth: 12 }, scene);
    leftWall.position.set(-7, 4, 0);
    leftWall.material = wallMat;

    const rightWall = MeshBuilder.CreateBox('rightWall', { width: 0.25, height: 8, depth: 12 }, scene);
    rightWall.position.set(7, 4, 0);
    rightWall.material = wallMat;

    // ── Judge Platform ───────────────────────────────────────────────────────
    const judgePlatform = MeshBuilder.CreateBox('judgePlatform', { width: 6, height: 0.5, depth: 3 }, scene);
    judgePlatform.position.set(0, 0.25, 4);
    judgePlatform.material = marbleMat;
    judgePlatform.receiveShadows = true;

    const judgeBench = MeshBuilder.CreateBox('judgeBench', { width: 4.5, height: 1.1, depth: 1.2 }, scene);
    judgeBench.position.set(0, 1.05, 4.3);
    judgeBench.material = darkWood;
    shadows.addShadowCaster(judgeBench);

    // Judge bench front panel detail
    const benchFront = MeshBuilder.CreateBox('benchFront', { width: 4.5, height: 0.08, depth: 0.05 }, scene);
    benchFront.position.set(0, 1.58, 3.78);
    benchFront.material = goldMat;

    // ── 3 Judge Figures (no faces) ───────────────────────────────────────────
    const robeMat = new StandardMaterial('robe', scene);
    robeMat.diffuseColor = new Color3(0.08, 0.08, 0.12);
    robeMat.specularColor = new Color3(0.15, 0.15, 0.2);

    const skinMat = new StandardMaterial('skin', scene);
    skinMat.diffuseColor = new Color3(0.75, 0.62, 0.5);

    const hatMat = new StandardMaterial('hat', scene);
    hatMat.diffuseColor = new Color3(0.06, 0.06, 0.08);

    function createJudge(name: string, x: number, scale: number, phaseOffset: number) {
      const root = MeshBuilder.CreateBox(`${name}Root`, { width: 0.01, height: 0.01, depth: 0.01 }, scene);
      root.position.set(x, 1.65, 4.55);
      root.isVisible = false;

      // Body (robe)
      const body = MeshBuilder.CreateBox(`${name}Body`, { width: 0.55 * scale, height: 0.9 * scale, depth: 0.38 * scale }, scene);
      body.parent = root;
      body.position.y = 0;
      body.material = robeMat;
      shadows.addShadowCaster(body);

      // Shoulders
      const shoulders = MeshBuilder.CreateBox(`${name}Sho`, { width: 0.7 * scale, height: 0.18 * scale, depth: 0.42 * scale }, scene);
      shoulders.parent = root;
      shoulders.position.y = 0.38 * scale;
      shoulders.material = robeMat;

      // Head (featureless sphere)
      const head = MeshBuilder.CreateSphere(`${name}Head`, { diameter: 0.32 * scale, segments: 10 }, scene);
      head.parent = root;
      head.position.y = 0.68 * scale;
      head.material = skinMat;
      shadows.addShadowCaster(head);

      // Judge hat (flat cylinder)
      const hatBrim = MeshBuilder.CreateCylinder(`${name}HatBrim`, { height: 0.04 * scale, diameter: 0.48 * scale }, scene);
      hatBrim.parent = root;
      hatBrim.position.y = 0.86 * scale;
      hatBrim.material = hatMat;

      const hatTop = MeshBuilder.CreateCylinder(`${name}HatTop`, { height: 0.22 * scale, diameter: 0.3 * scale }, scene);
      hatTop.parent = root;
      hatTop.position.y = 0.98 * scale;
      hatTop.material = hatMat;

      // Arms
      const armL = MeshBuilder.CreateBox(`${name}ArmL`, { width: 0.14 * scale, height: 0.5 * scale, depth: 0.14 * scale }, scene);
      armL.parent = root;
      armL.position.set(-0.36 * scale, 0.12 * scale, 0);
      armL.material = robeMat;

      const armR = MeshBuilder.CreateBox(`${name}ArmR`, { width: 0.14 * scale, height: 0.5 * scale, depth: 0.14 * scale }, scene);
      armR.parent = root;
      armR.position.set(0.36 * scale, 0.12 * scale, 0);
      armR.material = robeMat;

      // Breathing animation on root Y
      const breathAnim = new Animation(
        `${name}Breath`, 'position.y', 30,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE
      );
      const base = 1.65;
      breathAnim.setKeys([
        { frame: 0 + phaseOffset,   value: base },
        { frame: 45 + phaseOffset,  value: base + 0.04 },
        { frame: 90 + phaseOffset,  value: base },
        { frame: 135 + phaseOffset, value: base - 0.02 },
        { frame: 180 + phaseOffset, value: base },
      ]);
      root.animations = [breathAnim];
      scene.beginAnimation(root, 0, 180, true);

      // Subtle head nod
      const nodAnim = new Animation(
        `${name}Nod`, 'rotation.x', 30,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE
      );
      nodAnim.setKeys([
        { frame: 0,   value: 0 },
        { frame: 60,  value: 0.06 },
        { frame: 120, value: 0 },
        { frame: 180, value: -0.04 },
        { frame: 240, value: 0 },
      ]);
      head.animations = [nodAnim];
      scene.beginAnimation(head, phaseOffset, 240 + phaseOffset, true);
    }

    createJudge('judgeC', 0,    1.15, 0);   // center — larger
    createJudge('judgeL', -1.7, 0.95, 30);  // left
    createJudge('judgeR', 1.7,  0.95, 60);  // right

    // ── Witness Stand ────────────────────────────────────────────────────────
    const witnessBase = MeshBuilder.CreateBox('witnessBase', { width: 1.8, height: 0.3, depth: 1.8 }, scene);
    witnessBase.position.set(-3.5, 0.15, 1.2);
    witnessBase.material = lightWood;
    witnessBase.receiveShadows = true;

    const witnessBox = MeshBuilder.CreateBox('witnessBox', { width: 1.5, height: 0.9, depth: 1.5 }, scene);
    witnessBox.position.set(-3.5, 0.75, 1.2);
    witnessBox.material = lightWood;
    shadows.addShadowCaster(witnessBox);

    // Glow pulsing effect on witness stand
    const witnessGlow = new StandardMaterial('witnessGlow', scene);
    witnessGlow.diffuseColor = new Color3(0.55, 0.35, 0.15);
    witnessGlow.emissiveColor = new Color3(0.3, 0.15, 0.02);
    witnessBox.material = witnessGlow;

    const pulseAnim = new Animation('pulse', 'material.emissiveColor.r', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    pulseAnim.setKeys([
      { frame: 0, value: 0.3 },
      { frame: 45, value: 0.6 },
      { frame: 90, value: 0.3 },
    ]);
    witnessBox.animations = [pulseAnim];
    scene.beginAnimation(witnessBox, 0, 90, true);

    // ── Gallery benches ──────────────────────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const bench = MeshBuilder.CreateBox(`bench${i}`, { width: 5, height: 0.4, depth: 0.6 }, scene);
      bench.position.set(1.5, 0.2, -1 - i * 1.4);
      bench.material = darkWood;
      bench.receiveShadows = true;
    }

    // ── Columns ──────────────────────────────────────────────────────────────
    [[-5.5, 0], [5.5, 0], [-5.5, 4], [5.5, 4]].forEach(([x, z], i) => {
      const col = MeshBuilder.CreateCylinder(`col${i}`, { height: 7, diameter: 0.5, tessellation: 12 }, scene);
      col.position.set(x as number, 3.5, z as number);
      col.material = marbleMat;
      shadows.addShadowCaster(col);
    });

    // ── Click on witness stand ───────────────────────────────────────────────
    witnessBox.actionManager = new ActionManager(scene);
    witnessBox.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        setHint('לחץ לפתוח את התיק');
        (witnessBox.material as StandardMaterial).emissiveColor = new Color3(0.6, 0.3, 0.05);
      })
    );
    witnessBox.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        setHint('לחץ על דוכן העדים כדי להתחיל');
        (witnessBox.material as StandardMaterial).emissiveColor = new Color3(0.3, 0.15, 0.02);
      })
    );
    witnessBox.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => onEnterCase())
    );

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, [onEnterCase]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#080508' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        direction: 'rtl',
      }}>
        <div style={{ color: 'rgba(255,220,120,0.9)', fontFamily: 'Heebo', fontWeight: 800, fontSize: '1.1rem' }}>
          ⚖️ {roomName}
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
          padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '0.85rem',
        }}>
          ← חזרה
        </button>
      </div>

      {/* Bottom action button — tappable on mobile too */}
      <button
        onClick={onEnterCase}
        style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
          color: 'rgba(255,220,120,0.97)', fontFamily: 'Heebo', direction: 'rtl',
          padding: '14px 36px', borderRadius: 28,
          border: '1.5px solid rgba(255,200,80,0.45)',
          fontSize: '1.05rem', fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          WebkitTapHighlightColor: 'rgba(0,0,0,0)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          minWidth: 200,
        }}
      >
        {hint} ←
      </button>
    </div>
  );
}
