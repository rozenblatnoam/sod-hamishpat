import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Engine, Scene, Vector3, ArcRotateCamera,
  HemisphericLight, PointLight,
  MeshBuilder, StandardMaterial, Color3, Color4,
  Animation, DynamicTexture,
} from '@babylonjs/core';
import type { RoomData, LessonData } from './content/types';

interface Props {
  room: RoomData;
  progress: { completedCases: string[] };
  coins: number;
  onSelectLesson: (lesson: LessonData) => void;
  onBack: () => void;
}

// Room dimensions
const RW = 14;
const RD = 14;
const WH = 5;

// Zigzag path from entrance (bottom) toward back wall (top)
// Character enters at z ≈ -6 and progresses toward z = +6
const NODE_XZ: [number, number][] = [
  [-3,   -3.5],  // station 1 — left
  [ 3,   -1.5],  // station 2 — right
  [-3,    0.5],  // station 3 — left
  [ 3,    2.5],  // station 4 — right
  [-3,    4.0],  // station 5 — left
  [ 0,    5.5],  // station 6 — center (near back wall, final)
];

const PLAYER_START: [number, number] = [0, -4.5]; // near entrance

function lessonIsDone(lesson: LessonData, done: string[]) {
  return lesson.cases.length > 0 && lesson.cases.every(c => done.includes(c.id));
}

function drawLabelCanvas(tex: DynamicTexture, num: number, state: 'done' | 'active' | 'locked') {
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 128, 128);
  const color = state === 'done' ? '#50ff90' : state === 'active' ? '#50e8ff' : '#444466';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  if (state !== 'locked') {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }
  ctx.fillText(String(num), 64, 80);
  tex.update();
}

export function EscapeRoom3D({ room, progress, coins, onSelectLesson, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onSelectLessonRef = useRef(onSelectLesson);
  useEffect(() => { onSelectLessonRef.current = onSelectLesson; }, [onSelectLesson]);

  // Refs for cross-closure Babylon state
  const doorMeshRef    = useRef<ReturnType<typeof MeshBuilder.CreateBox> | null>(null);
  const doorOpenedRef  = useRef(false);
  const nodeGlowMatsRef   = useRef<StandardMaterial[]>([]);
  const nodeLabelTexsRef  = useRef<DynamicTexture[]>([]);
  const nodeGlowLightsRef = useRef<PointLight[]>([]);
  const nodeMeshesRef     = useRef<ReturnType<typeof MeshBuilder.CreateSphere>[]>([]);
  const joystickRef    = useRef<{ dx: number; dz: number } | null>(null);
  const keysRef        = useRef<Set<string>>(new Set());
  const nearIdxRef     = useRef<number | null>(null);
  const playerPosRef   = useRef({ x: PLAYER_START[0], z: PLAYER_START[1] });

  const [phase, setPhase]         = useState<'intro' | 'playing' | 'done'>('intro');
  const [nearLesson, setNearLesson] = useState<LessonData | null>(null);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);
  const activeNodeIdxRef = useRef(0);

  // Joystick visual
  const joyStartRef = useRef<{ x: number; y: number } | null>(null);
  const [joyVis, setJoyVis] = useState<{ cx: number; cy: number; kx: number; ky: number } | null>(null);

  // Compute which node is the current active one
  const computeActiveIdx = useCallback((completedCases: string[]) => {
    const idx = room.lessons.findIndex(l => !lessonIsDone(l, completedCases));
    return idx === -1 ? room.lessons.length : idx;
  }, [room.lessons]);

  // Update node visuals whenever progress changes
  useEffect(() => {
    const mats  = nodeGlowMatsRef.current;
    const texs  = nodeLabelTexsRef.current;
    const lights = nodeGlowLightsRef.current;

    const newActive = computeActiveIdx(progress.completedCases);

    room.lessons.forEach((_, i) => {
      const state: 'done' | 'active' | 'locked' =
        i < newActive ? 'done' : i === newActive ? 'active' : 'locked';

      if (mats[i]) {
        if (state === 'done') {
          mats[i].diffuseColor  = new Color3(0.15, 0.85, 0.35);
          mats[i].emissiveColor = new Color3(0.06, 0.4, 0.14);
          mats[i].alpha = 1;
        } else if (state === 'active') {
          mats[i].diffuseColor  = new Color3(0.1, 0.75, 0.95);
          mats[i].emissiveColor = new Color3(0.04, 0.38, 0.5);
          mats[i].alpha = 1;
        } else {
          mats[i].diffuseColor  = new Color3(0.15, 0.12, 0.28);
          mats[i].emissiveColor = new Color3(0.02, 0.01, 0.05);
          mats[i].alpha = 0.45;
        }
      }
      if (lights[i]) {
        lights[i].intensity = state === 'active' ? 1.2 : state === 'done' ? 0.6 : 0.0;
        lights[i].diffuse = state === 'done' ? new Color3(0.3, 1, 0.5) : new Color3(0.2, 0.8, 1);
      }
      if (texs[i]) drawLabelCanvas(texs[i], i + 1, state);
    });

    // Check if all done — open exit door
    const allDone = newActive >= room.lessons.length;
    if (allDone && doorMeshRef.current && !doorOpenedRef.current) {
      openDoor(false); // silent open (not intro open)
    }
    if (allDone) setPhase('done');

    // Auto-advance character toward next node if it changed
    const prev = activeNodeIdxRef.current;
    activeNodeIdxRef.current = newActive;
    setActiveNodeIdx(newActive);
    if (newActive > prev && newActive < NODE_XZ.length) {
      const [nx, nz] = NODE_XZ[newActive];
      playerPosRef.current = { x: nx * 0.35, z: nz - 1.2 };
    }
  }, [progress.completedCases, room.lessons, computeActiveIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shared door open function (used both on intro and on room completion)
  function openDoor(isIntro: boolean) {
    const door = doorMeshRef.current;
    if (!door || doorOpenedRef.current) return;
    doorOpenedRef.current = isIntro; // mark opened only for intro (re-open on completion too)

    const slideAnim = new Animation('doorSlide', 'position.y', 60,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    slideAnim.setKeys([
      { frame: 0,  value: door.position.y },
      { frame: 40, value: WH + 0.5 },
    ]);
    door.animations = [slideAnim];
    // Access scene via the mesh
    const scene = door.getScene();
    scene.beginAnimation(door, 0, 40, false);
  }

  // ── Main Babylon scene — runs once ────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true });
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0.06, 0.03, 0.14, 1);

    // ── Camera: fixed isometric view ────────────────────────────────────────
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3.2, 22, Vector3.Zero(), scene);
    cam.lowerRadiusLimit = cam.upperRadiusLimit = 22;
    cam.lowerBetaLimit   = Math.PI / 4;
    cam.upperBetaLimit   = Math.PI / 3;

    // ── Lights ─────────────────────────────────────────────────────────────
    const amb = new HemisphericLight('amb', new Vector3(0, 1, 0), scene);
    amb.intensity   = 0.4;
    amb.diffuse     = new Color3(0.75, 0.65, 1);
    amb.groundColor = new Color3(0.1, 0.06, 0.2);

    const mkL = (pos: Vector3, col: Color3, i: number) => {
      const l = new PointLight(`pl${i}`, pos, scene);
      l.intensity = 0.85; l.diffuse = col; return l;
    };
    mkL(new Vector3(-4, 3.5, -3), new Color3(0.3, 0.7, 1.0), 0);
    mkL(new Vector3( 4, 3.5, -3), new Color3(1.0, 0.4, 0.8), 1);
    mkL(new Vector3( 0, 3.5,  5), new Color3(1.0, 0.9, 0.3), 2);
    mkL(new Vector3( 0, 3.5, -5), new Color3(0.4, 1.0, 0.7), 3);

    // ── Floor ──────────────────────────────────────────────────────────────
    const fTex = new DynamicTexture('fTex', { width: 512, height: 512 }, scene, false);
    const fc = fTex.getContext() as unknown as CanvasRenderingContext2D;
    fc.fillStyle = '#0e0628'; fc.fillRect(0, 0, 512, 512);
    fc.strokeStyle = '#2a1260'; fc.lineWidth = 1;
    for (let i = 0; i <= 28; i++) {
      const v = (i / 28) * 512;
      fc.beginPath(); fc.moveTo(v, 0); fc.lineTo(v, 512); fc.stroke();
      fc.beginPath(); fc.moveTo(0, v); fc.lineTo(512, v); fc.stroke();
    }
    fc.strokeStyle = '#5020b0'; fc.lineWidth = 2;
    for (let i = 0; i <= 7; i++) {
      const v = (i / 7) * 512;
      fc.beginPath(); fc.moveTo(v, 0); fc.lineTo(v, 512); fc.stroke();
      fc.beginPath(); fc.moveTo(0, v); fc.lineTo(512, v); fc.stroke();
    }
    fTex.update();
    const floorMat = new StandardMaterial('floorMat', scene);
    floorMat.diffuseTexture = fTex;
    floorMat.emissiveColor  = new Color3(0.07, 0.03, 0.15);
    const floor = MeshBuilder.CreateBox('floor', { width: RW, height: 0.1, depth: RD }, scene);
    floor.position.y = 0; floor.material = floorMat;

    // ── Ceiling ────────────────────────────────────────────────────────────
    const cMat = new StandardMaterial('cMat', scene);
    cMat.diffuseColor = new Color3(0.08, 0.04, 0.18);
    cMat.emissiveColor = new Color3(0.02, 0.01, 0.06);
    const ceil = MeshBuilder.CreateBox('ceil', { width: RW, height: 0.1, depth: RD }, scene);
    ceil.position.y = WH; ceil.material = cMat;

    // ── Walls ──────────────────────────────────────────────────────────────
    const wDefs: [string, number, number, number, number, number, number, Color3][] = [
      ['back',  RW,   WH, 0.3,  0,     WH/2,  RD/2, new Color3(0.45, 0.08, 0.55)],
      ['front', RW,   WH, 0.3,  0,     WH/2, -RD/2, new Color3(0.04, 0.22, 0.55)],
      ['left',  0.3,  WH, RD,  -RW/2, WH/2,   0,    new Color3(0.08, 0.44, 0.42)],
      ['right', 0.3,  WH, RD,   RW/2, WH/2,   0,    new Color3(0.55, 0.26, 0.04)],
    ];
    wDefs.forEach(([n, w, h, d, px, py, pz, col]) => {
      const m = new StandardMaterial(n + 'M', scene);
      m.diffuseColor  = col;
      m.emissiveColor = new Color3(col.r * 0.16, col.g * 0.16, col.b * 0.16);
      const mesh = MeshBuilder.CreateBox(n, { width: w, height: h, depth: d }, scene);
      mesh.position.set(px, py, pz); mesh.material = m;
    });

    // ── Corner pillars ─────────────────────────────────────────────────────
    const pCols = [new Color3(0.9, 0.3, 0.6), new Color3(0.3, 0.8, 0.9),
                   new Color3(1.0, 0.7, 0.1), new Color3(0.5, 0.95, 0.4)];
    [[-RW/2+0.5, RD/2-0.5], [RW/2-0.5, RD/2-0.5],
     [-RW/2+0.5, -RD/2+0.5], [RW/2-0.5, -RD/2+0.5]].forEach(([x, z], i) => {
      const m = new StandardMaterial(`cm${i}`, scene);
      m.diffuseColor  = pCols[i];
      m.emissiveColor = new Color3(pCols[i].r * 0.2, pCols[i].g * 0.2, pCols[i].b * 0.2);
      const c = MeshBuilder.CreateCylinder(`col${i}`, { height: WH, diameter: 0.38, tessellation: 10 }, scene);
      c.position.set(x, WH/2, z); c.material = m;
    });

    // ── Path dots on floor (between consecutive nodes) ─────────────────────
    const dotMat = new StandardMaterial('dotMat', scene);
    dotMat.diffuseColor  = new Color3(0.35, 0.18, 0.7);
    dotMat.emissiveColor = new Color3(0.18, 0.08, 0.38);
    const allXZ: [number, number][] = [[PLAYER_START[0], PLAYER_START[1]], ...NODE_XZ];
    for (let i = 0; i < allXZ.length - 1; i++) {
      const [ax, az] = allXZ[i], [bx, bz] = allXZ[i + 1];
      const steps = 5;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const dot = MeshBuilder.CreateCylinder(`dot${i}_${s}`, { height: 0.04, diameter: 0.2, tessellation: 8 }, scene);
        dot.position.set(ax + (bx - ax) * t, 0.07, az + (bz - az) * t);
        dot.material = dotMat;
      }
    }

    // ── Entry door on front wall (the one the player enters through) ───────
    const dMat = new StandardMaterial('doorMat', scene);
    dMat.diffuseColor  = new Color3(0.7, 0.15, 0.06);
    dMat.emissiveColor = new Color3(0.35, 0.05, 0.01);
    const door = MeshBuilder.CreateBox('door', { width: 1.7, height: 3.2, depth: 0.5 }, scene);
    door.position.set(0, 1.6, -RD / 2);
    door.material = dMat;
    doorMeshRef.current = door;

    // Door glow pulse
    const dPulse = new Animation('dPulse', 'material.emissiveColor.r', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    dPulse.setKeys([
      { frame: 0, value: 0.35 }, { frame: 30, value: 0.7 }, { frame: 60, value: 0.35 },
    ]);
    door.animations = [dPulse];
    scene.beginAnimation(door, 0, 60, true);

    // Lock plate on door
    const lkMat = new StandardMaterial('lkMat', scene);
    lkMat.diffuseColor  = new Color3(1, 0.85, 0.1);
    lkMat.emissiveColor = new Color3(0.5, 0.4, 0.03);
    const lock = MeshBuilder.CreateBox('lock', { width: 0.3, height: 0.3, depth: 0.2 }, scene);
    lock.position.set(0, 1.5, -RD / 2 + 0.35);
    lock.material = lkMat;

    // ── Lesson nodes along the zigzag path ──────────────────────────────────
    const glowMats: StandardMaterial[]  = [];
    const labelTexs: DynamicTexture[]   = [];
    const glowLights: PointLight[]      = [];
    const orbMeshes: ReturnType<typeof MeshBuilder.CreateSphere>[] = [];

    const initActive = computeActiveIdx(progress.completedCases);

    room.lessons.forEach((_, i) => {
      if (i >= NODE_XZ.length) return;
      const [nx, nz] = NODE_XZ[i];
      const state: 'done' | 'active' | 'locked' =
        i < initActive ? 'done' : i === initActive ? 'active' : 'locked';

      // Base ring
      const ringMat = new StandardMaterial(`rM${i}`, scene);
      ringMat.diffuseColor  = state === 'done' ? new Color3(0.1, 0.8, 0.3) :
                              state === 'active' ? new Color3(0.05, 0.65, 0.9) :
                              new Color3(0.1, 0.08, 0.2);
      ringMat.emissiveColor = state === 'locked'
        ? new Color3(0.01, 0.01, 0.03)
        : new Color3(ringMat.diffuseColor.r * 0.3, ringMat.diffuseColor.g * 0.3, ringMat.diffuseColor.b * 0.3);
      const ring = MeshBuilder.CreateTorus(`rT${i}`, { diameter: 1.3, thickness: 0.09, tessellation: 24 }, scene);
      ring.position.set(nx, 0.07, nz);
      ring.material = ringMat;
      if (state === 'active') {
        const rAnim = new Animation(`ra${i}`, 'material.emissiveColor.b', 30,
          Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        rAnim.setKeys([{ frame: 0, value: 0.3 }, { frame: 30, value: 0.8 }, { frame: 60, value: 0.3 }]);
        ring.animations = [rAnim];
        scene.beginAnimation(ring, i * 8, 60 + i * 8, true);
      }

      // Pillar
      const shMat = new StandardMaterial(`shM${i}`, scene);
      shMat.diffuseColor  = new Color3(0.18, 0.14, 0.32);
      shMat.emissiveColor = state === 'locked'
        ? new Color3(0.01, 0.01, 0.02)
        : new Color3(0.04, 0.03, 0.09);
      shMat.alpha = state === 'locked' ? 0.45 : 1;
      const shaft = MeshBuilder.CreateCylinder(`sh${i}`, { height: 1.65, diameter: 0.32, tessellation: 10 }, scene);
      shaft.position.set(nx, 0.83, nz);
      shaft.material = shMat;

      // Glowing orb
      const gMat = new StandardMaterial(`gM${i}`, scene);
      gMat.diffuseColor  = state === 'done' ? new Color3(0.15, 0.9, 0.38) :
                           state === 'active' ? new Color3(0.08, 0.75, 0.95) :
                           new Color3(0.12, 0.1, 0.24);
      gMat.emissiveColor = state === 'locked'
        ? new Color3(0.01, 0.01, 0.03)
        : new Color3(gMat.diffuseColor.r * 0.45, gMat.diffuseColor.g * 0.45, gMat.diffuseColor.b * 0.45);
      gMat.alpha = state === 'locked' ? 0.35 : 1;
      const orb = MeshBuilder.CreateSphere(`orb${i}`, { diameter: 0.58, segments: 10 }, scene);
      orb.position.set(nx, 1.88, nz);
      orb.material = gMat;
      glowMats.push(gMat);
      orbMeshes.push(orb);

      if (state === 'active') {
        const fAnim = new Animation(`fa${i}`, 'position.y', 30,
          Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        fAnim.setKeys([
          { frame: 0, value: 1.88 }, { frame: 30, value: 2.1 }, { frame: 60, value: 1.88 },
        ]);
        orb.animations = [fAnim];
        scene.beginAnimation(orb, i * 8, 60 + i * 8, true);
      }

      // Node point light
      const nLight = new PointLight(`nL${i}`, new Vector3(nx, 2.5, nz), scene);
      nLight.intensity = state === 'active' ? 1.2 : state === 'done' ? 0.6 : 0.0;
      nLight.diffuse   = state === 'done' ? new Color3(0.3, 1, 0.5) : new Color3(0.2, 0.8, 1);
      glowLights.push(nLight);

      // Number label billboard plane
      const lTex = new DynamicTexture(`lt${i}`, { width: 128, height: 128 }, scene, false);
      drawLabelCanvas(lTex, i + 1, state);
      const lMat = new StandardMaterial(`lm${i}`, scene);
      lMat.diffuseTexture  = lTex;
      lMat.emissiveTexture = lTex;
      lMat.backFaceCulling = false;
      lMat.useAlphaFromDiffuseTexture = true;
      lMat.alpha = state === 'locked' ? 0.3 : 1;
      const lPlane = MeshBuilder.CreatePlane(`lP${i}`, { size: 0.72 }, scene);
      lPlane.position.set(nx, 2.65, nz);
      lPlane.material  = lMat;
      lPlane.billboardMode = 7;
      labelTexs.push(lTex);
    });

    nodeGlowMatsRef.current   = glowMats;
    nodeLabelTexsRef.current  = labelTexs;
    nodeGlowLightsRef.current = glowLights;
    nodeMeshesRef.current     = orbMeshes;

    // ── Player character ────────────────────────────────────────────────────
    const playerRoot = MeshBuilder.CreateBox('playerRoot', { size: 0.01 }, scene);
    playerRoot.isVisible = false;
    playerRoot.position.set(PLAYER_START[0], 0, PLAYER_START[1]);

    const bMat = new StandardMaterial('bMat', scene);
    bMat.diffuseColor  = new Color3(1, 0.68, 0.1);
    bMat.emissiveColor = new Color3(0.35, 0.2, 0.02);
    const body = MeshBuilder.CreateCylinder('body', { height: 0.75, diameter: 0.46, tessellation: 12 }, scene);
    body.parent = playerRoot; body.position.y = 0.38; body.material = bMat;

    const hMat = new StandardMaterial('hMat', scene);
    hMat.diffuseColor  = new Color3(1, 0.88, 0.32);
    hMat.emissiveColor = new Color3(0.4, 0.3, 0.05);
    const head = MeshBuilder.CreateSphere('head', { diameter: 0.44, segments: 10 }, scene);
    head.parent = playerRoot; head.position.y = 1.0; head.material = hMat;

    const eyeMat = new StandardMaterial('eyeMat', scene);
    eyeMat.emissiveColor = new Color3(0.2, 0.82, 1.0);
    [-0.1, 0.1].forEach((ex, ei) => {
      const eye = MeshBuilder.CreateSphere(`eye${ei}`, { diameter: 0.08, segments: 6 }, scene);
      eye.parent = playerRoot; eye.position.set(ex, 1.05, 0.2); eye.material = eyeMat;
    });

    const legMat = new StandardMaterial('legMat', scene);
    legMat.diffuseColor  = new Color3(0.55, 0.38, 0.05);
    legMat.emissiveColor = new Color3(0.09, 0.06, 0.01);
    const legL = MeshBuilder.CreateBox('legL', { width: 0.16, height: 0.38, depth: 0.16 }, scene);
    legL.parent = playerRoot; legL.position.set(-0.13, 0.0, 0); legL.material = legMat;
    const legR = legL.clone('legR');
    legR.parent = playerRoot; legR.position.set(0.13, 0.0, 0);

    const legAnimL = new Animation('legLA', 'position.y', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    legAnimL.setKeys([{ frame: 0, value: 0 }, { frame: 8, value: 0.12 }, { frame: 16, value: 0 }]);
    const legAnimR = new Animation('legRA', 'position.y', 30,
      Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
    legAnimR.setKeys([{ frame: 0, value: 0.12 }, { frame: 8, value: 0 }, { frame: 16, value: 0.12 }]);
    legL.animations = [legAnimL]; legR.animations = [legAnimR];

    // Aura
    const aMat = new StandardMaterial('aMat', scene);
    aMat.diffuseColor = new Color3(1, 0.7, 0.1);
    aMat.emissiveColor = new Color3(0.3, 0.18, 0);
    aMat.alpha = 0.18;
    const aura = MeshBuilder.CreateSphere('aura', { diameter: 0.9, segments: 8 }, scene);
    aura.parent = playerRoot; aura.position.y = 0.5; aura.material = aMat;

    // ── Intro: animate door open after 0.6s ─────────────────────────────────
    let legMoving = false;
    const introTimer = setTimeout(() => {
      // Slide door up
      const slideUp = new Animation('doorUp', 'position.y', 60,
        Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
      slideUp.setKeys([
        { frame: 0,  value: 1.6 },
        { frame: 50, value: WH + 0.6 },
      ]);
      door.animations = [slideUp];
      scene.beginAnimation(door, 0, 50, false, 1, () => {
        doorOpenedRef.current = true;
        setPhase('playing');
      });
      lock.isVisible = false;
    }, 700);

    // ── Render loop ─────────────────────────────────────────────────────────
    const SPEED = 0.075;
    engine.runRenderLoop(() => {
      const keys = keysRef.current;
      const joy  = joystickRef.current;
      const pos  = playerPosRef.current;

      let dx = 0, dz = 0;
      if (keys.has('w') || keys.has('arrowup'))    dz += 1;
      if (keys.has('s') || keys.has('arrowdown'))  dz -= 1;
      if (keys.has('a') || keys.has('arrowleft'))  dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (joy) { dx += joy.dx; dz += joy.dz; }

      const mag = Math.sqrt(dx * dx + dz * dz);
      const moving = mag > 0.04;
      if (moving) { dx /= mag; dz /= mag; }

      if (moving) {
        pos.x = Math.max(-RW/2 + 0.85, Math.min(RW/2 - 0.85, pos.x + dx * SPEED));
        pos.z = Math.max(-RD/2 + 0.85, Math.min(RD/2 - 0.85, pos.z + dz * SPEED));
        playerRoot.rotation.y = Math.atan2(dx, dz);
        if (!legMoving) {
          legMoving = true;
          scene.beginAnimation(legL, 0, 16, true);
          scene.beginAnimation(legR, 0, 16, true);
        }
      } else if (legMoving) {
        legMoving = false;
        scene.stopAnimation(legL); scene.stopAnimation(legR);
        legL.position.y = 0; legR.position.y = 0;
      }

      playerRoot.position.set(pos.x, 0, pos.z);
      cam.target = Vector3.Lerp(cam.target, new Vector3(pos.x, 0, pos.z), 0.07);

      // Proximity: only the active node triggers interaction
      const active = activeNodeIdxRef.current;
      let near: number | null = null;
      if (active < NODE_XZ.length) {
        const [nx, nz] = NODE_XZ[active];
        const dist = Math.hypot(pos.x - nx, pos.z - nz);
        if (dist < 2.0) near = active;
      }
      if (near !== nearIdxRef.current) {
        nearIdxRef.current = near;
        const lesson = near !== null ? (room.lessons[near] ?? null) : null;
        setNearLesson(lesson);
      }

      // E to interact
      if (keys.has('e') && near !== null) {
        keys.delete('e');
        const lesson = room.lessons[near];
        if (lesson) setTimeout(() => onSelectLessonRef.current(lesson), 0);
      }

      scene.render();
    });

    const onKD = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const onKU = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(introTimer);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Virtual joystick ─────────────────────────────────────────────────────
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
    const maxR = 44;
    const dist = Math.min(Math.hypot(rawDx, rawDy), maxR);
    const angle = Math.atan2(rawDy, rawDx);
    const kx = Math.cos(angle) * dist, ky = Math.sin(angle) * dist;
    setJoyVis({ cx: joyStartRef.current.x, cy: joyStartRef.current.y, kx, ky });
    joystickRef.current = { dx: kx / maxR, dz: -(ky / maxR) };
  };
  const handleTouchEnd = () => {
    joyStartRef.current = null; joystickRef.current = null; setJoyVis(null);
  };

  const totalLessons = Math.min(room.lessons.length, NODE_XZ.length);
  const stationLabel = activeNodeIdx < totalLessons
    ? `תחנה ${activeNodeIdx + 1} / ${totalLessons}`
    : '🎉 כל התחנות הושלמו!';

  const completedCount = room.lessons
    .slice(0, NODE_XZ.length)
    .filter(l => lessonIsDone(l, progress.completedCases)).length;

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden',
               background: '#07030e', touchAction: 'none', userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* ── Intro overlay ── */}
      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexDirection: 'column', gap: 16,
                      background: 'rgba(7,3,14,0.55)', backdropFilter: 'blur(2px)',
                      fontFamily: 'Heebo,sans-serif', color: '#fff', direction: 'rtl',
                      pointerEvents: 'none' }}>
          <div style={{ fontSize: '2.2rem' }}>{room.icon}</div>
          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#c084fc',
                        textShadow: '0 0 20px rgba(180,80,255,0.8)' }}>
            {room.titleHe}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(200,170,255,0.7)', marginTop: 4 }}>
            הדלת נפתחת…
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%',
                                    background: '#a855f7',
                                    animation: `er3dDot 1s ease ${i * 0.25}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* ── HUD top bar ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(to bottom, rgba(7,2,18,0.92), transparent)',
                    direction: 'rtl', gap: 8 }}>
        <div style={{ color: '#c084fc', fontFamily: 'Heebo,sans-serif', fontWeight: 800,
                      fontSize: '1rem', textShadow: '0 0 12px rgba(180,80,255,0.65)',
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {room.icon} {room.titleHe}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#a0d4ff', fontFamily: 'Heebo,sans-serif', fontSize: '0.78rem',
                         background: 'rgba(60,100,200,0.18)', border: '1px solid rgba(80,140,255,0.28)',
                         borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap' }}>
            ✅ {completedCount}/{totalLessons}
          </span>
          <span style={{ color: '#e0b0ff', fontFamily: 'Heebo,sans-serif', fontWeight: 700,
                         fontSize: '0.82rem', background: 'rgba(168,85,247,0.14)',
                         border: '1px solid rgba(168,85,247,0.32)', borderRadius: 20, padding: '3px 9px' }}>
            🪙 {coins}
          </span>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.85)',
                     border: '1px solid rgba(255,255,255,0.16)', padding: '5px 12px',
                     borderRadius: 20, cursor: 'pointer', fontFamily: 'Heebo,sans-serif',
                     fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            ← חזרה
          </button>
        </div>
      </div>

      {/* ── Station progress banner ── */}
      {phase === 'playing' && (
        <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(40,10,80,0.88)', border: '1px solid rgba(160,80,255,0.35)',
                      borderRadius: 20, padding: '5px 18px', fontFamily: 'Heebo,sans-serif',
                      color: '#d090ff', fontSize: '0.8rem', fontWeight: 700, direction: 'rtl',
                      whiteSpace: 'nowrap', backdropFilter: 'blur(6px)' }}>
          {stationLabel}
        </div>
      )}

      {/* ── Near-lesson interaction prompt ── */}
      {phase === 'playing' && nearLesson && (
        <div style={{ position: 'absolute', bottom: 115, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(50,12,100,0.95)', backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(160,60,255,0.55)', color: '#fff',
                      fontFamily: 'Heebo,sans-serif', padding: '14px 22px', borderRadius: 16,
                      textAlign: 'center', direction: 'rtl', minWidth: 230,
                      boxShadow: '0 0 30px rgba(140,40,255,0.4)', animation: 'er3dPop .25s ease' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 1.5,
                        color: 'rgba(200,140,255,0.65)', textTransform: 'uppercase', marginBottom: 4 }}>
            תחנה {activeNodeIdx + 1}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 8 }}>{nearLesson.title}</div>
          <button onClick={() => onSelectLesson(nearLesson)}
            style={{ background: 'linear-gradient(135deg,#6010a8,#a030e8)', color: '#fff',
                     border: 'none', borderRadius: 10, padding: '9px 22px', cursor: 'pointer',
                     fontFamily: 'Heebo,sans-serif', fontWeight: 800, fontSize: '0.9rem',
                     boxShadow: '0 4px 16px rgba(140,30,220,0.55)', width: '100%' }}>
            כנס לשיעור ←
          </button>
          <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'rgba(190,140,255,0.4)' }}>
            מקלדת: E
          </div>
        </div>
      )}

      {/* ── Done overlay ── */}
      {phase === 'done' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)',
                      background: 'rgba(4, 28, 10, 0.97)', border: '2px solid #28e060',
                      color: '#28e060', fontFamily: 'Heebo,sans-serif', padding: '30px 38px',
                      borderRadius: 20, textAlign: 'center', direction: 'rtl',
                      boxShadow: '0 0 50px rgba(40,220,90,0.45)',
                      animation: 'er3dPop .4s cubic-bezier(.16,1,.3,1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: 8 }}>פצחת את החדר!</div>
          <div style={{ fontSize: '0.88rem', color: 'rgba(80,255,120,0.72)', marginBottom: 22 }}>
            עברת את כל {totalLessons} התחנות — הדרך פתוחה!
          </div>
          <button onClick={onBack}
            style={{ background: 'linear-gradient(135deg,#16904a,#30c868)', color: '#fff',
                     border: 'none', borderRadius: 12, padding: '13px 30px',
                     cursor: 'pointer', fontFamily: 'Heebo,sans-serif',
                     fontWeight: 800, fontSize: '1.05rem',
                     boxShadow: '0 4px 20px rgba(40,180,80,0.5)' }}>
            סיים חדר ←
          </button>
        </div>
      )}

      {/* ── Virtual joystick ── */}
      {joyVis && (
        <div style={{ position: 'absolute', pointerEvents: 'none',
                      left: joyVis.cx - 44, top: joyVis.cy - 44,
                      width: 88, height: 88, borderRadius: '50%',
                      background: 'rgba(150,70,255,0.14)',
                      border: '2px solid rgba(175,95,255,0.42)' }}>
          <div style={{ position: 'absolute',
                        left: 44 + joyVis.kx - 16, top: 44 + joyVis.ky - 16,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(205,135,255,0.82)',
                        boxShadow: '0 0 10px rgba(195,95,255,0.65)' }} />
        </div>
      )}

      {/* ── Mobile interact button ── */}
      {phase === 'playing' && nearLesson && (
        <button onClick={() => onSelectLesson(nearLesson)}
          style={{ position: 'absolute', bottom: 28, right: 22, width: 68, height: 68,
                   borderRadius: '50%', background: 'linear-gradient(135deg,#6010a8,#b030f0)',
                   border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   cursor: 'pointer', fontSize: '1.6rem',
                   boxShadow: '0 0 22px rgba(170,55,255,0.7)',
                   animation: 'er3dPulse 1.2s ease infinite' }}>
          ⚡
        </button>
      )}

      {/* ── Walk tip ── */}
      {phase === 'playing' && !nearLesson && activeNodeIdx < totalLessons && (
        <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                      color: 'rgba(160,120,220,0.5)', fontFamily: 'Heebo,sans-serif',
                      fontSize: '0.75rem', whiteSpace: 'nowrap', direction: 'rtl', pointerEvents: 'none' }}>
          🕹️ לך לעמוד המאיר (תחנה {activeNodeIdx + 1}) כדי לפתוח את השיעור
        </div>
      )}

      {/* ── Controls guide ── */}
      <div style={{ position: 'absolute', bottom: 14, left: 14,
                    color: 'rgba(170,140,210,0.35)', fontFamily: 'Heebo,sans-serif',
                    fontSize: '0.68rem', direction: 'rtl', lineHeight: 1.65, pointerEvents: 'none' }}>
        <div>תנועה: WASD / חצים</div>
        <div>כניסה: E</div>
      </div>

      <style>{`
        @keyframes er3dPop {
          from { opacity:0; transform:translate(-50%,-50%) scale(.88); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
        @keyframes er3dPulse {
          0%,100% { box-shadow:0 0 22px rgba(170,55,255,.7); transform:scale(1); }
          50%     { box-shadow:0 0 36px rgba(195,80,255,.95); transform:scale(1.09); }
        }
        @keyframes er3dDot {
          0%,100% { transform:translateY(0); opacity:.5; }
          50%     { transform:translateY(-6px); opacity:1; }
        }
      `}</style>
    </div>
  );
}
