import test from 'node:test';
import assert from 'node:assert/strict';
import { awarenessJump, callsPolice, classifyWitness, hasInspected, MARK_INSPECT_RANGE, MARK_NOTICE_RANGE, noticesMark } from '../src/game/witness.ts';

test('a mark has to be visible and in range to be noticed', () => {
  assert.equal(noticesMark(10, true), true);
  // Painting behind cover, or far up the street, goes unnoticed.
  assert.equal(noticesMark(10, false), false);
  assert.equal(noticesMark(MARK_NOTICE_RANGE + 1, true), false);
  assert.equal(noticesMark(MARK_NOTICE_RANGE, true), true);
});

test('a mark counts as seen only once someone is close enough to read it', () => {
  assert.equal(hasInspected(MARK_INSPECT_RANGE), true);
  assert.equal(hasInspected(MARK_INSPECT_RANGE + .1), false);
});

test('recognising a face on its own is suspicion, not a police call', () => {
  const report = classifyWitness(false, false, true);
  assert.equal(report, 'suspicion');
  assert.equal(callsPolice(report), false);
  assert.equal(awarenessJump(report, true), 0);
});

test('having seen the mark first turns recognition into a report', () => {
  const linked = classifyWitness(true, false, true);
  assert.equal(linked, 'linked');
  assert.equal(callsPolice(linked), true);
  assert.ok(awarenessJump(linked, false) > 0);
  // An influencer spreads it further than an ordinary passer by.
  assert.ok(awarenessJump(linked, true) > awarenessJump(linked, false));
});

test('being caught painting is the strongest report and needs no poster', () => {
  const caught = classifyWitness(false, true, false);
  assert.equal(caught, 'caught');
  assert.equal(callsPolice(caught), true);
  assert.ok(awarenessJump(caught, false) > awarenessJump(classifyWitness(true, false, true), false));
});

test('with no posters up and nothing seen, nobody has anything to report', () => {
  const report = classifyWitness(false, false, false);
  assert.equal(report, 'none');
  assert.equal(callsPolice(report), false);
});
