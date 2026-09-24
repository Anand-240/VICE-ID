import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceAwareness, officerDetection, policeSpeed, findPolicePath, responseActive } from '../src/game/police.ts';

test('standing beside an officer is detected from behind and quickly confirms identity', () => {
  const close = officerDetection(2, -1, true, false);
  assert.equal(close.visible, true);
  assert.equal(advanceAwareness(35, [close], 1, false), 100);
  assert.equal(officerDetection(8, -1, true, false).visible, false);
});

test('walls and vertical separation prevent arrests; touching range is required', () => {
  assert.equal(officerDetection(1, 1, false, true).contact, false);
  assert.equal(officerDetection(1, 1, true, true, 2).contact, false);
  assert.equal(officerDetection(2, 1, true, true).contact, false);
  assert.equal(officerDetection(1.2, -1, true, true).contact, true);
});

test('awareness depends on exposure time and distance, not number of frame callbacks', () => {
  const close = officerDetection(4, 1, true, false);
  const far = officerDetection(20, 1, true, false);
  assert.ok(advanceAwareness(0, [close], 1, false) > advanceAwareness(0, [far], 1, false));
  let smallSteps = 0;
  for (let i = 0; i < 60; i++) smallSteps = advanceAwareness(smallSteps, [close], 1/60, false);
  assert.ok(Math.abs(smallSteps - advanceAwareness(0, [close], 1, false)) < 1e-8);
  assert.equal(advanceAwareness(0, [close, close], 1, false), advanceAwareness(0, [close], 1, false));
  assert.equal(advanceAwareness(100, [], 5, true), 50);
  assert.equal(advanceAwareness(0, [], 1, false), 0);
});

test('patrol camera increases awareness but cannot arrest; pursuit runs faster than investigation', () => {
  const camera = { visible: true, distance: 2, rate: 28, contact: false, source: 'vehicle' };
  assert.equal(advanceAwareness(35, [camera], 3, false), 100);
  assert.equal(camera.contact, false);
  assert.ok(policeSpeed(100, true) > policeSpeed(35, false));
  assert.ok(policeSpeed(100, true) < 6.5, 'sprinting player should retain a small speed advantage');
});

test('navigation routes around a solid obstacle and does not cross its corners', () => {
  const start = { x: -5, z: 0 }, goal = { x: 5, z: 0 };
  const clear = (a, b) => {
    for (let i = 0; i <= 100; i++) {
      const x = a.x + (b.x-a.x)*i/100, z = a.z + (b.z-a.z)*i/100;
      if (Math.abs(x) < 2 && Math.abs(z) < 3) return false;
    }
    return true;
  };
  const path = findPolicePath(start, goal, clear);
  assert.deepEqual(path.at(-1), goal);
  assert.ok(path.some(p => Math.abs(p.z) >= 3));
  let previous = start;
  for (const point of path) { assert.ok(clear(previous, point)); previous = point; }
  assert.deepEqual(findPolicePath(start, goal, () => false), []);
});

test('crouching shortens the range you are spotted at and slows identification', () => {
  const standing = officerDetection(20, 1, true, false);
  const crouched = officerDetection(20, 1, true, false, 0, true);
  assert.equal(standing.visible, true);
  assert.equal(crouched.visible, false, 'the same distance is outside their crouched spotting range');
  // Inside range, a crouched target is still identified, just more slowly.
  const near = officerDetection(8, 1, true, false, 0, true);
  assert.equal(near.visible, true);
  assert.ok(near.rate < officerDetection(8, 1, true, false).rate);
  // Standing on top of an officer gives you away either way.
  assert.equal(officerDetection(1.2, -1, true, false, 0, true).contact, true);
});

test('gunfire puts VMPD in response mode without waiting on the wall clock', () => {
  // No graffiti dispatched and no shots: the street is only suspicious.
  assert.equal(responseActive(false, 0), false);
  // A dispatched wall incident is the original trigger.
  assert.equal(responseActive(true, 0), true);
  // One shot is enough on its own. Without this the force stays frozen while
  // awareness sits at 100, because every officer frame is gated on this flag.
  assert.equal(responseActive(false, 1), true);
  assert.equal(responseActive(true, 3), true);
});
