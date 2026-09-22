import { Html, Sky, useTexture } from '@react-three/drei';
import { CuboidCollider, CapsuleCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { createContext, useContext, memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { getDistrictTheme, type DistrictTheme } from './districts';

export type ControlState = Record<string, boolean>;

export interface SceneSignals {
  elapsed: number;
  posterActive: boolean;
  billboardActive: boolean;
  paused: boolean;
  awareness: number;
  wantedLevel: number;
  pursuitActive: boolean;
}

interface SceneProps {
  posterUrl: string;
  district: string;
  alias: string;
  lifestyle: string;
  controls: MutableRefObject<ControlState>;
  cameraYaw: MutableRefObject<number>;
  cameraPitch: MutableRefObject<number>;
  signals: SceneSignals;
  onNearPoster: (near: boolean) => void;
  onPosition: (x: number, z: number, heading: number) => void;
  onRecognize: (id: string, role: string, influencer: boolean) => void;
  onPoliceDetect: (visible: boolean, caught: boolean, officer: string) => void;
  onReady: () => void;
}

type Box2D = { x: number; z: number; w: number; d: number };


const POSTERS: [number, number][] = [[10.7, -36], [-10.7, -10], [7, 17], [13.5, 37.4]];
const NPCS = [
  { id: 'racer', role: 'STREET RACER', color: '#e55b91', skin: '#8f513b', variant: 0, speed: 1.3, influencer: false, path: [[-6, 28], [-6, 10], [-8, -8], [-4, 16]] },
  { id: 'influencer', role: 'INFLUENCER', color: '#8d73ff', skin: '#c78363', variant: 1, speed: 1.05, influencer: true, path: [[-8, 4], [-6, -12], [-7, -27], [-5, -5]] },
  { id: 'worker', role: 'SHOP WORKER', color: '#85c99b', skin: '#70402f', variant: 2, speed: .9, influencer: false, path: [[8, 28], [7, 12], [9, 2], [7, 20]] },
  { id: 'guest-a', role: 'CLUB VISITOR', color: '#ffb079', skin: '#d59b7b', variant: 3, speed: 1.15, influencer: false, path: [[-8, -8], [-7, -20], [-9, -31], [-5, -18]] },
  { id: 'guest-b', role: 'CLUB VISITOR', color: '#50d8e8', skin: '#9b6048', variant: 4, speed: 1.1, influencer: false, path: [[-5, -30], [-8, -14], [-6, 2], [-7, -20]] },
  { id: 'local-a', role: 'LOCAL', color: '#d8b868', skin: '#bd7c5e', variant: 5, speed: 1.0, influencer: false, path: [[6, 34], [8, 18], [5, 4], [7, 24]] },
  { id: 'local-b', role: 'LOCAL', color: '#ce6f64', skin: '#63382e', variant: 1, speed: .95, influencer: false, path: [[4, -4], [7, -22], [6, -40], [8, -18]] },
  { id: 'mechanic', role: 'MECHANIC', color: '#73a9db', skin: '#d3a17f', variant: 2, speed: .85, influencer: false, path: [[-12, 21], [-9, 34], [-6, 25], [-10, 14]] },
  { id: 'harbor', role: 'HARBOR WORKER', color: '#db8c4d', skin: '#83503b', variant: 4, speed: .9, influencer: false, path: [[8, -40], [5, -52], [-2, -59], [7, -47]] },
] as const;

const q = new THREE.Quaternion();
const e = new THREE.Euler();

function segmentHitsBox(ax: number, az: number, bx: number, bz: number, box: Box2D) {
  const minX = box.x - box.w / 2 - .25;
  const maxX = box.x + box.w / 2 + .25;
  const minZ = box.z - box.d / 2 - .25;
  const maxZ = box.z + box.d / 2 + .25;
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dz = bz - az;
  for (const [p, lo, hi] of [[dx, minX - ax, maxX - ax], [dz, minZ - az, maxZ - az]] as const) {
    if (Math.abs(p) < 1e-5) { if (lo > 0 || hi < 0) return false; continue; }
    const a = lo / p;
    const b = hi / p;
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
    if (t0 > t1) return false;
  }
  return t1 > .06 && t0 < .94;
}

const BlockersContext = createContext<Map<string, Box2D>>(new Map());
function hasLineOfSight(ax: number, az: number, bx: number, bz: number, blockers: Map<string, Box2D>) {
  return !Array.from(blockers.values()).some((box) => segmentHitsBox(ax, az, bx, bz, box));
}

const Humanoid = memo(function Humanoid({ color, skin = '#b9785d', police = false, variant = 0, moving }: { color: string; skin?: string; police?: boolean; variant?: number; moving?: MutableRefObject<boolean> }) {
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, delta) => {
    const active = moving?.current ?? false;
    const swing = active ? Math.sin(clock.elapsedTime * 9 + variant * .7) * .5 : 0;
    if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.damp(leftArm.current.rotation.x, swing, 12, delta);
    if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.damp(rightArm.current.rotation.x, -swing, 12, delta);
    if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.damp(leftLeg.current.rotation.x, -swing * .7, 12, delta);
    if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.damp(rightLeg.current.rotation.x, swing * .7, 12, delta);
  });
  return <group>
    <mesh castShadow position={[0, 1.58, 0]}><sphereGeometry args={[.19, 18, 14]} /><meshStandardMaterial color={police ? '#c99478' : skin} roughness={.72} /></mesh>
    {variant % 3 === 0 && <mesh castShadow position={[0, 1.72, -.02]} scale={[1, .55, 1]}><sphereGeometry args={[.195, 16, 10]} /><meshStandardMaterial color="#171419" roughness={.9} /></mesh>}
    {variant % 3 === 1 && <mesh castShadow position={[0, 1.73, -.02]}><cylinderGeometry args={[.2, .16, .12, 14]} /><meshStandardMaterial color="#251a24" roughness={.88} /></mesh>}
    {variant % 3 === 2 && <mesh castShadow position={[0, 1.76, 0]} rotation={[.08, 0, 0]}><sphereGeometry args={[.205, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#0f1116" roughness={.92} /></mesh>}
    <mesh castShadow position={[0, 1.32, 0]}><cylinderGeometry args={[.1, .1, .16, 10]} /><meshStandardMaterial color={police ? '#c99478' : skin} roughness={.72} /></mesh>
    <mesh castShadow position={[0, 1.03, 0]} scale={[1, 1, .72]}><capsuleGeometry args={[.27, .48, 6, 10]} /><meshStandardMaterial color={color} roughness={.58} metalness={.04} /></mesh>
    <mesh ref={leftLeg} castShadow position={[-.17, .37, 0]}><capsuleGeometry args={[.09, .53, 5, 9]} /><meshStandardMaterial color={police ? '#14263f' : variant % 2 ? '#e7d4bc' : '#171a22'} roughness={.7} /></mesh>
    <mesh ref={rightLeg} castShadow position={[.17, .37, 0]}><capsuleGeometry args={[.09, .53, 5, 9]} /><meshStandardMaterial color={police ? '#14263f' : variant % 2 ? '#e7d4bc' : '#171a22'} roughness={.7} /></mesh>
    <mesh castShadow position={[-.17, .065, .06]}><boxGeometry args={[.22, .13, .39]} /><meshStandardMaterial color="#090b10" roughness={.55} /></mesh>
    <mesh castShadow position={[.17, .065, .06]}><boxGeometry args={[.22, .13, .39]} /><meshStandardMaterial color="#090b10" roughness={.55} /></mesh>
    <mesh ref={leftArm} castShadow position={[-.35, 1.04, 0]} rotation={[0, 0, -.09]}><capsuleGeometry args={[.065, .5, 5, 9]} /><meshStandardMaterial color={color} roughness={.62} /></mesh>
    <mesh ref={rightArm} castShadow position={[.35, 1.04, 0]} rotation={[0, 0, .09]}><capsuleGeometry args={[.065, .5, 5, 9]} /><meshStandardMaterial color={color} roughness={.62} /></mesh>
    {variant === 1 && <mesh castShadow position={[.37, .9, -.08]} rotation={[0, 0, -.1]}><boxGeometry args={[.1, .22, .04]} /><meshStandardMaterial color="#0b0f16" metalness={.4} roughness={.2} /></mesh>}
    {police && <><mesh position={[0, 1.12, -.205]}><boxGeometry args={[.39, .12, .055]} /><meshStandardMaterial color="#d6b35b" emissive="#7a4c16" emissiveIntensity={.8} /></mesh><mesh castShadow position={[0, 1.77, 0]}><cylinderGeometry args={[.22, .22, .07, 16]} /><meshStandardMaterial color="#17243b" roughness={.75} /></mesh></>}
  </group>;
});

function Player({ controls, cameraYaw, cameraPitch, paused, playerPosition, onNearPoster, onPosition, spawn }: Pick<SceneProps, 'controls' | 'cameraYaw' | 'cameraPitch' | 'onNearPoster' | 'onPosition'> & { paused: boolean; playerPosition: MutableRefObject<THREE.Vector3>; spawn: [number, number] }) {
  const blockers = useContext(BlockersContext);
  const body = useRef<RapierRigidBody>(null);
  const model = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const nearRef = useRef(false);
  const syncClock = useRef(0);
  const movingRef = useRef(false);
  const targetCamera = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb) return;
    const pos = rb.translation();
    if (pos.y < -3) { rb.setTranslation({ x: spawn[0], y: .84, z: spawn[1] }, true); rb.setLinvel({ x: 0, y: 0, z: 0 }, true); return; }
    playerPosition.current.set(pos.x, pos.y, pos.z);
    const current = rb.linvel();
    let x = 0;
    let z = 0;
    if (!paused) {
      if (controls.current.w || controls.current.arrowup) z += 1;
      if (controls.current.s || controls.current.arrowdown) z -= 1;
      if (controls.current.a || controls.current.arrowleft) x -= 1;
      if (controls.current.d || controls.current.arrowright) x += 1;
    }
    const moving = x !== 0 || z !== 0;
    movingRef.current = moving;
    if (moving) {
      const length = Math.hypot(x, z);
      x /= length; z /= length;
      const yaw = cameraYaw.current;
      const forwardX = -Math.sin(yaw);
      const forwardZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);
      const moveX = forwardX * z + rightX * x;
      const moveZ = forwardZ * z + rightZ * x;
      const speed = controls.current.shift ? 6.4 : 3.7;
      rb.setLinvel({ x: moveX * speed, y: current.y, z: moveZ * speed }, true);
      if (model.current) {
        const angle = Math.atan2(moveX, moveZ);
        e.set(0, angle, 0); q.setFromEuler(e);
        model.current.quaternion.slerp(q, 1 - Math.exp(-delta * 12));
        model.current.position.y = -.8 + Math.abs(Math.sin(performance.now() * .009)) * .025;
      }
    } else {
      rb.setLinvel({ x: 0, y: current.y, z: 0 }, true);
      if (model.current) model.current.position.y = THREE.MathUtils.damp(model.current.position.y, -.8, 12, delta);
    }

    const runPullback = controls.current.shift && moving ? 1 : 0;
    const distance = 6.2 + runPullback;
    const horizontal = Math.cos(cameraPitch.current) * distance;
    const shoulderX = Math.cos(cameraYaw.current) * .48;
    const shoulderZ = -Math.sin(cameraYaw.current) * .48;
    targetCamera.set(pos.x + Math.sin(cameraYaw.current) * horizontal + shoulderX, pos.y + 1.62 + Math.sin(cameraPitch.current) * 3.8, pos.z + Math.cos(cameraYaw.current) * horizontal + shoulderZ);
    if (Array.from(blockers.values()).some((box) => targetCamera.x > box.x - box.w / 2 && targetCamera.x < box.x + box.w / 2 && targetCamera.z > box.z - box.d / 2 && targetCamera.z < box.z + box.d / 2)) {
      targetCamera.lerp(new THREE.Vector3(pos.x, pos.y + 1.8, pos.z), .55);
    }
    camera.position.lerp(targetCamera, 1 - Math.exp(-delta * 7));
    targetLook.set(pos.x, pos.y + .78, pos.z);
    camera.lookAt(targetLook);

    syncClock.current += delta;
    if (syncClock.current > .12) {
      syncClock.current = 0;
      const near = POSTERS.some(([px, pz]) => Math.hypot(pos.x - px, pos.z - pz) < 3.1);
      if (near !== nearRef.current) { nearRef.current = near; onNearPoster(near); }
      onPosition(pos.x, pos.z, model.current?.rotation.y || 0);
    }
  });

  return <RigidBody ref={body} position={[spawn[0], .84, spawn[1]]} colliders={false} enabledRotations={[false, false, false]} linearDamping={12} angularDamping={12} friction={1.2} gravityScale={1.35} canSleep={false} ccd>
    <CapsuleCollider args={[.46, .34]} friction={1.2} restitution={0} />
    <mesh position={[0, -.795, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}><circleGeometry args={[.42, 24]} /><meshBasicMaterial color="#05060a" transparent opacity={.48} depthWrite={false} /></mesh>
    <group ref={model} position={[0, -.8, 0]}><Humanoid color="#d43f72" skin="#a9654b" variant={0} moving={movingRef} /><mesh castShadow position={[0, 1.03, -.22]}><boxGeometry args={[.34, .48, .09]} /><meshStandardMaterial color="#141a28" metalness={.12} roughness={.5} /></mesh><mesh position={[0, 1.05, -.272]}><planeGeometry args={[.17, .22]} /><meshStandardMaterial color="#26c6d9" emissive="#126474" emissiveIntensity={.45} /></mesh></group>
  </RigidBody>;
}

function Poster({ url, position, rotation = [0, 0, 0], scale = [1.35, 1.82] }: { url: string; position: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number] }) {
  const texture = useTexture(url);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; texture.needsUpdate = true; }, [texture]);
  return <group position={position} rotation={rotation}>
    <mesh position={[0, 0, -.025]} castShadow><boxGeometry args={[scale[0] + .1, scale[1] + .1, .055]} /><meshStandardMaterial color="#d8cfbe" roughness={.95} /></mesh>
    <mesh position={[0, 0, .012]}><planeGeometry args={scale} /><meshStandardMaterial map={texture} roughness={.88} metalness={0} /></mesh>
  </group>;
}

function PosterStand({ url, position, rotation = 0 }: { url: string; position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}><mesh castShadow position={[0, 1.45, -.08]}><boxGeometry args={[1.72, 2.3, .13]} /><meshStandardMaterial color="#202630" metalness={.45} roughness={.52} /></mesh><mesh castShadow position={[-.62, .55, -.1]}><boxGeometry args={[.1, 1.1, .1]} /><meshStandardMaterial color="#242a32" metalness={.7} /></mesh><mesh castShadow position={[.62, .55, -.1]}><boxGeometry args={[.1, 1.1, .1]} /><meshStandardMaterial color="#242a32" metalness={.7} /></mesh><Poster url={url} position={[0, 1.48, .01]} scale={[1.35, 1.82]} /></group>;
}

function Building({ position, size, color, label, neon = '#ff668e' }: { position: [number, number, number]; size: [number, number, number]; color: string; label: string; neon?: string }) {
  const blockers = useContext(BlockersContext);
  useEffect(() => { const key = position.join(','); blockers.set(key, { x: position[0], z: position[2], w: size[0], d: size[2] }); return () => { blockers.delete(key); }; }, [blockers, position[0], position[2], size[0], size[2]]);
  const [w, h, d] = size;
  const windows = useMemo(() => Array.from({ length: Math.max(4, Math.floor(h / 2.8)) }, (_, row) => Array.from({ length: Math.max(2, Math.floor(w / 4)) }, (_, col) => [(-w / 2 + 1.7) + col * 3.4, 1.6 + row * 2.5] as const)).flat(), [w, h]);
  return <RigidBody type="fixed" colliders={false} position={position}>
    <CuboidCollider args={[w / 2, h / 2, d / 2]} />
    <mesh castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.84} metalness={.08} /></mesh>
    {windows.map(([x, y], i) => <mesh key={i} position={[x, y - h / 2, d / 2 + .012]}><planeGeometry args={[1.3, .8]} /><meshStandardMaterial color={i % 4 ? '#20394c' : '#b36f55'} emissive={i % 4 ? '#153c55' : '#e68a55'} emissiveIntensity={i % 4 ? .35 : .7} roughness={.35} /></mesh>)}
    <Html transform position={[0, Math.min(h / 2 - 1.2, 3.3), d / 2 + .08]} distanceFactor={13} occlude="blending"><div className="world-sign" style={{ color: neon, borderColor: neon }}>{label}</div></Html>
  </RigidBody>;
}

function DistrictArchitecture({ theme }: { theme: DistrictTheme }) {
  const l = theme.landmarks;
  if (theme.layout === 'luxury') return <>
    <Building position={[-25, 17, -25]} size={[19, 34, 20]} color="#30384c" label={l[0]} neon={theme.accent} />
    <Building position={[24, 8, -31]} size={[24, 16, 28]} color="#e5d8c8" label={l[1]} neon={theme.secondary} />
    <Building position={[-24, 11, 27]} size={[22, 22, 22]} color="#46536a" label={l[2]} neon={theme.accent} />
    <Building position={[27, 21, 25]} size={[18, 42, 20]} color="#3b4358" label={l[3]} neon={theme.secondary} />
    <Building position={[-28, 7, -56]} size={[25, 14, 16]} color="#d1c4b3" label={l[4]} neon={theme.accent} />
    <mesh position={[19, .14, 8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[13, 7]} /><meshStandardMaterial color="#25aeca" emissive="#147a92" emissiveIntensity={.35} roughness={.12} metalness={.18} /></mesh>
    {[-29, -24, -19].map((x) => <group key={x} position={[x, 0, 45]}><mesh position={[0, .08, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.4, 20]} /><meshStandardMaterial color="#e9d3a2" roughness={1} /></mesh><mesh position={[0, 1.25, 0]}><cylinderGeometry args={[.05, .05, 2.5, 8]} /><meshStandardMaterial color="#ddd" /></mesh><mesh position={[0, 2.5, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[1.2, .6, 16]} /><meshStandardMaterial color={theme.accent} roughness={.7} /></mesh></group>)}
  </>;
  if (theme.layout === 'nightlife') return <>
    <Building position={[-18, 9, -14]} size={[12, 18, 30]} color="#321b37" label={l[0]} neon={theme.accent} />
    <Building position={[19, 14, -20]} size={[15, 28, 28]} color="#36243d" label={l[1]} neon={theme.secondary} />
    <Building position={[-21, 7, 28]} size={[16, 14, 22]} color="#29233c" label={l[2]} neon={theme.secondary} />
    <Building position={[22, 8, 26]} size={[17, 16, 24]} color="#352341" label={l[3]} neon={theme.accent} />
    <Building position={[-20, 12, -54]} size={[17, 24, 19]} color="#2b2034" label={l[4]} neon={theme.accent} />
    {[-36, -12, 12, 36].map((z, i) => <group key={z} position={[0, 0, z]}><mesh position={[-5.3, 4.6, 0]}><boxGeometry args={[.22, 9.2, .22]} /><meshStandardMaterial color="#30333c" metalness={.8} /></mesh><mesh position={[5.3, 4.6, 0]}><boxGeometry args={[.22, 9.2, .22]} /><meshStandardMaterial color="#30333c" metalness={.8} /></mesh><mesh position={[0, 8.8, 0]}><boxGeometry args={[10.8, .22, .22]} /><meshStandardMaterial color={i % 2 ? theme.accent : theme.secondary} emissive={i % 2 ? theme.accent : theme.secondary} emissiveIntensity={2} /></mesh></group>)}
    <mesh position={[0, .13, 0]}><boxGeometry args={[1.3, .22, 120]} /><meshStandardMaterial color="#272735" roughness={.52} /></mesh>
  </>;
  if (theme.layout === 'marina') return <>
    <Building position={[-25, 5, -22]} size={[24, 10, 20]} color="#eee1d0" label={l[0]} neon={theme.accent} />
    <Building position={[24, 4, -26]} size={[19, 8, 18]} color="#d6c7b8" label={l[1]} neon={theme.secondary} />
    <Building position={[-25, 4.5, 27]} size={[21, 9, 19]} color="#ead7c1" label={l[2]} neon={theme.secondary} />
    <Building position={[24, 5.5, 30]} size={[20, 11, 20]} color="#c9b9ad" label={l[3]} neon={theme.accent} />
    <Building position={[-28, 7, -54]} size={[26, 14, 16]} color="#e2d3c5" label={l[4]} neon={theme.accent} />
    <mesh position={[33, .1, 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 92]} /><meshStandardMaterial color={theme.water} emissive={theme.water} emissiveIntensity={.25} roughness={.16} metalness={.32} /></mesh>
    {[-28, -8, 12, 32].map((z) => <group key={z} position={[18, .18, z]}><mesh><boxGeometry args={[13, .28, 1.5]} /><meshStandardMaterial color="#856f55" roughness={.8} /></mesh><mesh position={[5.5, .2, -2]} rotation={[0, .15, 0]}><boxGeometry args={[4.2, .55, 1.7]} /><meshStandardMaterial color="#f2eee5" metalness={.2} roughness={.4} /></mesh></group>)}
  </>;
  if (theme.layout === 'barrio') return <>
    <Building position={[-17, 4.5, -15]} size={[12, 9, 22]} color="#b45d51" label={l[0]} neon={theme.accent} />
    <Building position={[17, 5, -18]} size={[13, 10, 20]} color="#d39a62" label={l[1]} neon={theme.secondary} />
    <Building position={[-19, 4, 26]} size={[15, 8, 18]} color="#568078" label={l[2]} neon={theme.secondary} />
    <Building position={[19, 5.5, 26]} size={[14, 11, 19]} color="#7e5b86" label={l[3]} neon={theme.accent} />
    <Building position={[-21, 5, -52]} size={[17, 10, 17]} color="#b8774f" label={l[4]} neon={theme.accent} />
    <mesh position={[0, .11, 8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[9, 32]} /><meshStandardMaterial color="#796a5b" roughness={.9} /></mesh>
    {[-6, -2, 2, 6].map((x, i) => <group key={x} position={[x, 0, 7 + (i % 2) * 5]}><mesh castShadow position={[0, 1.25, 0]}><boxGeometry args={[2.6, .14, 1.7]} /><meshStandardMaterial color={i % 2 ? '#f09a55' : '#61b48b'} roughness={.7} /></mesh><mesh position={[0, .62, 0]}><boxGeometry args={[2.3, 1.1, 1.4]} /><meshStandardMaterial color="#5b463a" roughness={.9} /></mesh></group>)}
  </>;
  if (theme.layout === 'downtown') return <>
    <Building position={[-23, 23, -22]} size={[17, 46, 23]} color="#263044" label={l[0]} neon={theme.accent} />
    <Building position={[22, 28, -29]} size={[18, 56, 26]} color="#202b3f" label={l[1]} neon={theme.secondary} />
    <Building position={[-25, 19, 29]} size={[20, 38, 22]} color="#30384c" label={l[2]} neon={theme.secondary} />
    <Building position={[25, 24, 29]} size={[19, 48, 21]} color="#252c40" label={l[3]} neon={theme.accent} />
    <Building position={[-26, 16, -56]} size={[22, 32, 17]} color="#33364a" label={l[4]} neon={theme.accent} />
    <mesh position={[0, .12, 10]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[32, 26]} /><meshStandardMaterial color="#414652" roughness={.62} metalness={.15} /></mesh>
    {[-33, 10, 49].map((z) => <group key={z} position={[0, 7, z]}><mesh position={[-8, 0, 0]}><boxGeometry args={[.35, 14, .35]} /><meshStandardMaterial color="#373d49" metalness={.8} /></mesh><mesh position={[8, 0, 0]}><boxGeometry args={[.35, 14, .35]} /><meshStandardMaterial color="#373d49" metalness={.8} /></mesh><mesh position={[0, 6.7, 0]}><boxGeometry args={[16, .35, .35]} /><meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={1.5} /></mesh></group>)}
  </>;
  if (theme.layout === 'industrial') return <>
    <Building position={[-25, 5.5, -24]} size={[28, 11, 27]} color="#403436" label={l[0]} neon={theme.accent} />
    <Building position={[27, 6, -30]} size={[27, 12, 34]} color="#393638" label={l[1]} neon={theme.secondary} />
    <Building position={[-27, 4.5, 29]} size={[26, 9, 20]} color="#443b38" label={l[2]} neon={theme.secondary} />
    <Building position={[27, 7, 29]} size={[25, 14, 22]} color="#3c3433" label={l[3]} neon={theme.accent} />
    <Building position={[-27, 5, -56]} size={[24, 10, 17]} color="#362e31" label={l[4]} neon={theme.accent} />
    {[-37, -30, 28, 36].map((x) => <mesh key={x} castShadow position={[x, 2.2, 48]}><cylinderGeometry args={[2.4, 2.8, 4.4, 18]} /><meshStandardMaterial color="#4d5053" metalness={.68} roughness={.48} /></mesh>)}
    {[-5, 0, 5].map((x) => <group key={x} position={[x, 0, -8]}><mesh position={[0, .35, 0]}><cylinderGeometry args={[.42, .42, .25, 14]} /><meshStandardMaterial color="#0b0c0e" roughness={.85} /></mesh><mesh position={[0, .65, 0]}><cylinderGeometry args={[.42, .42, .25, 14]} /><meshStandardMaterial color="#0b0c0e" roughness={.85} /></mesh></group>)}
  </>;
  return <>
    <Building position={[-22, 7.5, -18]} size={[18, 15, 25]} color="#292738" label={l[0]} neon={theme.accent} />
    <Building position={[22, 6.5, -29]} size={[18, 13, 30]} color="#25323a" label={l[1]} neon={theme.secondary} />
    <Building position={[-24, 6, 25]} size={[20, 12, 24]} color="#292e39" label={l[2]} neon={theme.secondary} />
    <Building position={[24, 5.5, 28]} size={[18, 11, 20]} color="#35303a" label={l[3]} neon={theme.accent} />
    <Building position={[-25, 7, -53]} size={[20, 14, 18]} color="#342c3b" label={l[4]} neon={theme.accent} />
  </>;
}

function DistrictRoad({ theme }: { theme: DistrictTheme }) {
  const asphalt = '#11141b';
  const line = theme.layout === 'industrial' ? '#e7a24b' : '#d8cfaa';
  if (theme.layout === 'luxury') return <>
    <mesh receiveShadow position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[13, 138]} /><meshStandardMaterial color="#20242b" roughness={.36} metalness={.24} /></mesh>
    <mesh receiveShadow position={[0, .024, 18]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[100, 12]} /><meshStandardMaterial color="#20242b" roughness={.4} metalness={.2} /></mesh>
    {[-8, 8].map((x) => <mesh key={x} receiveShadow position={[x, .13, 0]}><boxGeometry args={[3, .25, 140]} /><meshStandardMaterial color="#d7d0c5" roughness={.75} /></mesh>)}
    <mesh position={[0, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.14, 132]} /><meshBasicMaterial color={line} /></mesh>
  </>;
  if (theme.layout === 'nightlife') return <>
    <mesh receiveShadow position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, 140]} /><meshStandardMaterial color="#11121a" roughness={.32} metalness={.32} /></mesh>
    <mesh position={[0, .14, 0]}><boxGeometry args={[1.25, .25, 136]} /><meshStandardMaterial color="#30263a" roughness={.55} /></mesh>
    {[-4.8, 4.8].map((x) => <mesh key={x} position={[x, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.12, 132]} /><meshBasicMaterial color={theme.accent} transparent opacity={.72} /></mesh>)}
    {[-10.5, 10.5].map((x) => <mesh key={x} receiveShadow position={[x, .13, 0]}><boxGeometry args={[3, .25, 140]} /><meshStandardMaterial color="#6c6575" roughness={.68} /></mesh>)}
  </>;
  if (theme.layout === 'marina') return <>
    <mesh receiveShadow position={[0, .018, 15]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[11, 110]} /><meshStandardMaterial color="#25272a" roughness={.55} metalness={.15} /></mesh>
    <mesh receiveShadow position={[0, .023, -7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[7, 12, 48]} /><meshStandardMaterial color="#25272a" roughness={.55} metalness={.15} /></mesh>
    <mesh position={[0, .15, -7]}><cylinderGeometry args={[7, 7, .28, 48]} /><meshStandardMaterial color="#587158" roughness={.92} /></mesh>
    {[-7, 7].map((x) => <mesh key={x} receiveShadow position={[x, .13, 20]}><boxGeometry args={[3, .25, 105]} /><meshStandardMaterial color="#cfbea7" roughness={.8} /></mesh>)}
  </>;
  if (theme.layout === 'barrio') return <>
    <mesh receiveShadow position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 138]} /><meshStandardMaterial color="#29282a" roughness={.78} metalness={.04} /></mesh>
    <mesh receiveShadow position={[0, .022, 8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[76, 9]} /><meshStandardMaterial color="#2c2a2a" roughness={.8} /></mesh>
    {[-6, 6].map((x) => <mesh key={x} receiveShadow position={[x, .13, 0]}><boxGeometry args={[3, .25, 140]} /><meshStandardMaterial color="#8b7967" roughness={.92} /></mesh>)}
    {Array.from({ length: 12 }, (_, i) => -58 + i * 10).map((z) => <mesh key={z} position={[0, .04, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.1, 4.5]} /><meshBasicMaterial color="#c4ae7f" /></mesh>)}
  </>;
  if (theme.layout === 'downtown') return <>
    <mesh receiveShadow position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[15, 140]} /><meshStandardMaterial color={asphalt} roughness={.4} metalness={.22} /></mesh>
    <mesh receiveShadow position={[0, .022, 10]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[110, 15]} /><meshStandardMaterial color={asphalt} roughness={.4} metalness={.22} /></mesh>
    {[-9, 9].map((x) => <mesh key={x} receiveShadow position={[x, .14, 0]}><boxGeometry args={[3, .28, 140]} /><meshStandardMaterial color="#686d75" roughness={.7} /></mesh>)}
    {[-3.6, 3.6].map((x) => <mesh key={x} position={[x, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.12, 134]} /><meshBasicMaterial color={line} /></mesh>)}
  </>;
  if (theme.layout === 'industrial') return <>
    <mesh receiveShadow position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16, 140]} /><meshStandardMaterial color="#151619" roughness={.65} metalness={.12} /></mesh>
    <mesh receiveShadow position={[-17, .02, -10]} rotation={[-Math.PI / 2, 0, -.22]}><planeGeometry args={[45, 12]} /><meshStandardMaterial color="#17181b" roughness={.7} /></mesh>
    {[-5, 5].map((x) => <mesh key={x} position={[x, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.15, 134]} /><meshBasicMaterial color={line} /></mesh>)}
    {[-10, 10].map((x) => <mesh key={x} receiveShadow position={[x, .13, 0]}><boxGeometry args={[3, .25, 140]} /><meshStandardMaterial color="#5d5853" roughness={.9} /></mesh>)}
  </>;
  return <>
    <mesh receiveShadow position={[0, .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[11, 138]} /><meshStandardMaterial color="#141721" roughness={.42} metalness={.25} /></mesh>
    <mesh receiveShadow position={[0, .02, 10]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[92, 10]} /><meshStandardMaterial color="#161820" roughness={.45} metalness={.22} /></mesh>
    {[-7.1, 7.1].map((x) => <mesh key={x} receiveShadow position={[x, .12, 0]}><boxGeometry args={[3.2, .24, 140]} /><meshStandardMaterial color="#777d82" roughness={.82} /></mesh>)}
    {[-2.6, 2.6].map((x) => <mesh key={x} position={[x, .032, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.12, 132]} /><meshStandardMaterial color="#b2a276" emissive="#6b5d39" emissiveIntensity={.18} roughness={.7} /></mesh>)}
  </>;
}

function StreetLamp({ position, color = '#ffcf83' }: { position: [number, number, number]; color?: string }) {
  return <group position={position}><mesh castShadow position={[0, 2.6, 0]}><cylinderGeometry args={[.08, .11, 5.2, 8]} /><meshStandardMaterial color="#222934" metalness={.75} roughness={.35} /></mesh><mesh position={[0, 5.15, 0]}><sphereGeometry args={[.2, 10, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.3} /></mesh><pointLight position={[0, 4.7, 0]} color={color} intensity={12} distance={10} decay={2} /></group>;
}

function Palm({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <group position={position} scale={scale}><mesh castShadow position={[0, 2.3, 0]} rotation={[0, 0, -.07]}><cylinderGeometry args={[.14, .24, 4.6, 8]} /><meshStandardMaterial color="#654937" roughness={1} /></mesh>{[0, 1, 2, 3, 4].map((i) => <mesh key={i} castShadow position={[0, 4.6, 0]} rotation={[0, i * 1.25, .9]}><coneGeometry args={[.32, 2.4, 7]} /><meshStandardMaterial color="#1f594c" roughness={.88} /></mesh>)}</group>;
}

function Car({ position, rotation = 0, color = '#7c2841', police = false }: { position: [number, number, number]; rotation?: number; color?: string; police?: boolean }) {
  return <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotation, 0]}><CuboidCollider args={[1.05, .55, 2.15]} position={[0, .55, 0]} /><group><mesh castShadow position={[0, .55, 0]}><boxGeometry args={[2.05, .65, 4.2]} /><meshStandardMaterial color={police ? '#e4e7e9' : color} metalness={.58} roughness={.3} /></mesh><mesh castShadow position={[0, 1.03, -.2]}><boxGeometry args={[1.7, .62, 2.15]} /><meshStandardMaterial color="#152331" metalness={.72} roughness={.18} /></mesh>{[-.92, .92].flatMap((x) => [-1.32, 1.32].map((z) => <mesh key={`${x}-${z}`} castShadow position={[x, .35, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.35, .35, .22, 12]} /><meshStandardMaterial color="#101216" roughness={.8} /></mesh>))}{police && <PoliceLights />}</group></RigidBody>;
}

function PoliceLights() {
  const red = useRef<THREE.PointLight>(null);
  const blue = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { const pulse = Math.sin(clock.elapsedTime * 10) > 0; if (red.current) red.current.intensity = pulse ? 18 : 1; if (blue.current) blue.current.intensity = pulse ? 1 : 18; });
  return <><mesh position={[-.35, 1.4, 0]}><boxGeometry args={[.5, .12, .18]} /><meshStandardMaterial color="#ff263f" emissive="#ff263f" emissiveIntensity={2} /></mesh><mesh position={[.35, 1.4, 0]}><boxGeometry args={[.5, .12, .18]} /><meshStandardMaterial color="#277dff" emissive="#277dff" emissiveIntensity={2} /></mesh><pointLight ref={red} color="#ff263f" position={[-.45, 1.6, 0]} distance={12} decay={2} /><pointLight ref={blue} color="#277dff" position={[.45, 1.6, 0]} distance={12} decay={2} /></>;
}

function Container({ position, color, rotation = 0 }: { position: [number, number, number]; color: string; rotation?: number }) {
  return <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotation, 0]}><CuboidCollider args={[1.25, 1.3, 3]} /><mesh castShadow receiveShadow><boxGeometry args={[2.5, 2.6, 6]} /><meshStandardMaterial color={color} metalness={.52} roughness={.62} /></mesh>{[-.9, -.45, 0, .45, .9].map((x) => <mesh key={x} position={[x, 0, 3.01]}><boxGeometry args={[.05, 2.35, .03]} /><meshStandardMaterial color="#15222a" /></mesh>)}</RigidBody>;
}

function BusStop() {
  return <RigidBody type="fixed" colliders={false} position={[7, 0, 17]}><CuboidCollider args={[1.8, 1.3, .12]} position={[0, 1.3, -.08]} /><group><mesh castShadow position={[0, 1.45, -.16]}><boxGeometry args={[3.8, 2.9, .14]} /><meshStandardMaterial color="#25313c" metalness={.65} roughness={.3} /></mesh><mesh position={[0, 1.45, -.07]}><planeGeometry args={[3.5, 2.58]} /><meshStandardMaterial color="#487182" transparent opacity={.28} metalness={.55} roughness={.15} /></mesh><mesh castShadow position={[0, .42, .45]}><boxGeometry args={[2.8, .12, .65]} /><meshStandardMaterial color="#3b424a" metalness={.6} roughness={.5} /></mesh><mesh castShadow position={[0, 3, 0]}><boxGeometry args={[4.1, .18, 1.15]} /><meshStandardMaterial color="#202832" metalness={.7} roughness={.35} /></mesh></group></RigidBody>;
}

function Checkpoint() {
  return <group position={[13, 0, 39]}>
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[1.8, 1.5, 1.6]} position={[3.7, 1.5, 0]} /><mesh castShadow position={[3.7, 1.5, 0]}><boxGeometry args={[3.6, 3, 3.2]} /><meshStandardMaterial color="#293341" roughness={.8} /></mesh><mesh position={[3.7, 2.05, -1.61]}><planeGeometry args={[2.4, .7]} /><meshStandardMaterial color="#446a7c" emissive="#18465c" emissiveIntensity={.55} /></mesh><Html transform position={[3.7, 2.8, -1.68]} distanceFactor={11}><div className="world-sign" style={{ color: '#e7eef2', borderColor: '#e74747' }}>VMPD CHECKPOINT</div></Html></RigidBody>
    {[-3.2, 0, 3.2].map((x) => <RigidBody key={x} type="fixed" colliders={false} position={[x, .62, -2.2]}><CuboidCollider args={[1.25, .32, .22]} /><mesh castShadow><boxGeometry args={[2.5, .65, .45]} /><meshStandardMaterial color="#eee5d8" roughness={.75} /></mesh><mesh position={[0, 0, .23]}><planeGeometry args={[2.3, .42]} /><meshBasicMaterial color="#dd4a4a" /></mesh></RigidBody>)}
    {[-4.5, -1.6, 1.5, 4.5].map((x) => <mesh key={x} castShadow position={[x, .45, -3.1]}><coneGeometry args={[.23, .9, 10]} /><meshStandardMaterial color="#e66d39" roughness={.8} /></mesh>)}
  </group>;
}

function Water({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (group.current) group.current.position.y = -.32 + Math.sin(clock.elapsedTime * .45) * .06; });
  return <group ref={group}><mesh receiveShadow position={[0, -.3, -90]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[180, 55, 20, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.32} roughness={.18} metalness={.3} transparent opacity={.94} /></mesh>{[-32, -10, 17, 42].map((x, i) => <mesh key={x} position={[x, -.25 + i * .01, -87 - i * 3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, .12]} /><meshBasicMaterial color={i % 2 ? '#ea7a86' : '#40cfe0'} transparent opacity={.35} /></mesh>)}</group>;
}

function Civilian({ data, playerPosition, posterActive, onRecognize, paused, alias }: { paused: boolean; alias: string; data: typeof NPCS[number]; playerPosition: MutableRefObject<THREE.Vector3>; posterActive: boolean; onRecognize: SceneProps['onRecognize'] }) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const moving = useRef(false);
  const target = useRef(1);
  const decision = useRef(0);
  const reacted = useRef(false);
  const [speech, setSpeech] = useState('');
  const points = data.path;
  const blockers = useContext(BlockersContext);
  useFrame((_, delta) => {
    const rb = body.current;
    const node = visual.current;
    if (!rb || !node || paused) { moving.current = false; return; }
    const position = rb.translation();
    const velocity = rb.linvel();
    const [tx, tz] = points[target.current];
    const dx = tx - position.x;
    const dz = tz - position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < .35) target.current = (target.current + 1) % points.length;
    else if (!speech) {
      rb.setLinvel({ x: dx / dist * data.speed, y: velocity.y, z: dz / dist * data.speed }, true);
      node.rotation.y = THREE.MathUtils.damp(node.rotation.y, Math.atan2(dx, dz), 9, delta);
      moving.current = true;
    } else { rb.setLinvel({ x: 0, y: velocity.y, z: 0 }, true); moving.current = false; }
    decision.current += delta;
    if (decision.current < .2 || reacted.current || !posterActive) return;
    decision.current = 0;
    const player = playerPosition.current;
    const range = data.influencer ? 8.5 : 6.2;
    const pd = Math.hypot(player.x - position.x, player.z - position.z);
    if (pd < range && hasLineOfSight(position.x, position.z, player.x, player.z, blockers)) {
      reacted.current = true;
      moving.current = false;
      rb.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
      node.rotation.y = Math.atan2(player.x - position.x, player.z - position.z);
      setSpeech(data.influencer ? `PHOTO TAKEN — that is ${alias}.` : data.id === 'racer' ? 'I saw you on the city feed.' : 'Wait… I saw that poster.');
      onRecognize(data.id, data.role, data.influencer);
      window.setTimeout(() => setSpeech(''), 4200);
    }
  });
  return <RigidBody ref={body} position={[points[0][0], .82, points[0][1]]} colliders={false} enabledRotations={[false, false, false]} linearDamping={9} angularDamping={10} friction={1.1} restitution={0} mass={.85} canSleep={false} ccd>
    <CapsuleCollider args={[.46, .34]} friction={1.1} restitution={0} />
    <group ref={visual} position={[0, -.8, 0]}><Humanoid color={data.color} skin={data.skin} variant={data.variant} moving={moving} />{speech && <Html center position={[0, 2.15, 0]} distanceFactor={10}><div className="npc-speech"><b>!</b>{speech}</div></Html>}</group>
  </RigidBody>;
}

function PoliceOfficer({ position, playerPosition, active, awareness, onDetect, paused, pursuitActive }: { paused: boolean; pursuitActive: boolean; position: [number, number, number]; playerPosition: MutableRefObject<THREE.Vector3>; active: boolean; awareness: number; onDetect: SceneProps['onPoliceDetect'] }) {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const moving = useRef(false);
  const timer = useRef(0);
  const blockers = useContext(BlockersContext);
  const officer = position.join(',');
  useFrame((_, delta) => {
    const rb = body.current;
    const node = visual.current;
    if (!rb || !node || !active || paused) { moving.current = false; return; }
    const position = rb.translation();
    const velocity = rb.linvel();
    const player = playerPosition.current;
    const dx = player.x - position.x;
    const dz = player.z - position.z;
    const dist = Math.hypot(dx, dz);
    if (pursuitActive && dist > 2.2) {
      rb.setLinvel({ x: dx / dist * 2.15, y: velocity.y, z: dz / dist * 2.15 }, true);
      node.rotation.y = THREE.MathUtils.damp(node.rotation.y, Math.atan2(dx, dz), 8, delta);
      moving.current = true;
    } else { rb.setLinvel({ x: 0, y: velocity.y, z: 0 }, true); node.rotation.y += delta * .16; moving.current = false; }
    timer.current += delta;
    if (timer.current < .18) return;
    timer.current = 0;
    const forwardX = Math.sin(node.rotation.y);
    const forwardZ = Math.cos(node.rotation.y);
    const dot = dist ? (forwardX * dx + forwardZ * dz) / dist : 1;
    const visible = dist < 17 && dot > .28 && hasLineOfSight(position.x, position.z, player.x, player.z, blockers);
    onDetect(visible, pursuitActive && dist < 2.35 && hasLineOfSight(position.x, position.z, player.x, player.z, blockers), officer);
  });
  if (!active) return null;
  return <RigidBody ref={body} position={[position[0], .82, position[2]]} colliders={false} enabledRotations={[false, false, false]} linearDamping={10} angularDamping={10} friction={1.2} restitution={0} mass={1.05} canSleep={false} ccd>
    <CapsuleCollider args={[.46, .34]} friction={1.2} restitution={0} />
    <group ref={visual} position={[0, -.8, 0]}><Humanoid color="#243d62" skin="#a86e52" police variant={2} moving={moving} /><Html center position={[0, 2.05, 0]} distanceFactor={12}><div className="npc-tag police">VMPD</div></Html></group>
  </RigidBody>;
}

function Billboard({ posterUrl, active, ad, accent }: { posterUrl: string; active: boolean; ad: string; accent: string }) {
  const texture = useTexture(posterUrl);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; }, [texture]);
  useFrame(({ clock }) => { if (material.current && active) material.current.emissiveIntensity = 1.1 + Math.max(0, Math.sin(clock.elapsedTime * 18)) * .45; });
  return <group position={[0, 0, -65]}><mesh castShadow position={[0, 6.5, 0]}><boxGeometry args={[10.4, 6.2, .45]} /><meshStandardMaterial color="#202630" metalness={.62} roughness={.32} /></mesh><mesh position={[0, 6.5, .24]}><planeGeometry args={[9.7, 5.5]} />{active ? <meshStandardMaterial ref={material} map={texture} emissive={accent} emissiveIntensity={1.2} roughness={.42} /> : <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.72} roughness={.5} />}</mesh>{!active && <Html transform position={[0, 6.5, .28]} distanceFactor={10}><div className="billboard-ad"><small>VICE COAST PRESENTS</small>{ad}</div></Html>}<mesh castShadow position={[-3.6, 2.8, 0]}><boxGeometry args={[.38, 5.6, .38]} /><meshStandardMaterial color="#2d333c" metalness={.7} /></mesh><mesh castShadow position={[3.6, 2.8, 0]}><boxGeometry args={[.38, 5.6, .38]} /><meshStandardMaterial color="#2d333c" metalness={.7} /></mesh></group>;
}

function World({ posterUrl, district, alias, signals, playerPosition, onRecognize, onPoliceDetect }: Pick<SceneProps, 'posterUrl' | 'district' | 'alias' | 'signals' | 'onRecognize' | 'onPoliceDetect'> & { playerPosition: MutableRefObject<THREE.Vector3> }) {
  const theme = getDistrictTheme(district);
  return <>
    <Sky distance={450000} sunPosition={[-48, 8, -90]} inclination={.51} azimuth={.16} turbidity={10} rayleigh={3.2} mieCoefficient={.01} mieDirectionalG={.87} />
    <fog attach="fog" args={[theme.fog, 52, 150]} />
    <hemisphereLight color={theme.secondary} groundColor={theme.fog} intensity={1.32} />
    <ambientLight intensity={.4} color="#9b89c4" />
    <directionalLight castShadow position={[-35, 35, 18]} color="#ff9a70" intensity={3.1} shadow-mapSize={[1536, 1536]} shadow-bias={-.00015} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70} />
    <pointLight position={[-34, 12, -65]} color={theme.accent} intensity={55} distance={50} decay={2} />
    <pointLight position={[-10, 6, -14]} color={theme.accent} intensity={30} distance={22} decay={2} />
    <pointLight position={[12, 5, -42]} color={theme.secondary} intensity={24} distance={20} decay={2} />

    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[55, .25, 72]} position={[0, -.25, 0]} /><mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[110, 144]} /><meshStandardMaterial color={theme.ground} roughness={.92} metalness={.02} /></mesh></RigidBody>
    <DistrictRoad theme={theme} />
    {['harbor', 'nightlife'].includes(theme.layout) && [-3.8, 3.4].map((x, i) => <mesh key={`wet-${x}`} position={[x, .028, i ? -16 : 23]} rotation={[-Math.PI / 2, 0, i ? .08 : -.05]}><planeGeometry args={[2.6, 17]} /><meshStandardMaterial color="#22273a" emissive={i ? '#123442' : '#3f1734'} emissiveIntensity={.22} roughness={.12} metalness={.38} transparent opacity={.52} /></mesh>)}
    {Array.from({ length: 8 }, (_, i) => -4.1 + i * 1.18).map((x) => <mesh key={x} position={[x, .04, 10]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.72, 7.8]} /><meshBasicMaterial color="#d9d4c4" /></mesh>)}

    <DistrictArchitecture theme={theme} />

    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[55, 1.1, .5]} position={[0, 1.1, -71]} /><CuboidCollider args={[.5, 1.1, 72]} position={[-55, 1.1, 0]} /><CuboidCollider args={[.5, 1.1, 72]} position={[55, 1.1, 0]} /><CuboidCollider args={[22, 1.1, .5]} position={[-33, 1.1, 71]} /><CuboidCollider args={[22, 1.1, .5]} position={[33, 1.1, 71]} /></RigidBody>
    <Water color={theme.water} />
    {[-48, -30, -12, 12, 30, 48].map((z, i) => <StreetLamp key={`l${z}`} position={[-9.2, 0, z]} color={i < 3 ? '#ff92c0' : '#ffd18b'} />)}
    {[-41, -22, -3, 18, 39, 56].map((z, i) => <StreetLamp key={`r${z}`} position={[9.2, 0, z]} color={i < 2 ? '#71ddea' : '#ffd18b'} />)}
    {[-47, -29, -4, 22, 49].map((z, i) => <Palm key={z} position={[i % 2 ? 10.8 : -10.8, 0, z]} scale={.86 + (i % 3) * .07} />)}
    <Car position={[-3.5, 0, 21]} rotation={0} color="#b23b5d" /><Car position={[3.5, 0, -18]} rotation={Math.PI} color="#345a79" /><Car position={[-4, 0, -42]} color="#d87938" /><Car position={[22, 0, 43]} rotation={Math.PI / 2} color="#4b5666" />
    {signals.elapsed >= 14 && <Car position={[5.2, 0, 49]} rotation={Math.PI} police />}
    <BusStop />{['harbor', 'industrial', 'downtown'].includes(theme.layout) && <Checkpoint />}
    {['harbor', 'industrial'].includes(theme.layout) && <><Container position={[35, 1.3, -49]} color="#a64b42" /><Container position={[39, 1.3, -43]} color="#35727a" rotation={Math.PI / 2} /><Container position={[35, 3.9, -49]} color="#4a5f7d" /></>}

    {signals.posterActive && <><PosterStand url={posterUrl} position={[10.7, 0, -36]} rotation={-Math.PI / 2} /><PosterStand url={posterUrl} position={[-10.7, 0, -10]} rotation={Math.PI / 2} /><Poster url={posterUrl} position={[7, 1.65, 17]} /><PosterStand url={posterUrl} position={[13.5, 0, 37.4]} rotation={Math.PI} /></>}
    <Billboard posterUrl={posterUrl} active={signals.billboardActive} ad={theme.billboard} accent={theme.accent} />
    {NPCS.map((data) => <Civilian paused={signals.paused} alias={alias} key={data.id} data={data} playerPosition={playerPosition} posterActive={signals.posterActive} onRecognize={onRecognize} />)}
    <PoliceOfficer paused={signals.paused} pursuitActive={signals.pursuitActive} position={[8, 0, 46]} playerPosition={playerPosition} active={signals.elapsed >= 14} awareness={signals.awareness} onDetect={onPoliceDetect} />
    {signals.wantedLevel >= 4 && <PoliceOfficer paused={signals.paused} pursuitActive={signals.pursuitActive} position={[10, 0, 33]} playerPosition={playerPosition} active={signals.elapsed >= 20} awareness={signals.awareness} onDetect={onPoliceDetect} />}

    {Array.from({ length: 18 }, (_, i) => {
      const x = -85 + (i % 9) * 21;
      const z = -112 - Math.floor(i / 9) * 22;
      const h = 18 + (i * 7 % 28);
      return <mesh key={i} position={[x, h / 2 - 1, z]}><boxGeometry args={[12, h, 12]} /><meshStandardMaterial color={i % 3 === 0 ? '#262a3b' : '#1d2632'} emissive={i % 4 === 0 ? '#292047' : '#101720'} emissiveIntensity={.25} roughness={.9} /></mesh>;
    })}
  </>;
}

export function NeonHarborScene(props: SceneProps) {
  const theme = getDistrictTheme(props.district);
  const playerPosition = useRef(new THREE.Vector3(theme.spawn[0], 1, theme.spawn[1]));
  const blockers = useMemo(() => new Map<string, Box2D>(), []);
  useEffect(() => { props.onReady(); }, [props.onReady]);
  return <BlockersContext.Provider value={blockers}><Physics paused={props.signals.paused} gravity={[0, -9.81, 0]} timeStep="vary">
    <World alias={props.alias} posterUrl={props.posterUrl} district={props.district} signals={props.signals} playerPosition={playerPosition} onRecognize={props.onRecognize} onPoliceDetect={props.onPoliceDetect} />
    <Player controls={props.controls} cameraYaw={props.cameraYaw} cameraPitch={props.cameraPitch} paused={props.signals.paused} playerPosition={playerPosition} spawn={theme.spawn} onNearPoster={props.onNearPoster} onPosition={props.onPosition} />
  </Physics></BlockersContext.Provider>;
}
