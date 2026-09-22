import type { Character, Lifestyle } from '../types/character';

const lifestyleScores: Record<Lifestyle, [number, number, number]> = {
  'street-racer': [24, 15, 25], 'nightlife-owner': [14, 27, 30], fixer: [20, 23, 17],
  influencer: [12, 30, 28], hustler: [19, 20, 18], detective: [16, 18, 14], kingpin: [32, 30, 18],
};
const districtBonus: Record<string, [number, number]> = {
  'Ocean Heights': [9, 10], 'Neon Harbor': [6, 12], 'Sunset Strip': [10, 11], 'Coral Bay': [12, 7],
  'Little Palma': [8, 8], 'Downtown Vice': [9, 6], 'South Point': [5, 10],
};

export function scoreCharacter(character: Pick<Character, 'lifestyle' | 'district' | 'wantedLevel'>) {
  const [heatBase, repBase, styleBase] = lifestyleScores[character.lifestyle];
  const [repDistrict = 5, styleDistrict = 5] = districtBonus[character.district] ?? [];
  return {
    heat: Math.min(100, 20 + heatBase + character.wantedLevel * 10),
    reputation: Math.min(100, 30 + repBase + repDistrict + character.wantedLevel * 4),
    style: Math.min(100, 34 + styleBase + styleDistrict + character.wantedLevel * 3),
  };
}

export const bountyFor = (level: number) => [0, 5000, 25000, 75000, 250000, 1000000][level];
export const caseId = (id: string) => `VC-${id.slice(-4).toUpperCase()}-${(id.length * 13 + 17) % 99}`;

const headlines: Record<Lifestyle, string[]> = {
  'street-racer': ['Mystery driver escapes police after coastal pursuit', 'Illegal street race shuts down {district}'],
  'nightlife-owner': ['Authorities investigate club after midnight raid', 'Exclusive guest list draws VMPD attention'],
  fixer: ['Unknown intermediary linked to three closed cases', 'City sources report a problem quietly disappeared'],
  influencer: ['Viral ViceFeed post becomes unexpected police evidence', 'Local creator trends after chaotic downtown night'],
  hustler: ['Late-night deal sends rumors through {district}', 'New player turns small moves into citywide heat'],
  detective: ['Internal files surface after unexplained evidence leak', 'Off-book investigation unsettles VMPD command'],
  kingpin: ['Task force investigates suspected criminal network', 'Authorities increase surveillance across multiple districts'],
};

export function generateHeadline(c: Character) {
  const index = [...c.id].reduce((a, v) => a + v.charCodeAt(0), 0) % headlines[c.lifestyle].length;
  return headlines[c.lifestyle][index].replace('{district}', c.district);
}
