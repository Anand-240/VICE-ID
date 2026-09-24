import test from 'node:test';
import assert from 'node:assert/strict';
import { nearbyWall, wallResponseReady } from '../src/game/walls.ts';
import { advanceAwareness, officerDetection } from '../src/game/police.ts';

test('poster suspicion cannot enable police response; first mark has ten seconds of grace', () => {
  const detection = officerDetection(1, 1, true, true);
  for (const age of [null, 0, 5, 9.999]) {
    const awareness = wallResponseReady(age) ? advanceAwareness(0, [detection], 1, false) : 0;
    assert.equal(awareness, 0);
  }
  assert.equal(wallResponseReady(10), true);
  assert.ok(advanceAwareness(0, [detection], 1, false) > 0);
});

test('wall editing requires proximity on the accessible face of the wall', () => {
  assert.equal(nearbyWall(6.2, 32)?.id, 'canal');
  assert.equal(nearbyWall(10, 32), undefined);
  assert.equal(nearbyWall(0, 32), undefined);
  assert.equal(nearbyWall(6.2, -3)?.id, 'market');
  assert.equal(nearbyWall(6.2, -29)?.id, 'club');
});
