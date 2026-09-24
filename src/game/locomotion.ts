// Ground movement is acceleration limited rather than snapped to a target
// velocity: the character builds speed, carries momentum and has to brake,
// which is what gives third-person movement its weight.
export const GROUND_ACCEL = 46;
export const GROUND_BRAKE = 34;
export const AIR_ACCEL = 11;
export const AIR_DRAG = 1.4;
export const TURN_RATE = 13;

// Jump feel: a short grace window after leaving a ledge, a buffer so an early
// press still fires on landing, and a cut so a tapped jump is a small hop.
export const JUMP_SPEED = 5.35;
export const COYOTE_TIME = .13;
export const JUMP_BUFFER = .16;
export const JUMP_CUT = .45;
export const STEP_HEIGHT = .46;

export interface Planar { x: number; z: number }

// Frame-rate independent: the velocity change per second is bounded, so a
// stutter cannot teleport the character up to speed.
export function approachVelocity(current: Planar, desired: Planar, grounded: boolean, seconds: number): Planar {
  const wants = Math.hypot(desired.x, desired.z) > .01;
  const rate = grounded ? (wants ? GROUND_ACCEL : GROUND_BRAKE) : (wants ? AIR_ACCEL : AIR_DRAG);
  const dx = desired.x - current.x, dz = desired.z - current.z;
  const change = Math.hypot(dx, dz);
  if (change < 1e-4) return { x: desired.x, z: desired.z };
  const step = Math.min(change, rate * seconds);
  return { x: current.x + dx / change * step, z: current.z + dz / change * step };
}

export interface JumpState { coyote: number; buffer: number; held: boolean }
export const RESTING_JUMP: JumpState = { coyote: 0, buffer: 0, held: false };

export function tickJump(state: JumpState, grounded: boolean, pressed: boolean, seconds: number): JumpState {
  return {
    coyote: grounded ? COYOTE_TIME : Math.max(0, state.coyote - seconds),
    buffer: pressed && !state.held ? JUMP_BUFFER : Math.max(0, state.buffer - seconds),
    held: pressed,
  };
}

export function shouldJump(state: JumpState) {
  return state.buffer > 0 && state.coyote > 0;
}

export function consumeJump(state: JumpState): JumpState {
  return { ...state, buffer: 0, coyote: 0 };
}

// Releasing the key early trims the rise, so tap height and hold height differ.
export function cutJump(velocityY: number, held: boolean) {
  return !held && velocityY > 0 ? velocityY * JUMP_CUT : velocityY;
}

// A kerb or a low step should be walked over, not bumped into. Two probes
// decide it: one at foot height and one at stepping height. Something under
// the foot and nothing at the step is a kerb; a hit at both is a wall.
export function isStep(footContact: number | null, stepContact: number | null, reach: number) {
  return footContact !== null && footContact <= reach && (stepContact === null || stepContact > reach);
}

// Turning eases toward the heading instead of snapping, framerate independent.
export function turnToward(current: number, target: number, seconds: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * (1 - Math.exp(-TURN_RATE * seconds));
}
