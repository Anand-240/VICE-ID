import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCityImpact, simulateNextHour } from '../src/lib/city.ts';
import { scoreCharacter, bountyFor } from '../src/lib/scoring.ts';
import { DISTRICT_THEMES } from '../src/game/districts.ts';

const character = { id:'audit', name:'Audit', alias:'Neon', district:'Neon Harbor', lifestyle:'street-racer', wantedLevel:4, heat:74, reputation:72, style:84, createdAt:'2026-09-22T00:00:00Z' };

test('publication initializes all seven districts and character-specific events', () => {
  const city = generateCityImpact(character);
  assert.equal(Object.keys(city.districtStates).length, 7);
  assert.ok(city.posterReach > 0);
  assert.ok(city.events.some(e => e.description.includes(character.alias)));
  assert.deepEqual(generateCityImpact(character), city);
});
test('hour simulation preserves input, increases reach and caps metrics through rollover', () => {
  const initial = generateCityImpact(character); const snapshot = JSON.stringify(initial);
  let city = initial;
  for (let i=0;i<30;i++) {
    const next = simulateNextHour(city);
    assert.ok(next.posterReach > city.posterReach);
    for (const key of ['heat','reputation','buzz','policeAttention']) assert.ok(next[key] >= 0 && next[key] <= 100);
    assert.match(next.events.at(-1).timestamp, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
    city = next;
  }
  assert.equal(JSON.stringify(initial), snapshot);
  assert.equal(city.hoursSimulated, 30);
  assert.equal(new Set(city.affectedDistricts).size, city.affectedDistricts.length);
});
test('districts have seven distinct layouts and valid spawns', () => {
  assert.equal(new Set(Object.values(DISTRICT_THEMES).map(d=>d.layout)).size, 7);
  for (const district of Object.values(DISTRICT_THEMES)) assert.ok(district.spawn.every(Number.isFinite));
});
test('all creator combinations have bounded scores and increasing bounty', () => {
  for (const district of Object.keys(DISTRICT_THEMES)) for (const lifestyle of ['street-racer','nightlife-owner','fixer','influencer','hustler','detective','kingpin']) for(let wantedLevel=1;wantedLevel<=5;wantedLevel++) {
    const score = scoreCharacter({...character,district,lifestyle,wantedLevel});
    for (const value of Object.values(score)) assert.ok(value >= 0 && value <= 100);
    if(wantedLevel > 1) assert.ok(bountyFor(wantedLevel)>bountyFor(wantedLevel-1));
  }
});
