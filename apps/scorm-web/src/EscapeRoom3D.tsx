import { useEffect, useRef, useState } from 'react';
import {
  Engine, Scene, Vector3, ArcRotateCamera,
  HemisphericLight, PointLight,
  MeshBuilder, StandardMaterial, Color3, Color4,
  Animation, DynamicTexture, Mesh,
} from '@babylonjs/core';
import type { RoomData, LessonData } from './content/types';

interface Props {
  room: RoomData;
  progress: { completedCases: string[] };
  coins: number;
  onSelectLesson: (lesson: LessonData) => void;
  onBack: () => void;
}

// Room constants
const RW = 14;   // room width
const RD = 12;   // room depth
const WH = 5;    // wall height

// Fixed node positions [x, z] — up to 6 lessons
const NODE_XZ: [number, number][] = [
  [-4.5,  5],
  [ 0,    5],
  [ 4.5,  5],
  [-5.5,  0],
  [ 5.5,  0],
  [ 0,   -2],
];

function lessonIsDone(lesson: LessonData, completedCases: string[]) {
  return lesson.cases.length > 0 && lesson.cases.every(c => completedCases.includes(c.id));
}

function drawLabel(tex: DynamicTexture, text: string, done: boolean) {
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = done ? '#50ff90' : '#50e8ff';
  ctx.shadowColor = done ? '#20ff60' : '#00c8ff';
  ctx.shadowBlur = 12;
  ctx.fillText(text, 64, 80);
  tex.update();
}

export function EscapeRoom3D({ room, progress, coins, onSelectLesson, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for cross-closure communication
  const onSelectLessonRef = useRef(onSelectLesson);
  useEffect(() => { onSelectLessonRef.current = onSelectLesson; }, [onSelectLesson]);

  const nodeGlowMatsRef = useRef<StandardMaterial[]>([]);
  const nodeLabelTexsRef = useRef<DynamicTexture[]>([]);
  const doorMatRef       = useRef<StandardMaterial | null>(null);
  const joystickRef      = useRef<{ dx: number; dz: number } | null>(null);
  const nearIdxRef       = useRef<number | null>(null);
  const keysRef          = useRef<Set<string>>(new Set());

  const [nearLesson, setNearLesson] = useState<LessonData | null>(null);
  const [allDone, setAllDone]       = useState(false);
  const [showDoorMsg, setShowDoorMsg] = useState(false);

  // Virtual joystick state
  const joyStartRef = useRef<{ x: number; y: number } | null>(null);
  const [joyVis, setJoyVis] = useState<{ cx: number; cy: number; kx: number; ky: number } | null>(null);

  // Keep node materials in sync with progress (called after Babylon initialises)
  useEffect(() => {
    const mats  = nodeGlowMatsRef.current;
    const texs  = nodeLabelTexsRef.current;
    const dMat  = doorMatRef.current;

    room.lessons.forEach((lesson, i) => {
      const done = lessonIsDone(lesson, progress.completedCases);
      if (mats[i]) {
        mats[i].diffuseColor  = done ? new Color3(0.2, 0.9, 0.4) : new Color3(0.1, 0.75, 0.95);
        mats[i].emissiveColor = done ? new Color3(0.08, 0.45, 0.15) : new Color3(0.04, 0.38, 0.5);
      }
      if (texs[i]) drawLabel(texs[i], String(i + 1), done);
    });

    const roomDone = room.lessons.length > 0 &&
      room.lessons.every(l => lessonIsDone(l, progress.completedCases));
    setAllDone(roomDone);
    if (dMat) {
      if (roomDone) {
        dMat.diffuseColor  = new Color3(0.15, 0.85, 0.35);
        dMat.emissiveColor = new Color3(0.05, 0.4, 0.12);
      } else {
        dMat.diffuseColor  = new Color3(0.8, 0.18, 0.08);
        dMat.emissiveColor = new Color3(0.35, 0.05, 0.01);
      }
    }
  }, [progress.completedCases, room.lessons]);

  // Main Babylon scene — runs once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.06, 0.03, 0.14, 1);

    // ── Camera ─────────────────────────────────────────────────────────────
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3.2, 20, Vector3.Zero(), scene);
    cam.lowerRadiusLimit = cam.upperRadiusLimit = 20;
    cam.lowerBetaLimit   = Math.PI / 4;
    cam.upperBetaLimit   = Math.PI / 3;

    // ── Lights ─────────────────────────────────────────────────────────────
    const amb = new HemisphericLight('amb', new Vector3(0, 1, 0), scene);
    amb.intensity    = 0.45;
    amb.diffuse      = new Color3(0.75, 0.65, 1);
    amb.groundColor  = new Color3(0.15, 0.08, 0.25);

    const makeLight = (pos: Vector3, col: Color3, intensity: number) => {
      const l = new PointLight(`pl${Math.random()}`, pos, scene);
      l.intensity = intensity;
      l.diffuse   = col;
      return l;
    };
    makeLight(new Vector3(-4,  3.5, -2.5), new Color3(0.3, 0.7, 1.0), 1.0);
    makeLight(new Vector3( 4,  3.5, -2.5), new Color3(1.0, 0.4, 0.8), 0.9);
    makeLight(new Vector3( 0,  3.5,  4.5), new Color3(1.0, 0.9, 0.3), 0.8);
    makeLight(new Vector3( 0,  3.5, -5),   new Color3(0.4, 1.0, 0.7), 0.7);

    // ── Floor ──────────────────────────────────────────────────────────────
    const floorTex = new DynamicTexture('floorTex', { width: 512, height: 512 }, scene, false);
    const fc = floorTex.getContext();
    fc.fillStyle = '#130a2e';
    fc.fillRect(0, 0, 512, 512);
    // Fine grid
    fc.strokeStyle = '#2a1260';
    fc.lineWidth = 1;
    for (let i = 0; i <= 28; i++) {
      const v = (i / 28) * 512;
      fc.beginPath(); fc.moveTo(v, 0); fc.lineTo(v, 512); fc.stroke();
      fc.beginPath(); fc.moveTo(0, v); fc.lineTo(512, v); fc.stroke();
    }
    // Bold grid
    fc.strokeStyle = '#5020b0';
    fc.lineWidth = 2;
    for (let i = 0; i <= 7; i++) {
      const v = (i / 7) * 512;
      fc.beginPath(); fc.moveTo(v, 0); fc.lineTo(v, 512); fc.stroke();
      fc.beginPath(); fc.moveTo(0, v); fc.lineTo(512, v); fc.stroke();
    }
    // Glowing center cross
    fc.strokeStyle = '#8040e0';
    fc.lineWidth = 3;
    fc.shadowColor = '#a060ff';
    fc.shadowBlur = 8;
    fc.beginPath(); fc.moveTo(256, 0); fc.lineTo(256, 512); fc.stroke();
    fc.beginPath(); fc.moveTo(0, 256); fc.lineTo(512, 256); fc.stroke();
    floorTex.update();

    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseTexture = floorTex;
    floorMat.emissiveColor  = new Color3(0.08, 0.04, 0.18);
    const floor = MeshBuilder.CreateBox('floor', { width: RW, height: 0.1, depth: RD }, scene);
    floor.position.y = 0;
    floor.material = floorMat;

    // Ceiling — faint purple
    const ceilMat = new StandardMaterial('ceilMat', scene);
    ceilMat.diffuseColor  = new Color3(0.1, 0.05, 0.2);
    ceilMat.emissiveColor = new Color3(0.03, 0.01, 0.07);
    const ceil = MeshBuilder.CreateBox('ceil', { width: RW, height: 0.1, depth: RD }, scene);
    ceil.position.y = WH;
    ceil.material = ceilMat;

    // ── Walls (each a different vibrant color) ─────────────────────────────
    const wallDefs: [string, number, number, number, number, number, number, Color3][] = [
      // name, w, h, d, px, py, pz, color
      ['backWall',  RW,   WH, 0.3,  0,     WH/2,  RD/2, new Color3(0.5, 0.1, 0.6)],  // magenta-purple
      ['frontWall', RW,   WH, 0.3,  0,     WH/2, -RD/2, new Color3(0.05, 0.3, 0.6)], // deep blue (door wall)
      ['leftWall',  0.3,  WH, RD,  -RW/2, WH/2,   0,    new Color3(0.1, 0.5, 0.45)], // teal
      ['rightWall', 0.3,  WH, RD,   RW/2, WH/2,   0,    new Color3(0.6, 0.3, 0.05)], // amber
    ];
    wallDefs.forEach(([name, w, h, d, px, py, pz, col]) => {
      const mat = new StandardMaterial(name + 'M', scene);
      mat.diffuseColor  = col;
      mat.emissiveColor = new Color3(col.r * 0.18, col.g * 0.18, col.b * 0.18);
      const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      mesh.position.set(px, py, pz);
      mesh.material = mat;
    });

    // ── Door on front wall ─────────────────────────────────────────────────
    const dMat = new StandardMaterial('doorMat', scene);
    const roomDoneNow = room.lessons.every(l => lessonIsDone(l, progress.completedCases));
    dMat.diffuseColor  = roomDoneNow ? new Color3(0.15, 0.85, 0.35) : new Color3(0.8, 0.18, 0.08);
    dMat.emissiveColor = roomDoneNow ? new Color3(0.05, 0.4, 0.12) : new Color3(0.35, 0.05, 0.01);
    const door = MeshBuilder.CreateBox('door', { width: 1.6, height: 3, depth: 0.4 }, scene);
    door.position.set(0, 1.5, -RD / 2);
    door.material = dMat;
    doorMatRef.current = dMat;

    // Door glow pulse
    const doorPulse = new Animation('doorPulse', 'material.emissiveColor.r', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    doorPulse.setKeys([
      { frame: 0,  value: roomDoneNow ? 0.05 : 0.35 },
      { frame: 30, value: roomDoneNow ? 0.12 : 0.65 },
      { frame: 60, value: roomDoneNow ? 0.05 : 0.35 },
    ]);
    door.animations = [doorPulse];
    scene.beginAnimation(door, 0, 60, true);

    // Lock icon above door
    const lockMat = new StandardMaterial('lockMat', scene);
    lockMat.diffuseColor  = new Color3(1, 0.85, 0.1);
    lockMat.emissiveColor = new Color3(0.5, 0.4, 0.03);
    const lockPulse = new Animation('lockPulse', 'material.emissiveColor.g', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    lockPulse.setKeys([{ frame: 0, value: 0.4 }, { frame: 30, value: 0.8 }, { frame: 60, value: 0.4 }]);
    const lock = MeshBuilder.CreateBox('lock', { width: 0.28, height: 0.28, depth: 0.15 }, scene);
    lock.position.set(0, 3.3, -RD / 2 + 0.3);
    lock.material = lockMat;
    lock.animations = [lockPulse];
    scene.beginAnimation(lock, 0, 60, true);

    // ── Corner accent pillars ──────────────────────────────────────────────
    const pillarColors = [
      new Color3(0.9, 0.3, 0.6),
      new Color3(0.3, 0.8, 0.9),
      new Color3(1.0, 0.7, 0.1),
      new Color3(0.5, 0.95, 0.4),
    ];
    [[-RW/2+0.5, RD/2-0.5], [RW/2-0.5, RD/2-0.5], [-RW/2+0.5, -RD/2+0.5], [RW/2-0.5, -RD/2+0.5]].forEach(([x, z], i) => {
      const m = new StandardMaterial(`cm${i}`, scene);
      m.diffuseColor  = pillarColors[i];
      m.emissiveColor = new Color3(pillarColors[i].r * 0.25, pillarColors[i].g * 0.25, pillarColors[i].b * 0.25);
      const c = MeshBuilder.CreateCylinder(`col${i}`, { height: WH, diameter: 0.4, tessellation: 10 }, scene);
      c.position.set(x, WH / 2, z);
      c.material = m;
    });

    // ── Lesson nodes ──────────────────────────────────────────────────────
    const glowMats: StandardMaterial[] = [];
    const labelTexs: DynamicTexture[]  = [];

    room.lessons.forEach((lesson, i) => {
      if (i >= NODE_XZ.length) return;
      const [nx, nz] = NODE_XZ[i];
      const done = lessonIsDone(lesson, progress.completedCases);

      // Base platform
      const baseMat = new StandardMaterial(`nb${i}`, scene);
      baseMat.diffuseColor  = new Color3(0.18, 0.14, 0.32);
      baseMat.emissiveColor = new Color3(0.05, 0.03, 0.1);
      const base = MeshBuilder.CreateCylinder(`nb${i}`, { height: 0.12, diameter: 1.1, tessellation: 12 }, scene);
      base.position.set(nx, 0.06, nz);
      base.material = baseMat;

      // Base ring glow
      const ringMat = new StandardMaterial(`nr${i}`, scene);
      ringMat.diffuseColor  = done ? new Color3(0.15, 0.9, 0.35) : new Color3(0.08, 0.7, 0.95);
      ringMat.emissiveColor = done ? new Color3(0.08, 0.5, 0.18) : new Color3(0.04, 0.35, 0.5);
      const ring = MeshBuilder.CreateTorus(`nr${i}`, { diameter: 1.2, thickness: 0.08, tessellation: 24 }, scene);
      ring.position.set(nx, 0.06, nz);
      ring.material = ringMat;
      const rPulse = new Animation(`rp${i}`, 'material.emissiveColor.g', 30,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      rPulse.setKeys([
        { frame: 0,  value: done ? 0.5 : 0.35 },
        { frame: 30, value: done ? 0.9 : 0.75 },
        { frame: 60, value: done ? 0.5 : 0.35 },
      ]);
      ring.animations = [rPulse];
      scene.beginAnimation(ring, i * 10, 60 + i * 10, true);

      // Pillar shaft
      const shaftMat = new StandardMaterial(`ns${i}`, scene);
      shaftMat.diffuseColor  = new Color3(0.22, 0.18, 0.36);
      shaftMat.emissiveColor = new Color3(0.06, 0.04, 0.12);
      const shaft = MeshBuilder.CreateCylinder(`ns${i}`, { height: 1.6, diameter: 0.35, tessellation: 10 }, scene);
      shaft.position.set(nx, 0.86, nz);
      shaft.material = shaftMat;

      // Glowing orb on top
      const glowMat = new StandardMaterial(`ng${i}`, scene);
      glowMat.diffuseColor  = done ? new Color3(0.2, 0.9, 0.4) : new Color3(0.1, 0.75, 0.95);
      glowMat.emissiveColor = done ? new Color3(0.08, 0.45, 0.15) : new Color3(0.04, 0.38, 0.5);
      const orb = MeshBuilder.CreateSphere(`ng${i}`, { diameter: 0.55, segments: 10 }, scene);
      orb.position.set(nx, 1.84, nz);
      orb.material = glowMat;
      glowMats.push(glowMat);

      // Orb float animation
      const floatAnim = new Animation(`nf${i}`, 'position.y', 30,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      floatAnim.setKeys([
        { frame: 0,  value: 1.84 },
        { frame: 30, value: 1.84 + 0.18 },
        { frame: 60, value: 1.84 },
      ]);
      orb.animations = [floatAnim];
      scene.beginAnimation(orb, i * 10, 60 + i * 10, true);

      // Orb pulse
      const orbPulse = new Animation(`op${i}`, 'material.emissiveColor.b', 30,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      orbPulse.setKeys([
        { frame: 0,  value: done ? 0.1 : 0.5 },
        { frame: 30, value: done ? 0.1 : 0.9 },
        { frame: 60, value: done ? 0.1 : 0.5 },
      ]);
      orb.animations.push(orbPulse);

      // Number label billboard
      const lTex = new DynamicTexture(`lt${i}`, { width: 128, height: 128 }, scene, false);
      drawLabel(lTex, String(i + 1), done);
      const lMat = new StandardMaterial(`lm${i}`, scene);
      lMat.diffuseTexture  = lTex;
      lMat.emissiveTexture = lTex;
      lMat.backFaceCulling = false;
      lMat.useAlphaFromDiffuseTexture = true;
      const lPlane = MeshBuilder.CreatePlane(`lp${i}`, { size: 0.8 }, scene);
      lPlane.position.set(nx, 2.55, nz);
      lPlane.material  = lMat;
      lPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
      labelTexs.push(lTex);
    });

    nodeGlowMatsRef.current = glowMats;
    nodeLabelTexsRef.current = labelTexs;

    // ── Player character ──────────────────────────────────────────────────
    const playerRoot = MeshBuilder.CreateBox('playerRoot', { size: 0.01 }, scene);
    playerRoot.isVisible = false;
    playerRoot.position.set(0, 0, -1);

    const bodyMat = new StandardMaterial('pBodyMat', scene);
    bodyMat.diffuseColor  = new Color3(1, 0.7, 0.1);
    bodyMat.emissiveColor = new Color3(0.35, 0.22, 0.02);
    const pBody = MeshBuilder.CreateCylinder('pBody', { height: 0.75, diameter: 0.48, tessellation: 12 }, scene);
    pBody.parent = playerRoot;
    pBody.position.y = 0.38;
    pBody.material = bodyMat;

    const headMat = new StandardMaterial('pHeadMat', scene);
    headMat.diffuseColor  = new Color3(1, 0.88, 0.35);
    headMat.emissiveColor = new Color3(0.4, 0.32, 0.06);
    const pHead = MeshBuilder.CreateSphere('pHead', { diameter: 0.44, segments: 10 }, scene);
    pHead.parent = playerRoot;
    pHead.position.y = 1.0;
    pHead.material = headMat;

    // Eye glow dots
    const eyeMat = new StandardMaterial('eyeMat', scene);
    eyeMat.emissiveColor = new Color3(0.2, 0.8, 1.0);
    [-0.1, 0.1].forEach((ex, ei) => {
      const eye = MeshBuilder.CreateSphere(`eye${ei}`, { diameter: 0.08, segments: 6 }, scene);
      eye.parent = playerRoot;
      eye.position.set(ex, 1.05, 0.2);
      eye.material = eyeMat;
    });

    // Player leg walk animation
    const legMat = new StandardMaterial('legMat', scene);
    legMat.diffuseColor  = new Color3(0.6, 0.4, 0.05);
    legMat.emissiveColor = new Color3(0.1, 0.06, 0.01);
    const legL = MeshBuilder.CreateBox('legL', { width: 0.16, height: 0.38, depth: 0.16 }, scene);
    legL.parent = playerRoot;
    legL.position.set(-0.14, 0.0, 0);
    legL.material = legMat;
    const legR = legL.clone('legR');
    legR.parent = playerRoot;
    legR.position.set(0.14, 0.0, 0);

    const legAnim = new Animation('legLAnim', 'position.y', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    legAnim.setKeys([
      { frame: 0,  value: 0.0 },
      { frame: 8,  value: 0.12 },
      { frame: 16, value: 0.0 },
    ]);
    const legAnimR = new Animation('legRAnim', 'position.y', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    legAnimR.setKeys([
      { frame: 0,  value: 0.12 },
      { frame: 8,  value: 0.0 },
      { frame: 16, value: 0.12 },
    ]);
    legL.animations = [legAnim];
    legR.animations  = [legAnimR];

    // Player glow aura
    const auraMat = new StandardMaterial('auraMat', scene);
    auraMat.diffuseColor  = new Color3(1, 0.7, 0.1);
    auraMat.emissiveColor = new Color3(0.3, 0.18, 0.0);
    auraMat.alpha = 0.22;
    const aura = MeshBuilder.CreateSphere('aura', { diameter: 0.9, segments: 8 }, scene);
    aura.parent = playerRoot;
    aura.position.y = 0.5;
    aura.material = auraMat;

    // ── Render loop ──────────────────────────────────────────────────────
    const playerPos = { x: playerRoot.position.x, z: playerRoot.position.z };
    const SPEED = 0.07;
    let legAnimRunning = false;

    engine.runRenderLoop(() => {
      const keys = keysRef.current;

      // Input: keyboard
      let dx = 0, dz = 0;
      if (keys.has('w') || keys.has('arrowup'))    dz += 1;
      if (keys.has('s') || keys.has('arrowdown'))  dz -= 1;
      if (keys.has('a') || keys.has('arrowleft'))  dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      // Input: virtual joystick
      const joy = joystickRef.current;
      if (joy) { dx += joy.dx; dz += joy.dz; }

      // Normalize
      const mag = Math.sqrt(dx * dx + dz * dz);
      const moving = mag > 0.05;
      if (moving) { dx /= mag; dz /= mag; }

      // Apply movement with room bounds
      if (moving) {
        playerPos.x = Math.max(-RW / 2 + 0.8, Math.min(RW / 2 - 0.8, playerPos.x + dx * SPEED));
        playerPos.z = Math.max(-RD / 2 + 0.8, Math.min(RD / 2 - 0.8, playerPos.z + dz * SPEED));
        playerRoot.rotation.y = Math.atan2(dx, dz);

        if (!legAnimRunning) {
          legAnimRunning = true;
          scene.beginAnimation(legL, 0, 16, true);
          scene.beginAnimation(legR, 0, 16, true);
        }
      } else if (legAnimRunning) {
        legAnimRunning = false;
        scene.stopAnimation(legL);
        scene.stopAnimation(legR);
        legL.position.y = 0;
        legR.position.y = 0;
      }

      playerRoot.position.set(playerPos.x, 0, playerPos.z);

      // Camera follows player (smooth)
      cam.target = Vector3.Lerp(cam.target, new Vector3(playerPos.x, 0, playerPos.z), 0.08);

      // Proximity check — find closest node within 2.2 units
      let closestIdx: number | null = null;
      let closestDist = 2.2;
      room.lessons.forEach((_, i) => {
        if (i >= NODE_XZ.length) return;
        const [nx, nz] = NODE_XZ[i];
        const dist = Math.hypot(playerPos.x - nx, playerPos.z - nz);
        if (dist < closestDist) { closestIdx = i; closestDist = dist; }
      });

      if (closestIdx !== nearIdxRef.current) {
        nearIdxRef.current = closestIdx;
        setNearLesson(closestIdx !== null ? (room.lessons[closestIdx] ?? null) : null);
      }

      // E key to interact
      if (keys.has('e') && closestIdx !== null) {
        keys.delete('e');
        const lesson = room.lessons[closestIdx];
        if (lesson) setTimeout(() => onSelectLessonRef.current(lesson), 0);
      }

      scene.render();
    });

    // ── Keyboard events ──────────────────────────────────────────────────
    const onKD = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const onKU = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Virtual joystick handlers ─────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (t.clientX < window.innerWidth * 0.55) {
      joyStartRef.current = { x: t.clientX, y: t.clientY };
      setJoyVis({ cx: t.clientX, cy: t.clientY, kx: 0, ky: 0 });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joyStartRef.current) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const rawDx = t.clientX - joyStartRef.current.x;
    const rawDy = t.clientY - joyStartRef.current.y;
    const maxR  = 44;
    const dist  = Math.min(Math.hypot(rawDx, rawDy), maxR);
    const angle = Math.atan2(rawDy, rawDx);
    const kx = Math.cos(angle) * dist;
    const ky = Math.sin(angle) * dist;
    setJoyVis({ cx: joyStartRef.current.x, cy: joyStartRef.current.y, kx, ky });
    joystickRef.current = { dx: kx / maxR, dz: -(ky / maxR) };
  };
  const handleTouchEnd = () => {
    joyStartRef.current = null;
    joystickRef.current = null;
    setJoyVis(null);
  };

  const completedInRoom = room.lessons.reduce((acc, l) =>
    acc + l.cases.filter(c => progress.completedCases.includes(c.id)).length, 0);
  const totalInRoom = room.lessons.reduce((acc, l) => acc + l.cases.length, 0);

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden',
               background: '#08030f', touchAction: 'none', userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* ── HUD top bar ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(to bottom, rgba(8,2,20,0.92) 0%, transparent 100%)',
                    direction: 'rtl', gap: 8 }}>
        <div style={{ color: '#c080ff', fontFamily: 'Heebo,sans-serif', fontWeight: 800, fontSize: '1.05rem',
                      textShadow: '0 0 12px rgba(180,80,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {room.icon} {room.titleHe}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {/* Progress */}
          <span style={{ color: '#a0c8ff', fontFamily: 'Heebo,sans-serif', fontSize: '0.8rem',
                         background: 'rgba(60,100,200,0.18)', border: '1px solid rgba(80,140,255,0.3)',
                         borderRadius: 20, padding: '3px 10px' }}>
            ✅ {completedInRoom}/{totalInRoom}
          </span>
          {/* Coins */}
          <span style={{ color: '#ffd700', fontFamily: 'Heebo,sans-serif', fontWeight: 700, fontSize: '0.85rem',
                         background: 'rgba(255,200,0,0.12)', border: '1px solid rgba(255,200,0,0.28)',
                         borderRadius: 20, padding: '3px 10px' }}>
            🪙 {coins}
          </span>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.88)',
                     border: '1px solid rgba(255,255,255,0.18)', padding: '6px 14px',
                     borderRadius: 20, cursor: 'pointer', fontFamily: 'Heebo,sans-serif',
                     fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            ← חזרה
          </button>
        </div>
      </div>

      {/* ── Near-lesson prompt ── */}
      {nearLesson && !allDone && (
        <div style={{ position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(55, 15, 110, 0.94)', backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(160,60,255,0.55)', color: '#fff',
                      fontFamily: 'Heebo,sans-serif', padding: '14px 22px', borderRadius: 16,
                      textAlign: 'center', direction: 'rtl', minWidth: 220,
                      boxShadow: '0 0 30px rgba(140,40,255,0.35)', animation: 'er3dPop .25s ease' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{nearLesson.title}</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(220,180,255,0.75)', marginBottom: 10 }}>
            {lessonIsDone(nearLesson, progress.completedCases) ? '✅ הושלם — אפשר לחזור ולתרגל' : 'גישו לשיעור וענו על השאלות'}
          </div>
          <button onClick={() => onSelectLesson(nearLesson)}
            style={{ background: 'linear-gradient(135deg, #7010c0, #b030f0)', color: '#fff',
                     border: 'none', borderRadius: 10, padding: '9px 22px', cursor: 'pointer',
                     fontFamily: 'Heebo,sans-serif', fontWeight: 800, fontSize: '0.92rem',
                     boxShadow: '0 4px 16px rgba(140,30,220,0.5)', width: '100%' }}>
            כנס לשיעור ←
          </button>
          <div style={{ marginTop: 7, fontSize: '0.72rem', color: 'rgba(200,160,255,0.45)' }}>
            מקלדת: לחץ E
          </div>
        </div>
      )}

      {/* ── All done overlay ── */}
      {allDone && !showDoorMsg && (() => { setTimeout(() => setShowDoorMsg(true), 300); return null; })()}
      {allDone && showDoorMsg && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      background: 'rgba(6, 35, 14, 0.97)', border: '2px solid #30e870',
                      color: '#30e870', fontFamily: 'Heebo,sans-serif', padding: '28px 36px',
                      borderRadius: 18, textAlign: 'center', direction: 'rtl',
                      boxShadow: '0 0 50px rgba(40,220,90,0.4)', animation: 'er3dPop .4s cubic-bezier(.16,1,.3,1)' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>🎉</div>
          <div style={{ fontWeight: 900, fontSize: '1.4rem', marginBottom: 8 }}>פצחת את החדר!</div>
          <div style={{ fontSize: '0.88rem', color: 'rgba(80,255,130,0.75)', marginBottom: 20 }}>
            כל השיעורים הושלמו — הדלת הירוקה פתוחה!
          </div>
          <button onClick={onBack}
            style={{ background: 'linear-gradient(135deg, #18a050, #35d075)', color: '#fff',
                     border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer',
                     fontFamily: 'Heebo,sans-serif', fontWeight: 800, fontSize: '1rem',
                     boxShadow: '0 4px 18px rgba(40,180,80,0.45)' }}>
            סיים חדר ←
          </button>
        </div>
      )}

      {/* ── Virtual joystick ── */}
      {joyVis && (
        <div style={{ position: 'absolute', pointerEvents: 'none',
                      left: joyVis.cx - 44, top: joyVis.cy - 44,
                      width: 88, height: 88, borderRadius: '50%',
                      background: 'rgba(160,80,255,0.15)',
                      border: '2px solid rgba(180,100,255,0.45)' }}>
          <div style={{ position: 'absolute',
                        left: 44 + joyVis.kx - 16, top: 44 + joyVis.ky - 16,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(210,140,255,0.8)',
                        boxShadow: '0 0 10px rgba(200,100,255,0.6)' }} />
        </div>
      )}

      {/* ── Mobile interact button (right side) ── */}
      {nearLesson && (
        <button onClick={() => onSelectLesson(nearLesson)}
          style={{ position: 'absolute', bottom: 28, right: 24, width: 68, height: 68,
                   borderRadius: '50%', background: 'linear-gradient(135deg, #7010c0, #c040ff)',
                   border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   cursor: 'pointer', fontSize: '1.6rem',
                   boxShadow: '0 0 22px rgba(180,60,255,0.65)', animation: 'er3dPulse 1.2s ease infinite' }}>
          ⚡
        </button>
      )}

      {/* ── Controls guide (desktop) ── */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, color: 'rgba(180,150,220,0.38)',
                    fontFamily: 'Heebo,sans-serif', fontSize: '0.7rem', direction: 'rtl', lineHeight: 1.6 }}>
        <div>תנועה: WASD / חצים</div>
        <div>כניסה לשיעור: E</div>
      </div>

      {/* ── Walkthrough tip ── */}
      {!nearLesson && !allDone && (
        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                      color: 'rgba(160,120,220,0.55)', fontFamily: 'Heebo,sans-serif',
                      fontSize: '0.78rem', whiteSpace: 'nowrap', direction: 'rtl' }}>
          🕹️ צעד לכיוון עמוד הלימוד כדי להתקרב
        </div>
      )}

      <style>{`
        @keyframes er3dPop {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.88); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes er3dPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(180,60,255,0.65); transform: scale(1); }
          50%       { box-shadow: 0 0 34px rgba(200,80,255,0.9); transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
