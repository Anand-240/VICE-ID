import test from 'node:test';
import assert from 'node:assert/strict';
import { aimElevation, applyDamage, canFire, canReload, fire, holster, HOLSTERED, MAGAZINE, PLAYER_HEALTH, POLICE_RANGE, policeShotHits, regenerate, REGEN_DELAY, RELOAD_TIME, reload, resolveShot, tickWeapon, AIM_RANGE } from '../src/game/weapon.ts';

const drawn = { ...HOLSTERED, drawn: true, aiming: true };

test('a shot needs a drawn weapon, an aim, ammunition and a finished cooldown', () => {
  assert.equal(canFire(HOLSTERED), false);
  assert.equal(canFire({ ...drawn, aiming: false }), false);
  assert.equal(canFire({ ...drawn, ammo: 0 }), false);
  assert.equal(canFire({ ...drawn, cooldown: .2 }), false);
  assert.equal(canFire({ ...drawn, reloading: 1 }), false);
  assert.equal(canFire(drawn), true);
});

test('firing spends one round and blocks the next shot until the cooldown runs out', () => {
  const after = fire(drawn);
  assert.equal(after.ammo, MAGAZINE - 1);
  assert.equal(canFire(after), false);
  assert.equal(canFire(tickWeapon(after, after.cooldown)), true);
  // Cooldown is time based, so a slow frame cannot grant a free extra shot.
  assert.equal(fire(after).ammo, MAGAZINE - 1);
});

test('reloading refills from reserve and cannot start with a full magazine', () => {
  const empty = { ...drawn, ammo: 0 };
  assert.equal(canReload(empty), true);
  assert.equal(canReload(drawn), false);
  const reloading = reload(empty);
  assert.equal(reloading.aiming, false);
  const done = tickWeapon(reloading, RELOAD_TIME);
  assert.equal(done.ammo, MAGAZINE);
  assert.equal(done.reserve, HOLSTERED.reserve - MAGAZINE);
});

test('holstering drops the aim so the reticle cannot survive putting the gun away', () => {
  assert.deepEqual(holster(drawn).drawn, false);
  assert.deepEqual(holster(drawn).aiming, false);
});

test('a shot hits the nearest officer on the aim line and misses ones off it', () => {
  const origin = { x: 0, y: 1.6, z: 0 };
  const direction = { x: 0, y: 0, z: 1 };
  const near = { id: 'near', x: 0, y: 1.6, z: 8 };
  const far = { id: 'far', x: 0, y: 1.6, z: 20 };
  const beside = { id: 'beside', x: 4, y: 1.6, z: 8 };
  assert.equal(resolveShot(origin, direction, [far, near, beside], () => false)?.target.id, 'near');
  assert.equal(resolveShot(origin, direction, [beside], () => false), null);
  // Behind the player, and past the weapon's range.
  assert.equal(resolveShot(origin, direction, [{ id: 'back', x: 0, y: 1.6, z: -8 }], () => false), null);
  assert.equal(resolveShot(origin, direction, [{ id: 'away', x: 0, y: 1.6, z: AIM_RANGE + 5 }], () => false), null);
});

test('cover stops a shot, and the officer behind cover is not swapped for a further one', () => {
  const origin = { x: 0, y: 1.6, z: 0 };
  const direction = { x: 0, y: 0, z: 1 };
  const targets = [{ id: 'near', x: 0, y: 1.6, z: 8 }, { id: 'far', x: 0, y: 1.6, z: 20 }];
  assert.equal(resolveShot(origin, direction, targets, () => true), null);
  assert.equal(resolveShot(origin, direction, targets, target => target.id === 'near')?.target.id, 'far');
});

test('police accuracy falls with range and with a moving target, and stops at their range', () => {
  assert.equal(policeShotHits(POLICE_RANGE + 1, false, 0), false);
  // A still target up close is the easiest shot; the same roll misses further out.
  assert.equal(policeShotHits(3, false, .5), true);
  assert.equal(policeShotHits(26, false, .5), false);
  // Running cuts their chance at the same distance.
  assert.equal(policeShotHits(12, false, .45), true);
  assert.equal(policeShotHits(12, true, .45), false);
});

test('damage floors at zero and healing waits out the delay before it starts', () => {
  assert.equal(applyDamage(10, 14), 0);
  assert.equal(applyDamage(PLAYER_HEALTH, 14), PLAYER_HEALTH - 14);
  assert.equal(regenerate(50, REGEN_DELAY - .1, 1), 50);
  assert.ok(regenerate(50, REGEN_DELAY, 1) > 50);
  // A downed player does not quietly heal back up.
  assert.equal(regenerate(0, 30, 5), 0);
  assert.equal(regenerate(PLAYER_HEALTH, 30, 5), PLAYER_HEALTH);
});

test('the shot elevation is level at the resting camera pitch and is bounded', () => {
  assert.equal(aimElevation(.18), 0);
  // Dragging the camera down aims down, dragging it up aims up.
  assert.ok(aimElevation(.5) < 0);
  assert.ok(aimElevation(-.1) > 0);
  assert.ok(Math.abs(aimElevation(-99)) <= .46 && Math.abs(aimElevation(99)) <= .46);
});
