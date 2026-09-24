import test from 'node:test';
import assert from 'node:assert/strict';
import { addTag, makeTag, MAX_TAGS, paintableSurface, TAG_HEIGHT, TAG_RANGE } from '../src/game/tags.ts';

const upright = { x: 3, y: 1.8, z: -4, nx: -1, ny: 0, nz: 0, distance: 2 };

test('only upright surfaces within reach take paint', () => {
  assert.equal(paintableSurface(upright), true);
  assert.equal(paintableSurface(null), false);
  // The road under your feet and the ceiling above it are not canvases.
  assert.equal(paintableSurface({ ...upright, nx: 0, ny: 1, nz: 0 }), false);
  assert.equal(paintableSurface({ ...upright, nx: 0, ny: -1, nz: 0 }), false);
  assert.equal(paintableSurface({ ...upright, distance: TAG_RANGE + .5 }), false);
  assert.equal(paintableSurface({ ...upright, y: .1 }), false);
  // A ray that started inside geometry reports no usable facing.
  assert.equal(paintableSurface({ ...upright, nx: 0, ny: 0, nz: 0 }), false);
});

test('a tag sits just off the surface it was sprayed on and never below its own height', () => {
  const tag = makeTag('tag-1', upright);
  assert.ok(tag.point[0] < upright.x, 'pushed out along the surface normal');
  assert.deepEqual(tag.normal, [upright.nx, upright.ny, upright.nz]);
  assert.equal(makeTag('tag-2', { ...upright, y: .3 }).point[1], TAG_HEIGHT / 2 + .1);
});

test('the tag list is bounded so a long run cannot grow textures without limit', () => {
  let tags = [];
  for (let index = 0; index < MAX_TAGS + 6; index++) tags = addTag(tags, makeTag(`tag-${index}`, upright));
  assert.equal(tags.length, MAX_TAGS);
  assert.equal(tags.at(-1).id, `tag-${MAX_TAGS + 5}`);
  assert.equal(tags[0].id, `tag-6`);
});
