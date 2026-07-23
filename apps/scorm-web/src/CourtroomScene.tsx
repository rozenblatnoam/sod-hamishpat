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

    // ── Scales of Justice (above bench) ─────────────────────────────────────
    const scalesPost = MeshBuilder.CreateCylinder('scalesPost', { height: 1.2, diameter: 0.06 }, scene);
    scalesPost.position.set(0, 2.4, 4.3);
    scalesPost.material = goldMat;

    const scalesBar = MeshBuilder.CreateBox('scalesBar', { width: 1.2, height: 0.06, depth: 0.06 }, scene);
    scalesBar.position.set(0, 3.0, 4.3);
    scalesBar.material = goldMat;

    const scaleLeft = MeshBuilder.CreateCylinder('scaleLeft', { height: 0.08, diameter: 0.4 }, scene);
    scaleLeft.position.set(-0.55, 2.75, 4.3);
    scaleLeft.material = goldMat;

    const scaleRight = MeshBuilder.CreateCylinder('scaleRight', { height: 0.08, diameter: 0.4 }, scene);
    scaleRight.position.set(0.55, 2.85, 4.3);
    scaleRight.material = goldMat;

    // Animate scales gently
    const scalesAnim = new Animation('scaleAnim', 'rotation.z', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    scalesAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 60, value: 0.08 },
      { frame: 120, value: 0 },
      { frame: 180, value: -0.08 },
      { frame: 240, value: 0 },
    ]);
    scalesBar.animations = [scalesAnim];
    scene.beginAnimation(scalesBar, 0, 240, true);

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

      {/* Bottom hint */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        color: 'rgba(255,220,120,0.95)', fontFamily: 'Heebo', direction: 'rtl',
        padding: '10px 24px', borderRadius: 24,
        border: '1px solid rgba(255,200,80,0.3)',
        fontSize: '0.95rem', fontWeight: 600,
        animation: 'fadeIn 0.5s ease',
        whiteSpace: 'nowrap',
      }}>
        {hint}
      </div>
    </div>
  );
}
