import test from 'node:test';
import assert from 'node:assert/strict';
import { approachVelocity, isStep, consumeJump, cutJump, COYOTE_TIME, GROUND_ACCEL, JUMP_BUFFER, JUMP_CUT, RESTING_JUMP, shouldJump, STEP_HEIGHT, tickJump, turnToward } from '../src/game/locomotion.ts';
import { CROUCH_SPEED, moveSpeed, playerSpeed } from '../src/game/movement.ts';

test('velocity is acceleration limited, so speed builds instead of snapping', () => {
  const stopped = { x: 0, z: 0 };
  const target = { x: 6, z: 0 };
  const step = approachVelocity(stopped, target, true, 1 / 60);
  assert.ok(step.x > 0 && step.x < target.x, 'moves toward the target without reaching it');
  assert.ok(Math.abs(step.x - GROUND_ACCEL / 60) < 1e-6, 'bounded by ground acceleration');
  // Two half steps cover the same ground as one whole step: frame rate independent.
  const once = approachVelocity(stopped, target, true, .2);
  const twice = approachVelocity(approachVelocity(stopped, target, true, .1), target, true, .1);
  assert.ok(Math.abs(once.x - twice.x) < 1e-9);
});

test('a reachable target is met exactly and never overshot', () => {
  const near = approachVelocity({ x: 5.999, z: 0 }, { x: 6, z: 0 }, true, .5);
  assert.deepEqual(near, { x: 6, z: 0 });
});

test('the air gives far less control than the ground', () => {
  const desired = { x: 6, z: 0 };
  const onGround = approachVelocity({ x: 0, z: 0 }, desired, true, .1);
  const inAir = approachVelocity({ x: 0, z: 0 }, desired, false, .1);
  assert.ok(inAir.x < onGround.x);
  // Releasing the stick brakes hard on the ground and drifts in the air.
  const braking = approachVelocity({ x: 6, z: 0 }, { x: 0, z: 0 }, true, .1);
  const drifting = approachVelocity({ x: 6, z: 0 }, { x: 0, z: 0 }, false, .1);
  assert.ok(braking.x < drifting.x);
});

test('coyote time lets a jump land just after walking off an edge', () => {
  let state = tickJump(RESTING_JUMP, true, false, 1 / 60);
  assert.equal(state.coyote, COYOTE_TIME);
  state = tickJump(state, false, false, .05);
  state = tickJump(state, false, true, 1 / 60);
  assert.equal(shouldJump(state), true, 'still jumpable inside the grace window');
  let late = tickJump(RESTING_JUMP, true, false, 1 / 60);
  late = tickJump(late, false, false, COYOTE_TIME + .01);
  late = tickJump(late, false, true, 1 / 60);
  assert.equal(shouldJump(late), false);
});

test('a jump pressed just before landing still fires, and only once', () => {
  let state = tickJump(RESTING_JUMP, false, true, 1 / 60);
  assert.equal(state.buffer, JUMP_BUFFER);
  assert.equal(shouldJump(state), false, 'airborne with no coyote left');
  state = tickJump(state, true, true, .05);
  assert.equal(shouldJump(state), true, 'fires on touchdown');
  assert.equal(shouldJump(consumeJump(state)), false, 'consumed, so it cannot repeat');
  // Holding the key does not re-arm the buffer.
  const expired = tickJump({ coyote: 0, buffer: 0, held: true }, false, true, 1 / 60);
  assert.equal(expired.buffer, 0);
});

test('releasing early trims the rise but never affects a fall', () => {
  assert.equal(cutJump(5, true), 5);
  assert.equal(cutJump(5, false), 5 * JUMP_CUT);
  assert.equal(cutJump(-4, false), -4);
});

test('kerbs are stepped over, walls are not', () => {
  // Something under the foot, nothing at stepping height: a kerb.
  assert.equal(isStep(.3, null, .62), true);
  // A hit at both heights is a wall, not a step.
  assert.equal(isStep(.3, .3, .62), false);
  assert.equal(isStep(null, null, .62), false, 'nothing in the way');
  assert.equal(isStep(.9, null, .62), false, 'too far ahead to be stepped on now');
  // The step probe clearing further out than the foot still counts as a kerb.
  assert.equal(isStep(.3, .8, .62), true);
});

test('turning eases toward a heading and takes the short way round', () => {
  const turned = turnToward(0, Math.PI / 2, 1 / 60);
  assert.ok(turned > 0 && turned < Math.PI / 2);
  // Crossing the wrap point turns backwards, not the long way around.
  assert.ok(turnToward(3.1, -3.1, 1 / 60) > 3.1);
});

test('crouch, aim, sprint and the escape boost agree on one speed', () => {
  assert.equal(moveSpeed({ pursuit: false, sprinting: false }), playerSpeed(false, false));
  assert.equal(moveSpeed({ pursuit: false, sprinting: true }), playerSpeed(false, true));
  assert.equal(moveSpeed({ pursuit: false, sprinting: false, crouching: true }), CROUCH_SPEED);
  // Crouching is the slowest state even while the escape boost is on.
  assert.equal(moveSpeed({ pursuit: true, sprinting: true, crouching: true }), CROUCH_SPEED);
  assert.ok(moveSpeed({ pursuit: false, sprinting: false, aiming: true }) < playerSpeed(false, false));
});
