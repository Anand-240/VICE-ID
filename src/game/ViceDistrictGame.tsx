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
import { DistrictMinimap } from './DistrictMinimap';

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
  const detections = useRef(new Map<string, { visible: boolean; at: number }>());
  const graceUntil = useRef(0);
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
  const [awareness, setAwareness] = useState(Math.min(38, 8 + c.wantedLevel * 5));
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
  const objectiveComplete = elapsed >= 36 && billboardActive && recognitions > 0;
  const objective = pursuitActive ? 'BREAK LINE OF SIGHT — EVADE VMPD' : !posterActive ? 'FIND YOUR POSTER' : recognitions < 1 ? 'LET THE DISTRICT RECOGNIZE YOU' : awareness < 72 ? 'AVOID POLICE ATTENTION' : billboardActive ? 'WATCH THE CITY REACT' : 'STAY MOBILE';
  const objectiveProgress = pursuitActive ? escapeProgress * 20 : Math.min(100, Math.round(elapsed / 36 * 100));
  const policeCount = c.wantedLevel >= 4 && elapsed >= 20 ? 2 : elapsed >= 14 ? 1 : 0;
  const worldPaused = paused || summary || posterOpen || loading || intro || tutorial || pursuitPrompt || captured;

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
      const key = event.key.toLowerCase();
      if (!worldPaused) controls.current[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'e' && nearPoster && !worldPaused) setPosterOpen(true);
      if (key === 'escape' && !event.repeat && !pursuitPrompt && !captured && !summary) posterOpen ? setPosterOpen(false) : setPaused((value) => !value);
    };
    const up = (event: KeyboardEvent) => { controls.current[event.key.toLowerCase()] = false; };
    const blur = () => { controls.current = {}; setPaused(true); };
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('blur', blur); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [nearPoster, posterOpen, worldPaused, pursuitPrompt, captured, summary]);

  useEffect(() => {
    if (paused || summary || posterOpen || loading || intro || tutorial || pursuitPrompt || captured) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [paused, summary, posterOpen, loading, intro, tutorial, pursuitPrompt, captured]);

  useEffect(() => {
    if (elapsed === 3) setNotification({ icon: 'poster', title: 'POSTER NETWORK', body: `Physical copies detected across ${c.district}.` });
    if (elapsed === 9) { setLocalBuzz((value) => Math.min(100, value + 6)); setNotification({ icon: 'social', title: 'VICEFEED', body: 'Poster shared locally // reach accelerating.' }); }
    if (elapsed === 14) setNotification({ icon: 'police', title: 'VMPD RADIO', body: `Patrol unit entering ${c.district}.` });
    if (elapsed === 25) { setLocalBuzz((value) => Math.min(100, value + 7)); setNotification({ icon: 'network', title: 'CITY NETWORK', body: 'Identity distribution critical // billboard overridden.' }); }
    if (elapsed === 36) setNotification({ icon: 'alert', title: 'DISTRICT STATUS', body: `${c.district} elevated to HIGH ALERT.` });
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

  const onRecognize = useCallback((id: string, role: string, influencer: boolean) => {
    if (pausedRef.current || recognized.current.has(id)) return;
    recognized.current.add(id);
    setRecognitions((value) => value + 1);
    setLocalBuzz((value) => Math.min(100, value + (influencer ? 5 : 3)));
    if (influencer) {
      setAwareness((value) => Math.min(100, value + 14));
      setNotification({ icon: 'social', title: 'PHOTO TAKEN', body: `${role} posted your location // BUZZ +5.` });
    } else setNotification({ icon: 'poster', title: 'RECOGNIZED', body: `${role} matched you to the city poster.` });
  }, []);

  const onPoliceDetect = useCallback((visible: boolean, caught = false, officer: string) => {
    if (pausedRef.current) return;
    detections.current.set(officer, { visible, at: performance.now() });
    if (caught && pursuitActive && performance.now() > graceUntil.current) {
      controls.current = {}; setCaptured(true); setPursuitPrompt(false);
      setNotification({ icon: 'alert', title: 'APPREHENDED', body: 'VMPD made contact // district run ended.' });
    }
  }, [pursuitActive]);
  useEffect(() => {
    if (worldPaused || policeCount === 0) return;
    const timer = window.setInterval(() => {
      const seen = Array.from(detections.current.values()).some(d => d.visible && performance.now() - d.at < 700);
      setAwareness(value => Math.max(0, Math.min(100, value + (seen ? 4 + c.wantedLevel : pursuitActive ? -2.5 : -.5))));
    }, 300);
    return () => clearInterval(timer);
  }, [worldPaused, policeCount, c.wantedLevel, pursuitActive]);

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
    setEscaped(false);
    controls.current = {};
    cameraYaw.current = theme.startYaw;
    setRunId((value) => value + 1);
    setElapsed(0); setRecognitions(0); setPoliceReports(0); setAwareness(Math.min(38, 8 + c.wantedLevel * 5)); setPursuitActive(false); setPursuitPrompt(false); setEscapeProgress(0); setCaptured(false); setLocalBuzz(cityState?.buzz || 50); setMotionState({ speed: 0, stamina: 100, grounded: true, sprinting: false }); setSummary(false); setPaused(false); setPosterOpen(false); setNearPoster(false); setIntro(true);
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
    <Canvas shadows dpr={[1, 1.5]} frameloop={paused || summary || posterOpen || pursuitPrompt || captured ? 'demand' : 'always'} camera={{ fov: 58, near: .1, far: 450, position: [.5, 3.2, 45] }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.25; gl.outputColorSpace = THREE.SRGBColorSpace; }}><color attach="background" args={[theme.fog]} /><Suspense fallback={null}><NeonHarborScene onReady={sceneReady} key={runId} district={c.district} posterUrl={posterUrl} alias={c.alias} lifestyle={c.lifestyle} controls={controls} cameraYaw={cameraYaw} cameraPitch={cameraPitch} signals={{ elapsed, posterActive, billboardActive, paused: worldPaused, awareness, pursuitActive, wantedLevel: c.wantedLevel }} onNearPoster={setNearPoster} onPosition={onPosition} onMotion={onMotion} onRecognize={onRecognize} onPoliceDetect={onPoliceDetect} /></Suspense></Canvas>
    <div className="game-hud identity-hud"><img src={c.editedImage || c.originalImage} alt="Character identity" /><span><small>{c.district.toUpperCase()} // LIVE</small><b>{c.name} “{c.alias}”</b><em>{c.lifestyle.replace('-', ' ')}</em></span></div>
    <div className="game-hud stats-hud"><span>WANTED <b>{'★'.repeat(c.wantedLevel)}{'☆'.repeat(5 - c.wantedLevel)}</b></span><span>HEAT <b>{Math.min(100, c.heat + (policeReports ? 12 : 0))}</b></span><span>REP <b>{Math.min(100, c.reputation + recognitions * 2)}</b></span><span>BUZZ <b>{localBuzz}</b></span></div>
    <div className={`awareness-hud ${awareness >= 72 ? 'danger' : ''}`}><span>POLICE AWARENESS <b>{Math.round(awareness)}%</b></span><i><b style={{ width: `${awareness}%` }} /></i></div>
    <div className={`motion-hud ${motionState.sprinting ? 'sprinting' : ''}`}><span><small>VELOCITY</small><b>{Math.round(motionState.speed * 3.6)} <em>KM/H</em></b></span><span><small>{motionState.grounded ? 'TRACTION' : 'AIRBORNE'}</small><i><b style={{ width: `${motionState.stamina}%` }} /></i><em>STAMINA {Math.round(motionState.stamina)}%</em></span></div>
    <div className={`objective-hud ${pursuitActive ? 'pursuit' : ''}`}><small>{pursuitActive ? 'ACTIVE PURSUIT' : 'CURRENT OBJECTIVE'}</small><b>{objective}</b><i className={!pursuitActive && objectiveComplete ? 'complete' : ''}>{pursuitActive ? `${escapeProgress}/5 SECONDS HIDDEN` : objectiveComplete ? 'OBJECTIVE COMPLETE' : `${objectiveProgress}%`}</i></div>
    <motion.div key={`${notification.title}-${notification.body}`} className="game-notification" initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }}><NotificationIcon /><span><b>{notification.title}</b>{notification.body}</span></motion.div>
    {pursuitActive && !pursuitPrompt && !captured && <motion.div className="pursuit-strip" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldAlert /><span><b>VMPD SEARCH ACTIVE</b>Get below 55% awareness, then remain unseen for 5 seconds.</span><i><b style={{ width: `${escapeProgress * 20}%` }} /></i></motion.div>}
    <DistrictMinimap theme={theme} player={playerMap} posters={posterActive} patrol={policeCount > 0} />
    <div className="district-clock">{`${String(Math.floor((23 * 60 + 54 + Math.floor(elapsed / 8)) / 60) % 24).padStart(2, '0')}:${String((54 + Math.floor(elapsed / 8)) % 60).padStart(2, '0')}`} <span>{billboardActive ? 'CITY NETWORK OVERRIDE' : 'POSTER REACH ACTIVE'}</span></div>
    {nearPoster && !posterOpen && <button className="interaction-prompt" onClick={() => setPosterOpen(true)}><kbd>E</kbd><span>VIEW YOUR POSTER</span></button>}
    <div className="game-corner-actions"><button onClick={() => setPaused(true)} aria-label="Pause district"><Pause /></button></div>
    {(elapsed >= 14 || objectiveComplete) && !summary && <button className={`finish-district ${objectiveComplete ? 'ready' : ''}`} onClick={finish}>{objectiveComplete ? 'VIEW DISTRICT IMPACT' : 'EXIT DISTRICT'}</button>}
    {loading && <div className="game-loading"><div className="loading-mark"><span /><span /><span /></div><p>SYNCING CITY ASSETS</p><h2>LOADING {c.district.toUpperCase()}</h2><b>POSTER NETWORK CONNECTED</b><i /></div>}
    {!loading && intro && <motion.div className="district-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span>VICE COAST // DISTRICT {theme.code}</span><h1>{c.district.toUpperCase()}</h1><p>23:54</p><b>{theme.tagline}</b></motion.div>}
    {!loading && !intro && tutorial && <div className="game-tutorial"><button aria-label="Start exploring district" onClick={() => setTutorial(false)}><X /></button><p>ENTERING {c.district.toUpperCase()}</p><div><span><kbd>WASD</kbd><b>MOVE</b></span><span><kbd>DRAG</kbd><b>CAMERA</b></span><span><kbd>SHIFT</kbd><b>SPRINT</b></span><span><kbd>SPACE</kbd><b>JUMP</b></span><span><kbd>E</kbd><b>INTERACT</b></span></div><small>ACCELERATION, TRACTION, GRAVITY, AND STAMINA ARE LIVE</small></div>}
    {pursuitPrompt && !captured && <motion.div className="pursuit-alert" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldAlert /><p>YOU HAVE BEEN IDENTIFIED</p><h2>VMPD PURSUIT ACTIVE</h2><span>Police units are moving toward your live position. Break line of sight, reduce awareness below 55%, and stay hidden for five seconds.</span><div><button className="primary coral-btn" autoFocus onClick={() => { graceUntil.current = performance.now() + 3000; setPursuitPrompt(false); }}><Gauge /> RUN — LOSE THE COPS</button><button className="secondary" onClick={() => { setPursuitPrompt(false); setCaptured(true); }}>SURRENDER</button></div></motion.div>}
    {captured && !summary && <div className="arrest-menu" role="dialog" aria-modal="true"><ShieldAlert /><p>VMPD CONTACT</p><h2>APPREHENDED</h2><span>Police confirmed your identity. Accept the arrest to add it to your city record, or retry this district.</span><button className="primary coral-btn" onClick={finish}>ACCEPT ARREST — VIEW IMPACT</button><button className="secondary" onClick={resetGame}><RotateCcw /> RETRY DISTRICT</button></div>}
    {posterOpen && <div className="poster-inspection"><button onClick={() => setPosterOpen(false)}><X /> CLOSE</button><div><img src={posterUrl} alt="Your customized wanted poster" /><aside><p>PHYSICAL CITY ASSET</p><b>POSTER NETWORK // {theme.code}</b><span>This is the exact image published from React Image Editor. NPC recognition probability is now active nearby.</span><small><MapPin /> {c.district.toUpperCase()}</small></aside></div></div>}
    {paused && !summary && !posterOpen && <div className="pause-menu"><p>DISTRICT PAUSED</p><button className="primary" onClick={() => setPaused(false)}><Play /> RESUME</button><button className="secondary" onClick={finish}>EXIT DISTRICT</button><button className="text-btn" onClick={resetGame}><RotateCcw /> RESTART DISTRICT</button></div>}
    <div className="mobile-game-controls"><div className="dpad"><button aria-label="Move forward" {...controlPress('w')}><ArrowUp /></button><button aria-label="Move left" {...controlPress('a')}><ArrowLeft /></button><button aria-label="Move backward" {...controlPress('s')}><ArrowDown /></button><button aria-label="Move right" {...controlPress('d')}><ArrowRight /></button></div><div><button className="mobile-jump" {...controlPress(' ')}><Zap /> JUMP</button><button className="mobile-run" {...controlPress('shift')}><Gauge /> RUN</button><button className="mobile-interact" disabled={!nearPoster} onClick={() => setPosterOpen(true)}><Eye /> USE</button></div></div>
    {summary && <div className="district-summary"><p className="eyebrow coral">DISTRICT IMPACT COMPLETE</p><h2>{c.district.toUpperCase()}</h2><b className="summary-status">{captured ? 'APPREHENDED' : escaped ? 'PURSUIT ESCAPED' : policeReports ? 'HIGH PRIORITY' : localBuzz >= 90 ? 'CITYWIDE TRENDING' : 'DISTRICT WATCHED'}</b><div><span>POSTER REACH<b>+{(2400 + recognitions * 650 + (billboardActive ? 1800 : 0)).toLocaleString()}</b></span><span>NPC RECOGNITIONS<b>{String(recognitions).padStart(2, '0')}</b></span><span>POLICE REPORTS<b>{String(policeReports).padStart(2, '0')}</b></span><span>HEAT CHANGE<b>+{captured ? 18 : policeReports ? 12 : 5}</b></span><span>REPUTATION<b>+{Math.max(4, recognitions * 2)}</b></span><span>BUZZ CHANGE<b>+{Math.max(8, localBuzz - (cityState?.buzz || 50))}</b></span></div><button className="primary coral-btn" onClick={onContinue}>CONTINUE TO VICEFEED</button><button className="secondary" onClick={onReturn}>RETURN TO CITY IMPACT</button></div>}
  </div></main>;
}
