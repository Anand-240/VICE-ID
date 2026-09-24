import test from 'node:test';
import assert from 'node:assert/strict';
import { closestWall, signalTarget, nearbyWall, targetedWall, wallResponseReady, WALLS } from '../src/game/walls.ts';
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

test('surface guide selects the nearest surface even outside interaction range', () => {
  assert.equal(closestWall(-38, 8).id, 'market');
  assert.equal(closestWall(0, 46).id, 'canal');
  assert.equal(closestWall(5, -36).id, 'club');
});

test('signal choices produce separate bounded investigation destinations', () => {
  const wall = { x: 9, z: 32 };
  assert.deepEqual(signalTarget(wall, 'mark'), { x: 6, z: 32 });
  assert.deepEqual(signalTarget(wall, 'north'), { x: 6, z: 18 });
  assert.deepEqual(signalTarget(wall, 'south'), { x: 6, z: 46 });
  assert.equal(signalTarget({ x: 9, z: 58 }, 'south').z, 60);
});

test('the aimed wall is the one the player faces from its painted side', () => {
  const canal = WALLS.find(wall => wall.id === 'canal');
  // Standing back from the canal wall and looking straight at it.
  const facing = Math.atan2(canal.x - 0, canal.z - 32);
  assert.equal(targetedWall(0, 32, facing)?.id, 'canal');
  // Same spot, back turned: nothing is targeted.
  assert.equal(targetedWall(0, 32, facing + Math.PI), undefined);
  // Behind the wall, where the painted face is unreachable.
  assert.equal(targetedWall(canal.x + 4, 32, Math.atan2(-1, 0)), undefined);
  // Too far away to aim at.
  assert.equal(targetedWall(-40, 32, facing), undefined);
});

test('aiming picks the wall nearest the line of sight, not merely the nearest wall', () => {
  const market = WALLS.find(wall => wall.id === 'market');
  const toMarket = Math.atan2(market.x - 4, market.z - 6);
  assert.equal(targetedWall(4, 6, toMarket)?.id, 'market');
});
