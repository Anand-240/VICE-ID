import test from 'node:test';
import assert from 'node:assert/strict';
import { autoBoost, playerSpeed, AUTO_BOOST_AWARENESS } from '../src/game/movement.ts';
import { policeSpeed } from '../src/game/police.ts';

test('automatic escape speed exceeds pursuing police without a sprint key', () => {
  assert.ok(playerSpeed(true, false) > policeSpeed(100, true));
  assert.equal(playerSpeed(true, false), playerSpeed(true, true));
});
test('normal movement returns to walking or manual sprint after escape', () => {
  assert.equal(playerSpeed(false, false), 3.75);
  assert.equal(playerSpeed(false, true), 6.5);
});
test('boost engages on rising awareness before a pursuit starts', () => {
  assert.equal(AUTO_BOOST_AWARENESS, 50);
  assert.equal(autoBoost(AUTO_BOOST_AWARENESS - 1, false), false);
  assert.equal(autoBoost(AUTO_BOOST_AWARENESS, false), true);
  assert.equal(autoBoost(0, true), true);
});
test('boosted player outruns police at every awareness level', () => {
  for (const awareness of [AUTO_BOOST_AWARENESS, 70, 85, 100]) {
    assert.ok(playerSpeed(autoBoost(awareness, false), false) > policeSpeed(awareness, false));
    assert.ok(playerSpeed(autoBoost(awareness, true), false) > policeSpeed(awareness, true));
  }
});
