import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Brush, ChevronDown, Crosshair, Eye, Gauge, MapPin, Pause, Play, Radio, RotateCcw, ShieldAlert, Smartphone, Target, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { useCharacterStore } from '../store/characterStore';
import type { DistrictOutcome } from '../types/character';
import { NeonHarborScene, type ControlState, type LiveSignals, type MotionTelemetry } from './NeonHarborScene';
import { getDistrictTheme } from './districts';
import './game.css';
import { advanceAwareness, responseActive, type PoliceDetection, type ReportedLocation, type Point } from './police';
import { autoBoost } from './movement';
import { awarenessJump, callsPolice, type WitnessReport } from './witness';
import { addTag, makeTag, makeTagCanvas, MAX_TAGS, paintableSurface, type FocusTarget, type SurfaceHit, type Tag } from './tags';
import { applyDamage, canReload, fire, GUNSHOT_AWARENESS, holster, HOLSTERED, MAGAZINE, PLAYER_HEALTH, POLICE_ARM_DELAY, POLICE_DAMAGE, regenerate, reload, tickWeapon, type WeaponState } from './weapon';
import { DistrictMinimap } from './DistrictMinimap';
import { ViceImageEditor, type ViceEditorHandle } from '../components/editor/ViceImageEditor';
import { WALLS, WALL_REPORT_DELAY, closestWall, isPublicSurface, signalTarget, makeWallCanvas, nearbyWall, targetedWall, wallResponseReady, type WallId, type SignalIntent, type StreetSignal } from './walls';

interface Props { onContinue: () => void; onReturn: () => void; }

const EMPTY_POSTER = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="700"%3E%3Crect width="100%25" height="100%25" fill="%23151a25"/%3E%3Ctext x="50%25" y="50%25" fill="%23ff7466" text-anchor="middle" font-family="sans-serif" font-size="42"%3EWANTED%3C/text%3E%3C/svg%3E';

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2')) || Boolean(canvas.getContext('webgl'));
  } catch { return false; }
}

export function ViceDistrictGame({ onContinue, onReturn }: Props) {
  const { character, cityState: currentCity, completeDistrict } = useCharacterStore();
  const c = useRef(character).current;
  const cityState = useRef(currentCity).current;
  const controls = useRef<ControlState>({});
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(.18);
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const recognized = useRef(new Set<string>());
  const completed = useRef(false);
  const pursuitTriggered = useRef(false);
  const detections = useRef(new Map<string, PoliceDetection & { at: number }>());
  const graceRemaining = useRef(0);
  const contactSeconds = useRef(0);
  const reportSequence = useRef(0);
  const [report, setReport] = useState<ReportedLocation | null>(null);
  const [surfaceImages, setSurfaceImages] = useState<Record<string, string>>({});
  const [wallOpen, setWallOpen] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [aimSurface, setAimSurface] = useState<SurfaceHit | null>(null);
  const tagSequence = useRef(0);
  const [weapon, setWeapon] = useState<WeaponState>(HOLSTERED);
  const [fireToken, setFireToken] = useState(0);
  const [officersDown, setOfficersDown] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [civiliansDown, setCiviliansDown] = useState(0);
  const weaponRef = useRef(weapon); weaponRef.current = weapon;
  const live = useRef<LiveSignals>({ awareness: 0, weapon: HOLSTERED, playerMoving: false, playerCrouching: false, fireToken: 0 });
  const [health, setHealth] = useState(PLAYER_HEALTH);
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const [underFire, setUnderFire] = useState(0);
  const lastHit = useRef(0);
  const [downed, setDowned] = useState(false);
  const [wallSource, setWallSource] = useState('');
  const [wallReady, setWallReady] = useState(false);
  const [wallNotice, setWallNotice] = useState('');
  const [signalIntent, setSignalIntent] = useState<SignalIntent>('mark');
  const [streetSignal, setStreetSignal] = useState<StreetSignal | null>(null);
  const wallEditor = useRef<ViceEditorHandle>(null);
  const [wallAge, setWallAge] = useState<number | null>(null);
  const [wallPainting, setWallPainting] = useState(false);
  const liveStroke = useRef('');
  const wallIncident = useRef<Point | null>(null);
  const dispatched = useRef(false);
  const crimeCommitted = useRef(false);
  const responseEnabled = responseActive(wallResponseReady(wallAge), shotsFired);
  const responseRef = useRef(responseEnabled); responseRef.current = responseEnabled;
  const wallAgeRef = useRef(wallAge); wallAgeRef.current = wallAge;
  const [awarenessReason, setAwarenessReason] = useState('PATROL SEARCH');
  const [webgl] = useState(hasWebGL);
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState(true);
  const [tutorial, setTutorial] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [nearPoster, setNearPoster] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 900);
  const [lastSurface, setLastSurface] = useState<'poster' | string>('poster');
  const boostAnnounced = useRef(false);
  const [posterEditing, setPosterEditing] = useState(false);
  const [livePoster, setLivePoster] = useState<string | null>(null);
  const posterEditor = useRef<ViceEditorHandle>(null);
  const [posterReady, setPosterReady] = useState(false);
  const [posterNotice, setPosterNotice] = useState('');
  const [summary, setSummary] = useState(false);
  const [runId, setRunId] = useState(0);
  const [recognitions, setRecognitions] = useState(0);
  const [policeReports, setPoliceReports] = useState(0);
  const [awareness, setAwareness] = useState(0);
  const [pursuitActive, setPursuitActive] = useState(false);
  const [pursuitPrompt, setPursuitPrompt] = useState(false);
  const [escapeProgress, setEscapeProgress] = useState(0);
  const [captured, setCaptured] = useState(false);
  const [escaped, setEscaped] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const sceneReady = useCallback(() => setLoading(false), []);
  const [localBuzz, setLocalBuzz] = useState(cityState?.buzz || 50);
  const [playerMap, setPlayerMap] = useState({ x: 0, z: 38, heading: 0 });
  const playerPoint = useRef<Point>({ x: 0, z: 38 });
  const [motionState, setMotionState] = useState<MotionTelemetry>({ speed: 0, stamina: 100, grounded: true, sprinting: false, crouching: false });
  const [notification, setNotification] = useState({ icon: 'network', title: 'CITY ASSET SYNCED', body: `Player-created poster connected to ${c.district}.` });

  const posterUrl = livePoster || c.wantedPosterImage || c.editedImage || c.originalImage || EMPTY_POSTER;
  live.current = { awareness, weapon, playerMoving: motionState.speed > 1.2, playerCrouching: motionState.crouching, fireToken };
  const escapeBoost = autoBoost(awareness, pursuitActive);
  const armedResponse = armedAt !== null && elapsed >= armedAt + POLICE_ARM_DELAY;
  const theme = getDistrictTheme(c.district);
  const posterActive = elapsed >= 3;
  const billboardActive = elapsed >= 25 || localBuzz >= 90;
  const objectiveComplete = escaped;
  const objective = pursuitActive ? 'BREAK LINE OF SIGHT - EVADE VMPD' : !crimeCommitted.current ? 'LEAVE YOUR SIGNAL ON A WALL' : wallAge === null ? 'MARK IS LIVE - NOBODY HAS SEEN IT' : !responseEnabled ? 'REPORTED - VMPD IS BEING DISPATCHED' : escaped ? 'PURSUIT ESCAPED' : 'VMPD IS INVESTIGATING YOUR MARK';
  const policeCount = c.wantedLevel >= 4 && (elapsed >= 20 || responseEnabled) ? 2 : elapsed >= 14 || responseEnabled ? 1 : 0;
  // Painting does not pause the district. Patrols keep walking, the dispatch
  // clock keeps running and the player is stood still at the wall while drawing.
  const worldPaused = paused || summary || posterEditing || posterOpen || loading || intro || tutorial || pursuitPrompt || captured;
  const nearestWall = nearbyWall(playerMap.x, playerMap.z);
  const aimedWall = targetedWall(playerMap.x, playerMap.z, playerMap.heading);
  const guideWall = closestWall(playerMap.x, playerMap.z);
  const wallDistance = Math.round(Math.hypot(guideWall.x - playerMap.x, guideWall.z - playerMap.z));
  const wallBearing = Math.atan2(guideWall.x - playerMap.x, guideWall.z - playerMap.z) - playerMap.heading;
  // Any wall id or tag id resolves to one paintable surface, so walls and
  // free-hand street tags share the same studio, camera and police response.
  const paintSurface = (id: string | null) => {
    if (!id) return null;
    const wall = WALLS.find(surface => surface.id === id);
    if (wall) return { id: wall.id, name: wall.name, kind: 'wall' as const, point: { x: wall.x - .25, y: 1.65, z: wall.z }, normal: { x: -1, y: 0, z: 0 }, standOff: 7.2 };
    const tag = tags.find(entry => entry.id === id);
    return tag ? { id: tag.id, name: 'Street surface', kind: 'tag' as const, point: { x: tag.point[0], y: tag.point[1], z: tag.point[2] }, normal: { x: tag.normal[0], y: tag.normal[1], z: tag.normal[2] }, standOff: 4.6 } : null;
  };
  const openSurface = paintSurface(wallOpen);
  const focusPoint: FocusTarget | null = useMemo(() => openSurface
    ? { x: openSurface.point.x, y: openSurface.point.y, z: openSurface.point.z, nx: openSurface.normal.x, ny: openSurface.normal.y, nz: openSurface.normal.z, standOff: openSurface.standOff }
    : null, [openSurface?.id, openSurface?.point.x, openSurface?.point.y, openSurface?.point.z]);
  const freeSurface = !nearestWall && !aimedWall && paintableSurface(aimSurface);
  const targetSurfaceId = (nearestWall || aimedWall)?.id ?? null;
  // Every surface that has paint on it, so bystanders can notice and investigate.
  const marks = useMemo(() => Object.keys(surfaceImages).map(id => {
    const surface = paintSurface(id);
    return surface ? { x: surface.point.x, z: surface.point.z } : null;
  }).filter((mark): mark is { x: number; z: number } => mark !== null), [surfaceImages, tags]);
  const activeSignal = streetSignal && elapsed < streetSignal.expires ? streetSignal : null;

  // Drawing is available for the whole run: any surface opens from the dock at
  // any moment, including mid-pursuit, without walking up to it first.
  const openWallStudio = (id: string) => {
    if (wallOpen === id) return;
    controls.current = {}; dragging.current = false;
    liveStroke.current = ''; setWallPainting(false);
    setWallSource(surfaceImages[id] || (WALLS.some(wall => wall.id === id) ? makeWallCanvas(id as WallId) : makeTagCanvas()));
    setWallReady(false); setWallNotice(''); setSignalIntent('mark'); setLastSurface(id); setWallOpen(id);
  };
  const closeWallStudio = () => { setWallOpen(null); setWallPainting(false); liveStroke.current = ''; };
  // Paint anything upright you are stood in front of: a fresh decal is pinned
  // to that exact spot and opened in the editor.
  const openFreeSurface = () => {
    if (!paintableSurface(aimSurface) || worldPaused) return;
    const id = `tag-${++tagSequence.current}`;
    setTags(list => addTag(list, makeTag(id, aimSurface)));
    openWallStudio(id);
  };
  // Where you paint decides whether anyone finds out. The three prepared walls
  // are public fixtures on the street, so painting one is reported at once even
  // if you did it from across the district. A surface you found yourself, down a
  // side street, stays quiet until somebody actually walks past it.
  const beginIncident = (id: string) => {
    const surface = paintSurface(id);
    if (!surface) return;
    wallIncident.current = signalTarget({ x: surface.point.x, z: surface.point.z }, 'mark');
    crimeCommitted.current = true;
    recognized.current.clear();
    if (isPublicSurface(id)) {
      setWallAge(0);
      setPoliceReports(value => value + 1);
      setNotification({ icon: 'police', title: 'THE STREET SAW THAT', body: `The ${surface.name.toLowerCase()} is in public view. VMPD is dispatched to it in ${WALL_REPORT_DELAY} seconds and will search the area, whether or not you are standing there.` });
      return;
    }
    setNotification({ icon: 'poster', title: 'MARK IS LIVE, UNNOTICED', body: `Your paint is on a surface off the street. Nobody has reported it. Anyone who walks past will come and read it, and will know your face afterwards.` });
  };
  const openPosterStudio = () => {
    setPosterOpen(false); setPosterReady(false); setPosterNotice(''); setLastSurface('poster'); setPosterEditing(true);
  };
  const openLastSurface = () => { if (lastSurface === 'poster') openPosterStudio(); else openWallStudio(lastSurface); };
  const openWall = () => { const surface = nearestWall || aimedWall; if (surface && !worldPaused) openWallStudio(surface.id); else openFreeSurface(); };
  const publishWall = () => {
    const instance = wallEditor.current;
    if (!wallOpen || !instance) return;
    const image = instance.exportImage();
    if (!image) { setWallNotice('Wait for the editor to load before publishing.'); return; }
    if (!instance.hasChanges()) { setWallNotice('Add text, a drawing or a sticker before leaving your mark.'); return; }
    setSurfaceImages(images => ({ ...images, [wallOpen]: image }));
    const surface = paintSurface(wallOpen);
    if (!surface) { closeWallStudio(); return; }
    wallIncident.current = signalTarget({ x: surface.point.x, z: surface.point.z }, signalIntent);
    setStreetSignal({ sequence: ++reportSequence.current, origin: { x: surface.point.x - .6, z: surface.point.z }, target: wallIncident.current, intent: signalIntent, expires: elapsed + 25 });
    if (!crimeCommitted.current) beginIncident(wallOpen);
    else if (responseEnabled) setReport({ ...wallIncident.current, sequence: ++reportSequence.current });
    closeWallStudio();
    setNotification({ icon: 'alert', title: signalIntent === 'mark' ? 'MARK LEFT ON WALL' : 'FALSE TRAIL PLANTED', body: signalIntent === 'mark' ? 'Your design is visible. Move before dispatch responds.' : 'Nearby readers follow your direction. Dispatch checks that lead after the delay, but direct sightings reveal your real position.' });
  };
  // Live paint: the editor's canvas is exported on a short cadence and pushed
  // straight onto the wall's texture, so the surface updates while drawing.
  useEffect(() => {
    if (!wallOpen || !wallReady || worldPaused) return;
    const surface = wallOpen;
    const timer = window.setInterval(() => {
      const instance = wallEditor.current;
      if (!instance || !instance.hasChanges()) return;
      const image = instance.peekImage();
      if (!image || image === liveStroke.current) return;
      const first = !liveStroke.current;
      liveStroke.current = image;
      setWallPainting(true);
      setSurfaceImages(images => ({ ...images, [surface]: image }));
      if (first && !crimeCommitted.current) beginIncident(surface);
    }, 850);
    return () => clearInterval(timer);
  }, [wallOpen, wallReady, worldPaused, tags]);

  useEffect(() => { if (captured && wallOpen) closeWallStudio(); }, [captured, wallOpen]);

  useEffect(() => {
    if (!responseEnabled || dispatched.current || !wallIncident.current) return;
    dispatched.current = true;
    setReport({ ...wallIncident.current, sequence: ++reportSequence.current });
    setPoliceReports(value => value + 1); setAwareness(value => Math.max(value, 22));
    setNotification({ icon: 'police', title: 'WALL INCIDENT DISPATCHED', body: 'Street surveillance logged the mark. VMPD is checking the reported location.' });
  }, [responseEnabled]);

  useEffect(() => {
    if (!armedResponse) return;
    setNotification({ icon: 'police', title: 'VMPD ARMED RESPONSE', body: 'Units have drawn weapons and will fire on sight. Break line of sight or put something solid between you and them.' });
  }, [armedResponse]);

  useEffect(() => {
    if (!escapeBoost) { boostAnnounced.current = false; return; }
    if (boostAnnounced.current) return;
    boostAnnounced.current = true;
    setNotification({ icon: 'alert', title: 'ESCAPE BOOST ENGAGED', body: 'Awareness is high, so you now outrun VMPD automatically with no Shift and no stamina drain. Drawing stays open the whole time.' });
  }, [escapeBoost]);

  useEffect(() => {
    if (awareness < 100 || pursuitTriggered.current) return;
    pursuitTriggered.current = true;
    setPoliceReports(v => v + 1);
    setEscaped(false);
    setPursuitActive(true);
    setPursuitPrompt(false);
    graceRemaining.current = 2;
    contactSeconds.current = 0;
    setEscapeProgress(0);
    controls.current = {};
    setNotification({ icon: 'alert', title: 'AUTO RUN ACTIVE', body: 'Move with WASD or the direction buttons. Your escape speed already exceeds police speed, so no Shift is needed. Draw and edit stay available.' });
  }, [awareness]);

  useEffect(() => {
    if (!pursuitActive || worldPaused) return;
    const timer = window.setInterval(() => {
      const seen = Array.from(detections.current.values()).some(d => d.visible && performance.now() - d.at < 700);
      setEscapeProgress(value => !seen && awarenessRef.current < 55 ? Math.min(5, value + 1) : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [pursuitActive, worldPaused]);

  useEffect(() => {
    if (!pursuitActive || escapeProgress < 5) return;
    setPursuitActive(false);
    setPursuitPrompt(false);
    setAwareness(38);
    setEscaped(true);
    pursuitTriggered.current = false;
    setNotification({ icon: 'network', title: 'LINE OF SIGHT BROKEN', body: 'VMPD search radius lost // keep moving.' });
  }, [escapeProgress, pursuitActive]);

  const pausedRef = useRef(worldPaused); pausedRef.current = worldPaused;
  const awarenessRef = useRef(awareness); awarenessRef.current = awareness;
  const elapsedRef = useRef(elapsed); elapsedRef.current = elapsed;

  useEffect(() => { if (worldPaused) { controls.current = {}; dragging.current = false; } }, [worldPaused]);
  useEffect(() => { cameraYaw.current = theme.startYaw; }, [theme.startYaw]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => setLoadFailed(true), 45000);
    const introTimer = window.setTimeout(() => setIntro(false), 4300);
    return () => { clearTimeout(loadTimer); clearTimeout(introTimer); };
  }, []);


  useEffect(() => {
    if (worldPaused) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [worldPaused]);

  useEffect(() => {
    if (elapsed === 3) setNotification({ icon: 'poster', title: 'POSTER NETWORK', body: `Physical copies detected across ${c.district}.` });
    if (elapsed === 9) { setLocalBuzz((value) => Math.min(100, value + 6)); setNotification({ icon: 'social', title: 'VICEFEED', body: 'Poster shared locally // reach accelerating.' }); }
    if (elapsed === 14) setNotification({ icon: 'police', title: 'VMPD RADIO', body: `Patrol unit entering ${c.district}.` });
    if (elapsed === 25) { setLocalBuzz((value) => Math.min(100, value + 7)); setNotification({ icon: 'network', title: 'CITY NETWORK', body: 'Identity distribution critical // billboard overridden.' }); }
  }, [elapsed, c.district]);

  // Weapon timers run in seconds so cooldown and reload never depend on frame rate.
  useEffect(() => {
    if (worldPaused || (weapon.cooldown <= 0 && weapon.reloading <= 0)) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = Math.min(.25, (now - previous) / 1000); previous = now;
      setWeapon(state => tickWeapon(state, seconds));
    }, 60);
    return () => clearInterval(timer);
  }, [worldPaused, weapon.cooldown > 0, weapon.reloading > 0]);

  const toggleWeapon = useCallback(() => {
    if (wallOpen || posterEditing) return;
    setWeapon(state => state.drawn ? holster(state) : { ...state, drawn: true });
  }, [wallOpen, posterEditing]);
  const setAiming = useCallback((value: boolean) => {
    setWeapon(state => state.drawn && state.reloading <= 0 ? { ...state, aiming: value } : state);
  }, []);
  const shoot = useCallback(() => {
    const state = weaponRef.current;
    if (!state.drawn || !state.aiming || state.reloading > 0 || state.cooldown > 0 || pausedRef.current) return;
    if (state.ammo <= 0) { setNotification({ icon: 'alert', title: 'MAGAZINE EMPTY', body: 'Press R to reload. Reloading drops your aim for two seconds.' }); return; }
    setWeapon(fire(state));
    setShotsFired(value => value + 1);
    setFireToken(value => value + 1);
    setArmedAt(value => value ?? elapsedRef.current);
  }, []);
  const reloadWeapon = useCallback(() => setWeapon(state => canReload(state) ? reload(state) : state), []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (wallOpen && event.key === 'Escape' && !event.repeat) { closeWallStudio(); return; }
      if (wallOpen || posterEditing || (event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)))) return;
      const key = event.key.toLowerCase();
      if (!worldPaused) controls.current[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'q' && !event.repeat && !summary) { event.preventDefault(); openLastSurface(); return; }
      if (key === 'g' && !event.repeat && !worldPaused) { toggleWeapon(); return; }
      if (key === 'r' && !event.repeat && !worldPaused) { reloadWeapon(); return; }
      if (key === 'f' && !worldPaused && weaponRef.current.drawn) { event.preventDefault(); if (!event.repeat) setAiming(!weaponRef.current.aiming); return; }
      if (key === 'control' && !worldPaused && weaponRef.current.aiming) { event.preventDefault(); shoot(); return; }
      if (key === 'e' && !event.repeat && !worldPaused) {
        if (nearestWall || aimedWall || freeSurface) openWall();
        else if (nearPoster) setPosterOpen(true);
      }
      if (key === 'escape' && !event.repeat && !pursuitPrompt && !captured && !summary) posterOpen ? setPosterOpen(false) : setPaused((value) => !value);
    };
    const up = (event: KeyboardEvent) => { controls.current[event.key.toLowerCase()] = false; };
    const blur = () => { controls.current = {}; setPaused(true); };
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', blur); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [nearPoster, posterOpen, worldPaused, pursuitPrompt, captured, summary, wallOpen, posterEditing, nearestWall, aimedWall, freeSurface, wallAge, pursuitActive, lastSurface, surfaceImages, toggleWeapon, reloadWeapon, setAiming, shoot]);

  // A gunshot is the loudest possible tip-off: it hands VMPD your position,
  // and hitting a bystander is treated far more seriously than hitting a unit.
  const onShot = useCallback((result: { target: string | null; kind: 'officer' | 'civilian' | null }) => {
    if (!crimeCommitted.current) { crimeCommitted.current = true; dispatched.current = true; setWallAge(WALL_REPORT_DELAY); }
    setPoliceReports(value => value + 1);
    setReport({ ...playerPoint.current, sequence: ++reportSequence.current });
    if (result.kind === 'civilian') {
      setCiviliansDown(value => value + 1);
      setAwareness(value => Math.min(100, value + GUNSHOT_AWARENESS + 25));
      setLocalBuzz(value => Math.min(100, value + 4));
      setNotification({ icon: 'alert', title: 'BYSTANDER HIT', body: 'The street is scattering and every witness is calling it in. VMPD treats this as the priority call.' });
      return;
    }
    setAwareness(value => Math.min(100, value + GUNSHOT_AWARENESS));
    if (result.kind === 'officer' && result.target) {
      setOfficersDown(value => value + 1);
      detections.current.delete(result.target);
      setNotification({ icon: 'alert', title: 'OFFICER DOWN', body: 'That unit is out of the chase for a few seconds. Every shot also pins your position for dispatch.' });
    } else setNotification({ icon: 'alert', title: 'SHOT MISSED', body: 'The round went wide, the street scattered and the noise gave away where you are standing.' });
  }, []);

  // A witness is what actually puts VMPD onto you. Recognising the face alone is
  // only gossip; someone who has seen your mark, or watched you make it, calls.
  const onRecognize = useCallback((id: string, role: string, influencer: boolean, location: Point, report: WitnessReport) => {
    if (pausedRef.current || recognized.current.has(id)) return;
    recognized.current.add(id);
    setRecognitions((value) => value + 1);
    setLocalBuzz((value) => Math.min(100, value + (influencer ? 5 : 3)));
    if (!callsPolice(report)) {
      setNotification({ icon: 'poster', title: 'A FAMILIAR FACE', body: `${role} thinks you match the poster. Suspicion on its own does not bring police.` });
      return;
    }
    setPoliceReports(value => value + 1);
    setAwareness(value => Math.min(100, value + awarenessJump(report, influencer)));
    // The first call starts the dispatch clock; later ones update the address.
    if (wallAgeRef.current === null) {
      setWallAge(0);
      wallIncident.current = { ...location };
      setNotification({ icon: 'police', title: report === 'caught' ? 'SEEN IN THE ACT' : 'WITNESS LINKED YOU TO THE MARK', body: `${role} is on the phone to VMPD. Units are dispatched in ${WALL_REPORT_DELAY} seconds. Move now.` });
      return;
    }
    if (responseRef.current) setReport({ ...location, sequence: ++reportSequence.current });
    setNotification({ icon: 'police', title: 'WITNESS TIP RECEIVED', body: `${role} gave VMPD your location.` });
  }, []);

  const onPoliceDetect = useCallback((detection: PoliceDetection, officer: string) => {
    if (pausedRef.current) return;
    detections.current.set(officer, { ...detection, at: performance.now() });
  }, []);

  // VMPD shooting back. A hit costs health; a miss still tells you where they are.
  const onPoliceFire = useCallback((result: { officer: string; hit: boolean; distance: number }) => {
    if (pausedRef.current) return;
    setUnderFire(value => value + 1);
    if (!result.hit) return;
    lastHit.current = performance.now();
    setHealth(value => {
      const next = applyDamage(value, POLICE_DAMAGE);
      if (next === 0 && value > 0) {
        controls.current = {};
        setDowned(true); setCaptured(true); setPursuitPrompt(false);
        setNotification({ icon: 'alert', title: 'YOU ARE DOWN', body: 'VMPD put you on the ground. Retry the district or accept the arrest.' });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (worldPaused || policeCount === 0 || !responseEnabled) return;
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = Math.min(.25, (now - lastTick) / 1000);
      lastTick = now;
      const fresh = Array.from(detections.current.values()).filter(d => now - d.at < 500);
      const strongest = fresh.filter(d => d.visible).sort((a, b) => b.rate - a.rate)[0];
      setAwareness(value => advanceAwareness(value, fresh, seconds, pursuitActive));
      setAwarenessReason(strongest
        ? strongest.source === 'vehicle' ? 'PATROL CAMERA: LOCATION REPORTED'
          : strongest.distance <= 2.5 ? 'CLOSE CONTACT: IDENTIFYING YOU'
          : 'OFFICER HAS VISUAL CONTACT'
        : pursuitActive ? 'SIGHT LOST: SEARCHING LAST LOCATION' : 'NO VISUAL CONTACT');
      graceRemaining.current = Math.max(0, graceRemaining.current - seconds);
      const contact = pursuitActive && graceRemaining.current === 0 && fresh.some(d => d.contact);
      contactSeconds.current = contact ? contactSeconds.current + seconds : 0;
      if (contactSeconds.current >= .65) {
        controls.current = {};
        setCaptured(true);
        setPursuitPrompt(false);
        setNotification({ icon: 'alert', title: 'APPREHENDED', body: 'VMPD reached and detained you.' });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [worldPaused, policeCount, pursuitActive, responseEnabled]);

  useEffect(() => {
    if (worldPaused || health >= PLAYER_HEALTH || health <= 0) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = Math.min(.5, (now - previous) / 1000); previous = now;
      setHealth(value => regenerate(value, (now - lastHit.current) / 1000, seconds));
    }, 250);
    return () => clearInterval(timer);
  }, [worldPaused, health >= PLAYER_HEALTH, health <= 0]);

  const onPosition = useCallback((x: number, z: number, heading: number) => { playerPoint.current = { x, z }; setPlayerMap({ x, z, heading }); }, []);
  const onMotion = useCallback((value: MotionTelemetry) => setMotionState(value), []);

  const finish = useCallback(() => {
    if (!completed.current) {
      completed.current = true;
      const outcome: DistrictOutcome = {
        completed: true,
        result: captured ? 'arrested' : escaped ? 'escaped-attention' : policeReports ? (c.wantedLevel >= 4 ? 'high-priority' : 'identity-confirmed') : localBuzz >= 90 ? 'citywide-trending' : 'escaped-attention',
        npcRecognitions: recognitions,
        policeReports,
        posterSightings: billboardActive ? 5 : Math.min(4, 1 + Math.floor(elapsed / 10)),
        heatDelta: captured ? 18 : policeReports ? 12 : 5,
        reputationDelta: Math.max(4, recognitions * 2),
        buzzDelta: Math.max(8, localBuzz - (cityState?.buzz || 50)),
        reachDelta: 2400 + recognitions * 650 + (billboardActive ? 1800 : 0),
        district: c.district,
        lastSeen: captured ? `VMPD CUSTODY / ${c.district.toUpperCase()}` : escaped ? `${c.district.toUpperCase()} / LOST PURSUIT` : policeReports ? theme.lastSeenPolice : theme.lastSeenQuiet,
      };
      completeDistrict(outcome);
    }
    setPaused(true);
    setSummary(true);
  }, [billboardActive, c.wantedLevel, captured, escaped, cityState?.buzz, completeDistrict, elapsed, localBuzz, policeReports, recognitions, theme.lastSeenPolice, theme.lastSeenQuiet]);

  const resetGame = () => {
    setPosterEditing(false); setLivePoster(null); setPosterNotice(''); setLastSurface('poster'); boostAnnounced.current = false;
    completed.current = false;
    pursuitTriggered.current = false;
    recognized.current.clear();
    detections.current.clear();
    graceRemaining.current = 0; contactSeconds.current = 0;
    setReport(null); setAwarenessReason('PATROL SEARCH');
    setSurfaceImages({}); setWallOpen(null); setWallAge(null); setStreetSignal(null); wallIncident.current = null;
    setTags([]); tagSequence.current = 0; setAimSurface(null);
    setWeapon(HOLSTERED); setFireToken(0); setOfficersDown(0); setShotsFired(0); setCiviliansDown(0);
    setHealth(PLAYER_HEALTH); setArmedAt(null); setUnderFire(0); setDowned(false); lastHit.current = 0;
    crimeCommitted.current = false; dispatched.current = false;
    setEscaped(false);
    controls.current = {};
    cameraYaw.current = theme.startYaw;
    setRunId((value) => value + 1);
    setElapsed(0); setRecognitions(0); setPoliceReports(0); setAwareness(0); setPursuitActive(false); setPursuitPrompt(false); setEscapeProgress(0); setCaptured(false); setLocalBuzz(cityState?.buzz || 50); setMotionState({ speed: 0, stamina: 100, grounded: true, sprinting: false, crouching: false }); setSummary(false); setPaused(false); setPosterOpen(false); setNearPoster(false); setIntro(true);
    window.setTimeout(() => setIntro(false), 2300);
  };

  const setControl = (key: string, value: boolean) => { if (!pausedRef.current || !value) controls.current[key] = value; };
  const controlPress = (key: string) => ({ onPointerDown: () => setControl(key, true), onPointerUp: () => setControl(key, false), onPointerCancel: () => setControl(key, false), onPointerLeave: () => setControl(key, false) });
  const pressOrigin = useRef({ x: 0, y: 0, at: 0 });
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (worldPaused || wallOpen || (event.target as HTMLElement).closest('button, .studio-dock, .wall-studio')) return;
    // The right button aims, and it is still a drag: holding it and moving
    // turns the camera. Nothing turns the camera without a button held.
    if (event.button === 2) setAiming(true);
    dragging.current = true;
    pressOrigin.current = { x: event.clientX, y: event.clientY, at: performance.now() };
    pointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) { pointer.current = { x: event.clientX, y: event.clientY }; return; }
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    pointer.current = { x: event.clientX, y: event.clientY };
    // Aiming drags at a finer rate so the reticle can be placed precisely.
    const aiming = weaponRef.current.aiming;
    cameraYaw.current -= dx * (aiming ? .0026 : .0042);
    cameraPitch.current = THREE.MathUtils.clamp(cameraPitch.current + dy * (aiming ? .0019 : .003), -.15, .55);
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const wasDragging = dragging.current;
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.button === 2) { setAiming(false); return; }
    // A click, not a drag: a short press with the reticle up is a shot.
    const travel = Math.hypot(event.clientX - pressOrigin.current.x, event.clientY - pressOrigin.current.y);
    if (wasDragging && travel < 7 && performance.now() - pressOrigin.current.at < 400 && weaponRef.current.aiming) shoot();
  };

  // The district is rebuilt only when something structural changes. Awareness,
  // stance, weapon and motion all travel by ref, so a 10Hz awareness tick no
  // longer reconciles every building in the scene.
  // The district is rebuilt only when something structural changes. Awareness,
  // stance, weapon and motion all travel by ref, so a 10Hz awareness tick no
  // longer reconciles every building in the district.
  const scene = useMemo(() => <NeonHarborScene onReady={sceneReady} key={runId} district={c.district} posterUrl={posterUrl} alias={c.alias} lifestyle={c.lifestyle} controls={controls} cameraYaw={cameraYaw} cameraPitch={cameraPitch} live={live} signals={{ elapsed, posterActive, billboardActive, paused: worldPaused, pursuitActive, report, responseEnabled, wallMarked: wallAge !== null, surfaceImages, streetSignal: activeSignal, wantedLevel: c.wantedLevel, focusSurface: wallOpen, focusPoint, targetSurface: targetSurfaceId, tags, marks, armedResponse }} onAimSurface={setAimSurface} onShot={onShot} onPoliceFire={onPoliceFire} onNearPoster={setNearPoster} onPosition={onPosition} onMotion={onMotion} onRecognize={onRecognize} onPoliceDetect={onPoliceDetect} />,
    [runId, c.district, c.alias, c.lifestyle, c.wantedLevel, posterUrl, elapsed, posterActive, billboardActive, worldPaused, pursuitActive, report, responseEnabled, wallAge !== null, surfaceImages, activeSignal, wallOpen, focusPoint, targetSurfaceId, tags, marks, armedResponse, sceneReady, onShot, onPoliceFire, onPosition, onMotion, onRecognize, onPoliceDetect]);

  const notificationIcon = useMemo(() => notification.icon === 'police' || notification.icon === 'alert' ? ShieldAlert : notification.icon === 'social' ? Smartphone : notification.icon === 'poster' ? Eye : Radio, [notification.icon]);
  const NotificationIcon = notificationIcon;

  if (!webgl || (loading && loadFailed)) return <main className="district-game webgl-fallback"><div><ShieldAlert /><p>3D DISTRICT UNAVAILABLE</p><h2>{!webgl ? 'WEBGL IS NOT AVAILABLE' : 'SCENE LOAD TIMED OUT'}</h2><span>Your city state and poster are safe. Return to City Impact to continue.</span><button className="primary coral-btn" onClick={onReturn}>RETURN TO CITY IMPACT</button></div></main>;

  return <main className="district-game"><div className="game-viewport-3d" style={{ '--district-accent': theme.accent } as React.CSSProperties} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onContextMenu={event => event.preventDefault()}>
    <div className="game-scene-layer">
    <Canvas shadows dpr={[1, 1.5]} frameloop={worldPaused && !wallOpen ? 'demand' : 'always'} camera={{ fov: 58, near: .1, far: 450, position: [.5, 3.2, 45] }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.25; gl.outputColorSpace = THREE.SRGBColorSpace; }}><color attach="background" args={[theme.fog]} /><Suspense fallback={null}>{scene}</Suspense></Canvas>
    </div>
    <div className="game-hud identity-hud"><img src={c.editedImage || c.originalImage} alt="Character identity" /><span><small>{c.district.toUpperCase()} // LIVE</small><b>{c.name} “{c.alias}”</b><em>{c.lifestyle.replace('-', ' ')}</em></span></div>
    <div className="game-hud stats-hud"><span>WANTED <b>{'★'.repeat(c.wantedLevel)}{'☆'.repeat(5 - c.wantedLevel)}</b></span><span>HEAT <b>{Math.min(100, c.heat + (policeReports ? 12 : 0))}</b></span><span>REP <b>{Math.min(100, c.reputation + recognitions * 2)}</b></span><span>BUZZ <b>{localBuzz}</b></span></div>
    <div className={`awareness-hud ${awareness >= 72 ? 'danger' : ''}`}><span>POLICE AWARENESS <b>{Math.round(awareness)}%</b></span><i><b style={{ width: `${awareness}%` }} /></i><small className="awareness-reason" role="status">{shotsFired > 0 && wallAge === null ? 'SHOTS FIRED / VMPD RESPONDING' : wallAge === null ? 'NO REPORT FILED / SUSPICION ONLY' : !responseEnabled ? `DISPATCH IN ${Math.ceil(WALL_REPORT_DELAY - wallAge)}s` : awarenessReason}</small></div>
    <div className={`motion-hud ${motionState.sprinting || escapeBoost ? 'sprinting' : ''}`}><span><small>VELOCITY</small><b>{Math.round(motionState.speed * 3.6)} <em>KM/H</em></b></span><span><small>{escapeBoost ? 'AUTO ESCAPE BOOST' : motionState.crouching ? 'CROUCHED / LOW PROFILE' : motionState.grounded ? 'TRACTION' : 'AIRBORNE'}</small><i><b style={{ width: `${motionState.stamina}%` }} /></i><em>STAMINA {Math.round(motionState.stamina)}%</em></span></div>
    {(health < PLAYER_HEALTH || armedResponse) && <div className={`health-hud ${health <= 35 ? 'critical' : ''}`}><span><small>CONDITION</small><b>{Math.round(health)}%</b></span><i><b style={{ width: `${health}%` }} /></i><small>{armedResponse ? 'VMPD FIRING ON SIGHT' : 'RECOVERING'}</small></div>}
    {underFire > 0 && <motion.div key={underFire} className="incoming-fire" initial={{ opacity: .75 }} animate={{ opacity: 0 }} transition={{ duration: .45 }} aria-hidden="true" />}
    <div className={`objective-hud ${pursuitActive ? 'pursuit' : ''}`}><small>{pursuitActive ? 'ACTIVE PURSUIT' : 'CURRENT OBJECTIVE'}</small><b>{objective}</b><i className={!pursuitActive && objectiveComplete ? 'complete' : ''}>{pursuitActive ? `${escapeProgress}/5 SECONDS HIDDEN` : objectiveComplete ? 'OBJECTIVE COMPLETE' : !crimeCommitted.current ? 'Face a surface and press E to paint.' : wallAge === null ? 'Stay out of sight. Passers by will read it.' : !responseEnabled ? `${Math.ceil(WALL_REPORT_DELAY - wallAge)} SECONDS TO DISPATCH` : 'Break sight. Find a route away from patrols.'}</i></div>
    {!worldPaused && !wallOpen && <div className="surface-guide"><span style={{ transform: `rotate(${wallBearing}rad)` }} aria-hidden="true">↑</span><div><b>{nearestWall ? 'PRESS E / DRAW ON SURFACE' : `${wallDistance} m / EDITABLE SURFACE`}</b><small>{guideWall.name} · Cyan diamonds on map</small></div></div>}
    <motion.div key={`${notification.title}-${notification.body}`} className="game-notification" initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }}><NotificationIcon /><span><b>{notification.title}</b>{notification.body}</span></motion.div>
    {pursuitActive && !pursuitPrompt && !captured && <motion.div className="pursuit-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldAlert /><span><b>VMPD SEARCH ACTIVE</b>Get below 55% awareness, then remain unseen for 5 seconds.</span><i><b style={{ width: `${escapeProgress * 20}%` }} /></i></motion.div>}
    <DistrictMinimap theme={theme} player={playerMap} posters={posterActive} patrol={policeCount > 0} />
    <div className="district-clock">{`${String(Math.floor((23 * 60 + 54 + Math.floor(elapsed / 8)) / 60) % 24).padStart(2, '0')}:${String((54 + Math.floor(elapsed / 8)) % 60).padStart(2, '0')}`} <span>{billboardActive ? 'CITY NETWORK OVERRIDE' : 'POSTER REACH ACTIVE'}</span></div>
    {nearPoster && !worldPaused && !wallOpen && !nearestWall && !aimedWall && <button className="interaction-prompt" onClick={() => setPosterOpen(true)}><kbd>E</kbd><span>VIEW YOUR POSTER</span></button>}
    {(nearestWall || aimedWall) && !worldPaused && !wallOpen && <button className="interaction-prompt wall-interaction" onClick={openWall}><kbd>E</kbd><span>PAINT LIVE / {(nearestWall || aimedWall)!.name.toUpperCase()}</span></button>}
    {freeSurface && !worldPaused && !wallOpen && !weapon.aiming && <button className="interaction-prompt wall-interaction" onClick={openFreeSurface}><kbd>E</kbd><span>PAINT THIS SURFACE</span></button>}
    {weapon.drawn && weapon.aiming && !worldPaused && <div className="aim-reticle" aria-hidden="true"><i /><i /><i /><i /></div>}
    {!summary && !wallOpen && !posterEditing && <div className={`weapon-dock ${weapon.drawn ? 'drawn' : ''}`}>
      <button className="weapon-toggle" onClick={toggleWeapon} aria-pressed={weapon.drawn}><Target /><b>{weapon.drawn ? 'HOLSTER' : 'DRAW GUN'}</b><small>G</small></button>
      {weapon.drawn && <div className="weapon-readout">
        <span><small>AMMO</small><b className={weapon.ammo === 0 ? 'hot' : ''}>{weapon.ammo}<em>/{weapon.reserve}</em></b></span>
        <span><small>STATE</small><b className={weapon.aiming ? 'hot' : ''}>{weapon.reloading > 0 ? 'RELOADING' : weapon.aiming ? 'AIMING' : 'LOWERED'}</b></span>
        <button className="weapon-aim" aria-pressed={weapon.aiming} onClick={() => setAiming(!weapon.aiming)}><Crosshair /> {weapon.aiming ? 'LOWER' : 'AIM'} <small>F / RIGHT DRAG</small></button>
        <button className="weapon-fire" disabled={!weapon.aiming || weapon.ammo === 0 || weapon.reloading > 0} onClick={shoot}>FIRE <small>CLICK / CTRL</small></button>
        <button className="weapon-reload" disabled={!canReload(weapon)} onClick={reloadWeapon}>RELOAD <small>R</small></button>
      </div>}
    </div>}
    {!summary && !wallOpen && !posterEditing && <div className={`studio-dock ${dockOpen ? 'open' : 'collapsed'}`}>
      <button className="studio-dock-toggle" aria-expanded={dockOpen} onClick={() => setDockOpen(value => !value)}><Brush /><b>DRAW / EDIT</b><small>ALWAYS ON · Q</small><ChevronDown /></button>
      {dockOpen && <div className="studio-dock-body">
        <button className={lastSurface === 'poster' ? 'active' : ''} onClick={openPosterStudio}><b>WANTED POSTER</b><small>{livePoster ? 'Your edit is live citywide' : 'Draw, letter or sticker it'}</small></button>
        {WALLS.map(wall => <button key={wall.id} className={lastSurface === wall.id ? 'active' : ''} onClick={() => openWallStudio(wall.id)}><b>{wall.name.toUpperCase()}</b><small>{surfaceImages[wall.id] ? 'Painted. Public street wall' : 'Public street wall, painting it is reported'}</small></button>)}
        <button className={`dock-free ${freeSurface ? 'ready' : ''}`} disabled={!freeSurface} onClick={openFreeSurface}><b>SURFACE IN FRONT OF YOU</b><small>{freeSurface ? `Out of sight until someone walks past · ${tags.length}/${MAX_TAGS} used` : 'Walk up and face a wall, shutter or column'}</small></button>
        <p>Open any surface at any time, walking or mid-pursuit. Painting does not pause the district: patrols keep moving while you work, so watch the awareness meter.</p>
      </div>}
    </div>}
    {posterEditing && <section className="wall-editor-overlay" role="dialog" aria-modal="true" aria-label="In-game poster editor">
      <header><div><small>UNLAYER REACT IMAGE EDITOR / LIVE CITY POSTER</small><h2>REMIX YOUR POSTER</h2></div><button className="secondary" onClick={() => setPosterEditing(false)}>CANCEL</button></header>
      <p>Draw over your poster, add lettering, shapes or stickers, and publish the result back into this district. Editing changes its appearance, not your current police awareness.</p>
      <ViceImageEditor ref={posterEditor} image={posterUrl} onReadyChange={setPosterReady} onSave={() => setPosterNotice('Canvas saved. Publish to update the city posters.')} onCancel={() => setPosterEditing(false)} minHeight={520} />
      <footer><div><b>LIVE POSTER NETWORK</b><span>All poster stands and the active billboard use this image. Changes last until you restart or leave this district.</span><p role="status">{posterNotice}</p></div><button className="primary coral-btn" disabled={!posterReady} onClick={() => { const image = posterEditor.current?.exportImage(); if (!image) { setPosterNotice('The image is not ready. Please try again.'); return; } setLivePoster(image); setPosterEditing(false); setNotification({ icon: 'poster', title: 'POSTERS UPDATED', body: 'Your edited image is now on the district poster network.' }); }}>PUBLISH POSTER</button></footer>
    </section>}
    {wallOpen && <aside className="wall-studio" role="dialog" aria-label="Live wall painting studio">
      <header><div><small>UNLAYER REACT IMAGE EDITOR / LIVE ON THE {openSurface?.kind === 'tag' ? 'SURFACE' : 'WALL'}</small><h2>{(openSurface?.name ?? 'SURFACE').toUpperCase()}</h2></div><button className="secondary" onClick={closeWallStudio}><X /> STOP AND RUN</button></header>
      <div className="wall-studio-live" role="status">
        <span><small>SURFACE</small><b className={wallPainting ? 'hot' : ''}>{wallPainting ? 'PAINTING LIVE' : 'CLEAN'}</b></span>
        <span><small>AWARENESS</small><b className={awareness >= 50 ? 'hot' : ''}>{Math.round(awareness)}%</b></span>
        <span><small>VMPD</small><b className={responseEnabled ? 'hot' : ''}>{wallAge === null ? 'NOT LOGGED' : responseEnabled ? 'INVESTIGATING' : `${Math.ceil(WALL_REPORT_DELAY - wallAge)}s`}</b></span>
      </div>
      <p>Draw, letter, sticker or filter with the editor below and every export lands on the wall behind this panel within a second. The district keeps running while you paint: patrols walk, the dispatch clock counts down and you are stood still at the wall. Press Escape or STOP AND RUN to break off.</p>
      <div className="signal-options"><label htmlFor="signal-intent">SIGNAL PURPOSE</label><select id="signal-intent" value={signalIntent} onChange={event => setSignalIntent(event.target.value as SignalIntent)}><option value="mark">Leave a message at this wall</option><option value="north">False trail: send readers north</option><option value="south">False trail: send readers south</option></select><p>Your drawing is not read automatically, so this choice tells the street what your mark means. A false trail pulls readers for 25 seconds, but officers trust a direct sighting over a sign.</p></div>
      <ViceImageEditor key={wallOpen} ref={wallEditor} image={wallSource} onReadyChange={setWallReady} onSave={() => setWallNotice('Canvas saved. Publish to commit the signal.')} onCancel={closeWallStudio} minHeight={430} />
      <footer><div><b>{wallAge === null ? 'NOBODY HAS REPORTED THIS YET' : responseEnabled ? 'VMPD IS ALREADY INVESTIGATING' : `${Math.ceil(WALL_REPORT_DELAY - wallAge)} SECONDS TO DISPATCH`}</b><span>Paint here quietly and nothing happens. Anyone who sees the mark walks over to read it, and will recognise you afterwards. Being seen painting is worse.</span>{wallNotice && <p role="status">{wallNotice}</p>}</div><button className="primary coral-btn" disabled={!wallReady} onClick={publishWall}>{wallReady ? 'PUBLISH SIGNAL' : 'LOADING EDITOR'}</button></footer>
    </aside>}
    <div className="game-corner-actions"><button onClick={() => setPaused(true)} aria-label="Pause district"><Pause /></button></div>
    {(elapsed >= 14 || objectiveComplete) && !summary && <button className={`finish-district ${objectiveComplete ? 'ready' : ''}`} onClick={finish}>{objectiveComplete ? 'VIEW DISTRICT IMPACT' : 'EXIT DISTRICT'}</button>}
    {loading && <div className="game-loading"><div className="loading-mark"><span /><span /><span /></div><p>SYNCING CITY ASSETS</p><h2>LOADING {c.district.toUpperCase()}</h2><b>POSTER NETWORK CONNECTED</b><i /></div>}
    {!loading && intro && <motion.div className="district-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span>VICE COAST // DISTRICT {theme.code}</span><h1>{c.district.toUpperCase()}</h1><p>23:54</p><b>{theme.tagline}</b></motion.div>}
    {!loading && !intro && tutorial && <div className="game-tutorial" role="dialog" aria-label="District controls"><button className="tutorial-close" aria-label="Close district controls" onClick={() => { setTutorial(false); setPaused(false); }}><X /></button><p>ENTERING {c.district.toUpperCase()}</p><div><span><kbd>WASD</kbd><b>MOVE</b></span><span><kbd>DRAG</kbd><b>CAMERA</b></span><span><kbd>SHIFT</kbd><b>SPRINT</b></span><span><kbd>SPACE</kbd><b>JUMP</b></span><span><kbd>E</kbd><b>INTERACT</b></span><span><kbd>Q</kbd><b>DRAW / EDIT</b></span><span><kbd>G</kbd><b>GUN</b></span><span><kbd>F</kbd><b>AIM</b></span><span><kbd>C</kbd><b>CROUCH</b></span></div><small>Your poster creates suspicion. Find a lit service wall and press E to leave a signal. After publishing, you have 10 seconds before police respond. Face any upright surface and press E to paint straight onto it; the three marked walls work too. The DRAW / EDIT dock stays open all run, so press Q any time. Press G for your pistol, hold the right mouse button or F to aim, and click to fire: a downed officer stops chasing, but every shot tells dispatch exactly where you are. Past 50% awareness you outrun VMPD automatically.</small><button className="primary coral-btn tutorial-start" onClick={() => { setTutorial(false); setPaused(false); }}>START EXPLORING <ArrowRight /></button></div>}
    {pursuitPrompt && !captured && <motion.div className="pursuit-alert" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldAlert /><p>YOU HAVE BEEN IDENTIFIED</p><h2>VMPD PURSUIT ACTIVE</h2><span>Police have confirmed your identity and are closing in. Break line of sight, reduce awareness below 55%, and stay hidden for five seconds.</span><div><button className="primary coral-btn" autoFocus onClick={() => { graceRemaining.current = 1.5; contactSeconds.current = 0; setPursuitPrompt(false); }}><Gauge /> RUN — LOSE THE COPS</button><button className="secondary" onClick={() => { setPursuitPrompt(false); setCaptured(true); }}>SURRENDER</button></div></motion.div>}
    {captured && !summary && <div className="arrest-menu" role="dialog" aria-modal="true"><ShieldAlert /><p>{downed ? 'SHOTS EXCHANGED' : 'VMPD CONTACT'}</p><h2>{downed ? 'DOWNED' : 'APPREHENDED'}</h2><span>{downed ? 'VMPD returned fire and put you down. Accept the outcome to add it to your city record, or retry this district.' : 'Police confirmed your identity. Accept the arrest to add it to your city record, or retry this district.'}</span><button className="primary coral-btn" onClick={finish}>ACCEPT ARREST — VIEW IMPACT</button><button className="secondary" onClick={resetGame}><RotateCcw /> RETRY DISTRICT</button></div>}
    {posterOpen && <div className="poster-inspection"><button onClick={() => setPosterOpen(false)}><X /> CLOSE</button><div><img src={posterUrl} alt="Your customized wanted poster" /><aside><p>PHYSICAL CITY ASSET</p><b>POSTER NETWORK // {theme.code}</b><span>This is the exact image published from React Image Editor. NPC recognition probability is now active nearby.</span><small><MapPin /> {c.district.toUpperCase()}</small><button className="primary" onClick={openPosterStudio}>EDIT POSTER</button></aside></div></div>}
    {paused && !summary && !posterOpen && !wallOpen && !posterEditing && <div className="pause-menu"><p>DISTRICT PAUSED</p><button className="primary" onClick={() => setPaused(false)}><Play /> RESUME</button><button className="secondary" onClick={finish}>EXIT DISTRICT</button><button className="text-btn" onClick={resetGame}><RotateCcw /> RESTART DISTRICT</button></div>}
    <div className="mobile-game-controls"><div className="dpad"><button aria-label="Move forward" {...controlPress('w')}><ArrowUp /></button><button aria-label="Move left" {...controlPress('a')}><ArrowLeft /></button><button aria-label="Move backward" {...controlPress('s')}><ArrowDown /></button><button aria-label="Move right" {...controlPress('d')}><ArrowRight /></button></div><div><button className="mobile-jump" {...controlPress(' ')}><Zap /> JUMP</button><button className="mobile-crouch" {...controlPress('c')}><ArrowDown /> CROUCH</button><button className="mobile-run" {...controlPress('shift')}><Gauge /> RUN</button><button className="mobile-interact" disabled={worldPaused || (!nearPoster && !nearestWall && !aimedWall && !freeSurface)} onClick={() => (nearestWall || aimedWall || freeSurface) ? openWall() : setPosterOpen(true)}><Eye /> USE</button>
      <button className="mobile-aim" aria-pressed={weapon.aiming} disabled={worldPaused || !weapon.drawn} onClick={() => setAiming(!weapon.aiming)}><Crosshair /> {weapon.aiming ? 'LOWER' : 'AIM'}</button>
      <button className="mobile-fire" disabled={worldPaused || !weapon.aiming || weapon.ammo === 0} onClick={shoot}><Target /> FIRE</button></div></div>
    {summary && <div className="district-summary"><p className="eyebrow coral">DISTRICT IMPACT COMPLETE</p><h2>{c.district.toUpperCase()}</h2><b className="summary-status">{captured ? 'APPREHENDED' : escaped ? 'PURSUIT ESCAPED' : policeReports ? 'HIGH PRIORITY' : localBuzz >= 90 ? 'CITYWIDE TRENDING' : 'DISTRICT WATCHED'}</b><div><span>POSTER REACH<b>+{(2400 + recognitions * 650 + (billboardActive ? 1800 : 0)).toLocaleString()}</b></span><span>NPC RECOGNITIONS<b>{String(recognitions).padStart(2, '0')}</b></span><span>POLICE REPORTS<b>{String(policeReports).padStart(2, '0')}</b></span><span>SHOTS FIRED<b>{String(shotsFired).padStart(2, '0')}</b></span><span>OFFICERS DOWN<b>{String(officersDown).padStart(2, '0')}</b></span><span>BYSTANDERS HIT<b>{String(civiliansDown).padStart(2, '0')}</b></span><span>HEAT CHANGE<b>+{captured ? 18 : policeReports ? 12 : 5}</b></span><span>REPUTATION<b>+{Math.max(4, recognitions * 2)}</b></span><span>BUZZ CHANGE<b>+{Math.max(8, localBuzz - (cityState?.buzz || 50))}</b></span></div><button className="primary coral-btn" onClick={onContinue}>CONTINUE TO VICEFEED</button><button className="secondary" onClick={onReturn}>RETURN TO CITY IMPACT</button></div>}
  </div></main>;
}
