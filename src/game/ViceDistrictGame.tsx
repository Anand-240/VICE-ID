import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, Gauge, MapPin, Pause, Play, Radio, RotateCcw, ShieldAlert, Smartphone, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { useCharacterStore } from '../store/characterStore';
import type { DistrictOutcome } from '../types/character';
import { NeonHarborScene, type ControlState, type MotionTelemetry } from './NeonHarborScene';
import { getDistrictTheme } from './districts';
import './game.css';
import { advanceAwareness, type PoliceDetection, type ReportedLocation, type Point } from './police';
import { DistrictMinimap } from './DistrictMinimap';
import { ViceImageEditor, type ViceEditorHandle } from '../components/editor/ViceImageEditor';
import { WALL_REPORT_DELAY, makeWallCanvas, nearbyWall, wallResponseReady, type WallId } from './walls';

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
  const [wallImages, setWallImages] = useState<Partial<Record<WallId, string>>>({});
  const [wallOpen, setWallOpen] = useState<WallId | null>(null);
  const [wallSource, setWallSource] = useState('');
  const [wallReady, setWallReady] = useState(false);
  const [wallNotice, setWallNotice] = useState('');
  const wallEditor = useRef<ViceEditorHandle>(null);
  const [wallAge, setWallAge] = useState<number | null>(null);
  const wallIncident = useRef<Point | null>(null);
  const dispatched = useRef(false);
  const crimeCommitted = useRef(false);
  const responseEnabled = wallResponseReady(wallAge);
  const responseRef = useRef(responseEnabled); responseRef.current = responseEnabled;
  const [awarenessReason, setAwarenessReason] = useState('PATROL SEARCH');
  const [webgl] = useState(hasWebGL);
  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState(true);
  const [tutorial, setTutorial] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [nearPoster, setNearPoster] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
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
  const [motionState, setMotionState] = useState<MotionTelemetry>({ speed: 0, stamina: 100, grounded: true, sprinting: false });
  const [notification, setNotification] = useState({ icon: 'network', title: 'CITY ASSET SYNCED', body: `Player-created poster connected to ${c.district}.` });

  const posterUrl = c.wantedPosterImage || c.editedImage || c.originalImage || EMPTY_POSTER;
  const theme = getDistrictTheme(c.district);
  const posterActive = elapsed >= 3;
  const billboardActive = elapsed >= 25 || localBuzz >= 90;
  const objectiveComplete = escaped;
  const objective = pursuitActive ? 'BREAK LINE OF SIGHT - EVADE VMPD' : wallAge === null ? 'LEAVE YOUR SIGNAL ON A WALL' : !responseEnabled ? 'YOUR MARK IS LIVE - MOVE AWAY' : escaped ? 'PURSUIT ESCAPED' : 'VMPD IS INVESTIGATING YOUR MARK';
  const policeCount = c.wantedLevel >= 4 && (elapsed >= 20 || responseEnabled) ? 2 : elapsed >= 14 || responseEnabled ? 1 : 0;
  const worldPaused = paused || summary || posterOpen || Boolean(wallOpen) || loading || intro || tutorial || pursuitPrompt || captured;
  const nearestWall = nearbyWall(playerMap.x, playerMap.z);
  const openWall = () => {
    if (!nearestWall || worldPaused || pursuitActive) return;
    setWallSource(wallImages[nearestWall.id] || makeWallCanvas());
    setWallReady(false); setWallNotice(''); setWallOpen(nearestWall.id);
  };
  const publishWall = () => {
    const instance = wallEditor.current;
    if (!wallOpen || !instance) return;
    const image = instance.exportImage();
    if (!image) { setWallNotice('Wait for the editor to load before publishing.'); return; }
    if (!instance.hasChanges()) { setWallNotice('Add text, a drawing or a sticker before leaving your mark.'); return; }
    setWallImages(images => ({ ...images, [wallOpen]: image }));
    wallIncident.current = { x: playerMap.x, z: playerMap.z };
    if (!crimeCommitted.current) {
      crimeCommitted.current = true; dispatched.current = false;
      recognized.current.clear(); detections.current.clear(); setWallAge(0);
    } else if (responseEnabled) setReport({ ...wallIncident.current, sequence: ++reportSequence.current });
    setWallOpen(null); setPaused(false);
    setNotification({ icon: 'alert', title: 'MARK LEFT ON WALL', body: responseEnabled ? 'New mark reported. VMPD is already investigating.' : 'Your design is visible. Witnesses can report it. Move before dispatch responds.' });
  };
  useEffect(() => {
    if (worldPaused || wallAge === null || responseEnabled) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(); const delta = Math.min(.25, (now - previous) / 1000); previous = now;
      setWallAge(age => age === null ? null : Math.min(WALL_REPORT_DELAY, age + delta));
    }, 100);
    return () => clearInterval(timer);
  }, [worldPaused, wallAge === null, responseEnabled]);
  useEffect(() => {
    if (!responseEnabled || dispatched.current || !wallIncident.current) return;
    dispatched.current = true;
    setReport({ ...wallIncident.current, sequence: ++reportSequence.current });
    setPoliceReports(value => value + 1); setAwareness(22);
    setNotification({ icon: 'police', title: 'WALL INCIDENT DISPATCHED', body: 'Street surveillance logged the mark. VMPD is checking the reported location.' });
  }, [responseEnabled]);

  const pausedRef = useRef(worldPaused); pausedRef.current = worldPaused;
  const awarenessRef = useRef(awareness); awarenessRef.current = awareness;
  useEffect(() => { if (worldPaused) { controls.current = {}; dragging.current = false; } }, [worldPaused]);
  useEffect(() => { cameraYaw.current = theme.startYaw; }, [theme.startYaw]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => setLoadFailed(true), 45000);
    const introTimer = window.setTimeout(() => setIntro(false), 4300);
    return () => { clearTimeout(loadTimer); clearTimeout(introTimer); };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (wallOpen || (event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)))) return;
      const key = event.key.toLowerCase();
      if (!worldPaused) controls.current[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'e' && !event.repeat && !worldPaused) {
        if (nearestWall && !pursuitActive) openWall();
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
  }, [nearPoster, posterOpen, worldPaused, pursuitPrompt, captured, summary, wallOpen, nearestWall, wallAge, pursuitActive]);

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

  useEffect(() => {
    if (awareness < 100 || pursuitTriggered.current) return;
    pursuitTriggered.current = true;
    setPoliceReports(v => v + 1);
    setEscaped(false);
    setPursuitActive(true);
    setPursuitPrompt(true);
    setEscapeProgress(0);
    controls.current = {};
    setNotification({ icon: 'alert', title: 'SUBJECT IDENTIFIED', body: 'VMPD has your location // active pursuit initiated.' });
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

  const onRecognize = useCallback((id: string, role: string, influencer: boolean, location: Point) => {
    if (pausedRef.current || recognized.current.has(id)) return;
    recognized.current.add(id);
    setRecognitions((value) => value + 1);
    setLocalBuzz((value) => Math.min(100, value + (influencer ? 5 : 3)));
    if (!crimeCommitted.current) {
      setNotification({ icon: 'poster', title: 'A FAMILIAR FACE', body: `${role} thinks you match the poster. Suspicion alone does not start a pursuit.` });
      return;
    }
    if (!responseRef.current) {
      setPoliceReports(value => value + 1);
      setNotification({ icon: 'police', title: 'WITNESS CALLING', body: `${role} saw you near the marked wall. Dispatch is processing the incident.` });
      return;
    }
    setReport({ ...location, sequence: ++reportSequence.current });
    setPoliceReports(value => value + 1);
    setAwareness(value => Math.max(value, Math.min(85, Math.max(35, value + (influencer ? 20 : 14)))));
    setNotification({ icon: 'police', title: 'WITNESS TIP RECEIVED', body: `${role} reported your location. VMPD is investigating.` });
  }, []);

  const onPoliceDetect = useCallback((detection: PoliceDetection, officer: string) => {
    if (pausedRef.current) return;
    detections.current.set(officer, { ...detection, at: performance.now() });
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

  const onPosition = useCallback((x: number, z: number, heading: number) => setPlayerMap({ x, z, heading }), []);
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
    completed.current = false;
    pursuitTriggered.current = false;
    recognized.current.clear();
    detections.current.clear();
    graceRemaining.current = 0; contactSeconds.current = 0;
    setReport(null); setAwarenessReason('PATROL SEARCH');
    setWallImages({}); setWallOpen(null); setWallAge(null); wallIncident.current = null;
    crimeCommitted.current = false; dispatched.current = false;
    setEscaped(false);
    controls.current = {};
    cameraYaw.current = theme.startYaw;
    setRunId((value) => value + 1);
    setElapsed(0); setRecognitions(0); setPoliceReports(0); setAwareness(0); setPursuitActive(false); setPursuitPrompt(false); setEscapeProgress(0); setCaptured(false); setLocalBuzz(cityState?.buzz || 50); setMotionState({ speed: 0, stamina: 100, grounded: true, sprinting: false }); setSummary(false); setPaused(false); setPosterOpen(false); setNearPoster(false); setIntro(true);
    window.setTimeout(() => setIntro(false), 2300);
  };

  const setControl = (key: string, value: boolean) => { if (!pausedRef.current || !value) controls.current[key] = value; };
  const controlPress = (key: string) => ({ onPointerDown: () => setControl(key, true), onPointerUp: () => setControl(key, false), onPointerCancel: () => setControl(key, false), onPointerLeave: () => setControl(key, false) });
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => { if (worldPaused || (event.target as HTMLElement).closest('button')) return; dragging.current = true; pointer.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => { if (!dragging.current) return; const dx = event.clientX - pointer.current.x; const dy = event.clientY - pointer.current.y; pointer.current = { x: event.clientX, y: event.clientY }; cameraYaw.current -= dx * .0042; cameraPitch.current = THREE.MathUtils.clamp(cameraPitch.current + dy * .003, -.15, .55); };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => { dragging.current = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };

  const notificationIcon = useMemo(() => notification.icon === 'police' || notification.icon === 'alert' ? ShieldAlert : notification.icon === 'social' ? Smartphone : notification.icon === 'poster' ? Eye : Radio, [notification.icon]);
  const NotificationIcon = notificationIcon;

  if (!webgl || (loading && loadFailed)) return <main className="district-game webgl-fallback"><div><ShieldAlert /><p>3D DISTRICT UNAVAILABLE</p><h2>{!webgl ? 'WEBGL IS NOT AVAILABLE' : 'SCENE LOAD TIMED OUT'}</h2><span>Your city state and poster are safe. Return to City Impact to continue.</span><button className="primary coral-btn" onClick={onReturn}>RETURN TO CITY IMPACT</button></div></main>;

  return <main className="district-game"><div className="game-viewport-3d" style={{ '--district-accent': theme.accent } as React.CSSProperties} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
    <div className="game-scene-layer">
    <Canvas shadows dpr={[1, 1.5]} frameloop={paused || summary || posterOpen || wallOpen || pursuitPrompt || captured ? 'demand' : 'always'} camera={{ fov: 58, near: .1, far: 450, position: [.5, 3.2, 45] }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.25; gl.outputColorSpace = THREE.SRGBColorSpace; }}><color attach="background" args={[theme.fog]} /><Suspense fallback={null}><NeonHarborScene onReady={sceneReady} key={runId} district={c.district} posterUrl={posterUrl} alias={c.alias} lifestyle={c.lifestyle} controls={controls} cameraYaw={cameraYaw} cameraPitch={cameraPitch} signals={{ elapsed, posterActive, billboardActive, paused: worldPaused, awareness, pursuitActive, report, responseEnabled, wallMarked: wallAge !== null, wallImages, wantedLevel: c.wantedLevel }} onNearPoster={setNearPoster} onPosition={onPosition} onMotion={onMotion} onRecognize={onRecognize} onPoliceDetect={onPoliceDetect} /></Suspense></Canvas>
    </div>
    <div className="game-hud identity-hud"><img src={c.editedImage || c.originalImage} alt="Character identity" /><span><small>{c.district.toUpperCase()} // LIVE</small><b>{c.name} “{c.alias}”</b><em>{c.lifestyle.replace('-', ' ')}</em></span></div>
    <div className="game-hud stats-hud"><span>WANTED <b>{'★'.repeat(c.wantedLevel)}{'☆'.repeat(5 - c.wantedLevel)}</b></span><span>HEAT <b>{Math.min(100, c.heat + (policeReports ? 12 : 0))}</b></span><span>REP <b>{Math.min(100, c.reputation + recognitions * 2)}</b></span><span>BUZZ <b>{localBuzz}</b></span></div>
    <div className={`awareness-hud ${awareness >= 72 ? 'danger' : ''}`}><span>POLICE AWARENESS <b>{Math.round(awareness)}%</b></span><i><b style={{ width: `${awareness}%` }} /></i><small className="awareness-reason" role="status">{wallAge === null ? 'NO WALL INCIDENT / SUSPICION ONLY' : !responseEnabled ? `DISPATCH IN ${Math.ceil(WALL_REPORT_DELAY - wallAge)}s` : awarenessReason}</small></div>
    <div className={`motion-hud ${motionState.sprinting ? 'sprinting' : ''}`}><span><small>VELOCITY</small><b>{Math.round(motionState.speed * 3.6)} <em>KM/H</em></b></span><span><small>{motionState.grounded ? 'TRACTION' : 'AIRBORNE'}</small><i><b style={{ width: `${motionState.stamina}%` }} /></i><em>STAMINA {Math.round(motionState.stamina)}%</em></span></div>
    <div className={`objective-hud ${pursuitActive ? 'pursuit' : ''}`}><small>{pursuitActive ? 'ACTIVE PURSUIT' : 'CURRENT OBJECTIVE'}</small><b>{objective}</b><i className={!pursuitActive && objectiveComplete ? 'complete' : ''}>{pursuitActive ? `${escapeProgress}/5 SECONDS HIDDEN` : objectiveComplete ? 'OBJECTIVE COMPLETE' : wallAge === null ? 'Find a lit service wall. Press E to edit.' : !responseEnabled ? `${Math.ceil(WALL_REPORT_DELAY - wallAge)} SECONDS TO DISPATCH` : 'Break sight. Find a route away from patrols.'}</i></div>
    <motion.div key={`${notification.title}-${notification.body}`} className="game-notification" initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }}><NotificationIcon /><span><b>{notification.title}</b>{notification.body}</span></motion.div>
    {pursuitActive && !pursuitPrompt && !captured && <motion.div className="pursuit-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldAlert /><span><b>VMPD SEARCH ACTIVE</b>Get below 55% awareness, then remain unseen for 5 seconds.</span><i><b style={{ width: `${escapeProgress * 20}%` }} /></i></motion.div>}
    <DistrictMinimap theme={theme} player={playerMap} posters={posterActive} patrol={policeCount > 0} />
    <div className="district-clock">{`${String(Math.floor((23 * 60 + 54 + Math.floor(elapsed / 8)) / 60) % 24).padStart(2, '0')}:${String((54 + Math.floor(elapsed / 8)) % 60).padStart(2, '0')}`} <span>{billboardActive ? 'CITY NETWORK OVERRIDE' : 'POSTER REACH ACTIVE'}</span></div>
    {nearPoster && !worldPaused && !(nearestWall && !pursuitActive) && <button className="interaction-prompt" onClick={() => setPosterOpen(true)}><kbd>E</kbd><span>VIEW YOUR POSTER</span></button>}
    {nearestWall && !pursuitActive && !worldPaused && <button className="interaction-prompt wall-interaction" onClick={openWall}><kbd>E</kbd><span>LEAVE A SIGNAL / {nearestWall.name.toUpperCase()}</span></button>}
    {wallOpen && <section className="wall-editor-overlay" role="dialog" aria-modal="true" aria-label="Wall signal studio">
      <header><div><small>VICE COAST / STREET SIGNAL</small><h2>LEAVE YOUR MARK</h2></div><button className="secondary" onClick={() => { setWallOpen(null); setPaused(false); }}><X /> CANCEL</button></header>
      <p>Write a message, draw a symbol or add a sticker. Your exported design appears on this wall. The city is paused while you edit.</p>
      <ViceImageEditor key={wallOpen} ref={wallEditor} image={wallSource} onReadyChange={setWallReady} onSave={() => setWallNotice('Canvas saved. Choose Publish on wall to apply your design.')} onCancel={() => { setWallOpen(null); setPaused(false); }} minHeight={520} />
      <footer><div><b>{wallAge === null ? '10 SECONDS TO MOVE' : responseEnabled ? 'VMPD IS ALREADY INVESTIGATING' : `${Math.ceil(WALL_REPORT_DELAY - wallAge)} SECONDS REMAIN`}</b><span>Your first publication starts the response timer. Further marks do not reset it. People can report you; police investigate after the delay.</span>{wallNotice && <p role="status">{wallNotice}</p>}</div><button className="primary coral-btn" disabled={!wallReady} onClick={publishWall}>{wallReady ? 'PUBLISH ON WALL' : 'LOADING EDITOR'}</button></footer>
    </section>}
    <div className="game-corner-actions"><button onClick={() => setPaused(true)} aria-label="Pause district"><Pause /></button></div>
    {(elapsed >= 14 || objectiveComplete) && !summary && <button className={`finish-district ${objectiveComplete ? 'ready' : ''}`} onClick={finish}>{objectiveComplete ? 'VIEW DISTRICT IMPACT' : 'EXIT DISTRICT'}</button>}
    {loading && <div className="game-loading"><div className="loading-mark"><span /><span /><span /></div><p>SYNCING CITY ASSETS</p><h2>LOADING {c.district.toUpperCase()}</h2><b>POSTER NETWORK CONNECTED</b><i /></div>}
    {!loading && intro && <motion.div className="district-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span>VICE COAST // DISTRICT {theme.code}</span><h1>{c.district.toUpperCase()}</h1><p>23:54</p><b>{theme.tagline}</b></motion.div>}
    {!loading && !intro && tutorial && <div className="game-tutorial" role="dialog" aria-label="District controls"><button className="tutorial-close" aria-label="Close district controls" onClick={() => { setTutorial(false); setPaused(false); }}><X /></button><p>ENTERING {c.district.toUpperCase()}</p><div><span><kbd>WASD</kbd><b>MOVE</b></span><span><kbd>DRAG</kbd><b>CAMERA</b></span><span><kbd>SHIFT</kbd><b>SPRINT</b></span><span><kbd>SPACE</kbd><b>JUMP</b></span><span><kbd>E</kbd><b>INTERACT</b></span></div><small>Your poster creates suspicion. Find a lit service wall and press E to leave a signal. After publishing, you have 10 seconds before police respond.</small><button className="primary coral-btn tutorial-start" onClick={() => { setTutorial(false); setPaused(false); }}>START EXPLORING <ArrowRight /></button></div>}
    {pursuitPrompt && !captured && <motion.div className="pursuit-alert" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldAlert /><p>YOU HAVE BEEN IDENTIFIED</p><h2>VMPD PURSUIT ACTIVE</h2><span>Police have confirmed your identity and are closing in. Break line of sight, reduce awareness below 55%, and stay hidden for five seconds.</span><div><button className="primary coral-btn" autoFocus onClick={() => { graceRemaining.current = 1.5; contactSeconds.current = 0; setPursuitPrompt(false); }}><Gauge /> RUN — LOSE THE COPS</button><button className="secondary" onClick={() => { setPursuitPrompt(false); setCaptured(true); }}>SURRENDER</button></div></motion.div>}
    {captured && !summary && <div className="arrest-menu" role="dialog" aria-modal="true"><ShieldAlert /><p>VMPD CONTACT</p><h2>APPREHENDED</h2><span>Police confirmed your identity. Accept the arrest to add it to your city record, or retry this district.</span><button className="primary coral-btn" onClick={finish}>ACCEPT ARREST — VIEW IMPACT</button><button className="secondary" onClick={resetGame}><RotateCcw /> RETRY DISTRICT</button></div>}
    {posterOpen && <div className="poster-inspection"><button onClick={() => setPosterOpen(false)}><X /> CLOSE</button><div><img src={posterUrl} alt="Your customized wanted poster" /><aside><p>PHYSICAL CITY ASSET</p><b>POSTER NETWORK // {theme.code}</b><span>This is the exact image published from React Image Editor. NPC recognition probability is now active nearby.</span><small><MapPin /> {c.district.toUpperCase()}</small></aside></div></div>}
    {paused && !summary && !posterOpen && !wallOpen && <div className="pause-menu"><p>DISTRICT PAUSED</p><button className="primary" onClick={() => setPaused(false)}><Play /> RESUME</button><button className="secondary" onClick={finish}>EXIT DISTRICT</button><button className="text-btn" onClick={resetGame}><RotateCcw /> RESTART DISTRICT</button></div>}
    <div className="mobile-game-controls"><div className="dpad"><button aria-label="Move forward" {...controlPress('w')}><ArrowUp /></button><button aria-label="Move left" {...controlPress('a')}><ArrowLeft /></button><button aria-label="Move backward" {...controlPress('s')}><ArrowDown /></button><button aria-label="Move right" {...controlPress('d')}><ArrowRight /></button></div><div><button className="mobile-jump" {...controlPress(' ')}><Zap /> JUMP</button><button className="mobile-run" {...controlPress('shift')}><Gauge /> RUN</button><button className="mobile-interact" disabled={worldPaused || (!nearPoster && !(nearestWall && !pursuitActive))} onClick={() => nearestWall && !pursuitActive ? openWall() : setPosterOpen(true)}><Eye /> USE</button></div></div>
    {summary && <div className="district-summary"><p className="eyebrow coral">DISTRICT IMPACT COMPLETE</p><h2>{c.district.toUpperCase()}</h2><b className="summary-status">{captured ? 'APPREHENDED' : escaped ? 'PURSUIT ESCAPED' : policeReports ? 'HIGH PRIORITY' : localBuzz >= 90 ? 'CITYWIDE TRENDING' : 'DISTRICT WATCHED'}</b><div><span>POSTER REACH<b>+{(2400 + recognitions * 650 + (billboardActive ? 1800 : 0)).toLocaleString()}</b></span><span>NPC RECOGNITIONS<b>{String(recognitions).padStart(2, '0')}</b></span><span>POLICE REPORTS<b>{String(policeReports).padStart(2, '0')}</b></span><span>HEAT CHANGE<b>+{captured ? 18 : policeReports ? 12 : 5}</b></span><span>REPUTATION<b>+{Math.max(4, recognitions * 2)}</b></span><span>BUZZ CHANGE<b>+{Math.max(8, localBuzz - (cityState?.buzz || 50))}</b></span></div><button className="primary coral-btn" onClick={onContinue}>CONTINUE TO VICEFEED</button><button className="secondary" onClick={onReturn}>RETURN TO CITY IMPACT</button></div>}
  </div></main>;
}
