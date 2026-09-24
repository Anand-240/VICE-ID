export const MAGAZINE = 8;
export const RESERVE = 16;
export const FIRE_COOLDOWN = .42;
export const RELOAD_TIME = 2.1;
// A downed officer stops searching and stops reporting for this long.
export const DOWN_DURATION = 14;
// Firing in the open is loud: it hands VMPD your position immediately.
export const GUNSHOT_AWARENESS = 42;
export const AIM_RANGE = 45;
export const HIT_RADIUS = .55;

export interface WeaponState {
  drawn: boolean;
  aiming: boolean;
  ammo: number;
  reserve: number;
  cooldown: number;
  reloading: number;
}

export const HOLSTERED: WeaponState = { drawn: false, aiming: false, ammo: MAGAZINE, reserve: RESERVE, cooldown: 0, reloading: 0 };

export function canFire(state: WeaponState) {
  return state.drawn && state.aiming && state.ammo > 0 && state.cooldown <= 0 && state.reloading <= 0;
}

export function fire(state: WeaponState): WeaponState {
  if (!canFire(state)) return state;
  return { ...state, ammo: state.ammo - 1, cooldown: FIRE_COOLDOWN };
}

export function canReload(state: WeaponState) {
  return state.drawn && state.reloading <= 0 && state.reserve > 0 && state.ammo < MAGAZINE;
}

export function reload(state: WeaponState): WeaponState {
  return canReload(state) ? { ...state, reloading: RELOAD_TIME, aiming: false } : state;
}

// Timers run down in seconds, so behaviour does not change with frame rate.
export function tickWeapon(state: WeaponState, seconds: number): WeaponState {
  if (state.cooldown <= 0 && state.reloading <= 0) return state;
  const cooldown = Math.max(0, state.cooldown - seconds);
  const reloading = Math.max(0, state.reloading - seconds);
  if (state.reloading > 0 && reloading === 0) {
    const loaded = Math.min(MAGAZINE, state.ammo + state.reserve);
    return { ...state, cooldown, reloading, ammo: loaded, reserve: state.reserve - (loaded - state.ammo) };
  }
  return { ...state, cooldown, reloading };
}

export function holster(state: WeaponState): WeaponState {
  return { ...state, drawn: false, aiming: false };
}

export interface ShotTarget { id: string; x: number; y: number; z: number }

// Resolves a hitscan shot against upright targets. `blocked` reports whether
// scene geometry stands between the muzzle and a candidate, so cover works.
export function resolveShot(
  origin: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number },
  targets: ShotTarget[],
  blocked: (target: ShotTarget, distance: number) => boolean,
) {
  let best: { target: ShotTarget; distance: number } | null = null;
  for (const target of targets) {
    const dx = target.x - origin.x, dy = target.y - origin.y, dz = target.z - origin.z;
    const along = dx * direction.x + dy * direction.y + dz * direction.z;
    if (along <= 0 || along > AIM_RANGE) continue;
    const offset = Math.hypot(dx - direction.x * along, dy - direction.y * along, dz - direction.z * along);
    if (offset > HIT_RADIUS) continue;
    if (best && along >= best.distance) continue;
    if (blocked(target, along)) continue;
    best = { target, distance: along };
  }
  return best;
}

// VMPD answers gunfire with gunfire, but not instantly: units have to be told
// a weapon is out before they draw their own.
// How long the street stays scattered after a shot is heard.
export const PANIC_DURATION = 9;
export const POLICE_ARM_DELAY = 5;
export const POLICE_RANGE = 28;
// Armed units push in to this range before holding to shoot.
export const POLICE_HOLD_RANGE = 9;
export const POLICE_FIRE_INTERVAL = 1.35;
export const POLICE_DAMAGE = 14;
export const PLAYER_HEALTH = 100;
export const REGEN_DELAY = 6;
export const REGEN_RATE = 7;

// How the camera sits while aiming, and how far the aim can be tilted.
export const AIM_SHOULDER = .82;
export const AIM_HEIGHT = 1.62;
export const AIM_PULLBACK = 2.5;
export const AIM_FOV = 49;

// Pitch is stored as a camera elevation where a larger value looks further
// down, so the shot elevation is its inverse around the resting pitch.
export function aimElevation(cameraPitch: number) {
  return Math.max(-.44, Math.min(.46, .18 - cameraPitch));
}

// A moving target at range is hard to hit. `roll` is supplied by the caller so
// the outcome stays testable.
export function policeShotHits(distance: number, moving: boolean, roll: number) {
  if (distance > POLICE_RANGE) return false;
  const chance = Math.max(.1, Math.min(.58, .62 - distance * .013 - (moving ? .14 : 0)));
  return roll < chance;
}

export function applyDamage(health: number, amount: number) {
  return Math.max(0, health - amount);
}

export function regenerate(health: number, sinceHit: number, seconds: number) {
  if (health <= 0 || sinceHit < REGEN_DELAY) return health;
  return Math.min(PLAYER_HEALTH, health + REGEN_RATE * seconds);
}
