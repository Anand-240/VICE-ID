import type { Character, CityEvent, CityState, DistrictState, Lifestyle } from '../types/character';

const allDistricts = ['Neon Harbor', 'Ocean Heights', 'Sunset Strip', 'Coral Bay', 'Downtown Vice', 'Little Palma', 'South Point'];
const lifestyleImpact: Record<Lifestyle, { heat: number; rep: number; buzz: number; affected: number; event: string }> = {
  'street-racer': { heat: 15, rep: 8, buzz: 70, affected: 3, event: 'Illegal racing activity linked to the published subject.' },
  'nightlife-owner': { heat: 9, rep: 12, buzz: 88, affected: 3, event: 'Club district surveillance increased after the poster spread.' },
  fixer: { heat: 13, rep: 6, buzz: 48, affected: 2, event: 'Intelligence analysts connect the subject to unresolved activity.' },
  influencer: { heat: 6, rep: 16, buzz: 96, affected: 4, event: 'Viral identity campaign dominates local social feeds.' },
  hustler: { heat: 10, rep: 14, buzz: 68, affected: 2, event: 'Neighborhood discussion turns a local name into city news.' },
  detective: { heat: 8, rep: 7, buzz: 42, affected: 2, event: 'Internal VMPD systems flag unusual access around the case.' },
  kingpin: { heat: 18, rep: 15, buzz: 84, affected: 5, event: 'Task force expands operations across multiple districts.' },
};

const time = (minute: number) => `23:${String(41 + minute).padStart(2, '0')}`;

export function generateCityImpact(c: Character): CityState {
  const profile = lifestyleImpact[c.lifestyle];
  const ordered = [c.district, ...allDistricts.filter((d) => d !== c.district)];
  const affectedDistricts = ordered.slice(0, Math.min(7, profile.affected + (c.wantedLevel >= 4 ? 1 : 0)));
  const heatDelta = Math.min(24, profile.heat + Math.max(0, c.wantedLevel - 3) * 2);
  const reputationDelta = Math.min(20, profile.rep + Math.round(c.wantedLevel / 2));
  const buzz = Math.min(100, Math.round((profile.buzz + c.reputation) / 2 + c.wantedLevel * 3));
  const multiplier = 1 + c.wantedLevel * .35 + (c.lifestyle === 'influencer' ? .75 : c.lifestyle === 'kingpin' ? .45 : 0);
  const posterReach = Math.round((c.reputation * 100 + 1200) * multiplier);
  const policeAttention = Math.min(100, c.heat + heatDelta + c.wantedLevel * 3);
  const districtStates = Object.fromEntries(allDistricts.map((district, index) => {
    const affectedIndex = affectedDistricts.indexOf(district);
    const active = affectedIndex >= 0;
    const status: DistrictState['status'] = !active ? 'normal' : affectedIndex === 0 && c.wantedLevel >= 4 ? 'high-alert' : affectedIndex <= 1 && c.wantedLevel >= 3 ? 'police-active' : buzz > 70 ? 'trending' : 'watched';
    return [district, { status, posterSightings: active ? Math.max(1, c.wantedLevel * 2 + profile.affected - Math.max(0, affectedIndex)) : 0, policeUnits: active ? Math.max(1, c.wantedLevel + (affectedIndex === 0 ? 2 : 0)) : 0, socialBuzz: active ? Math.max(18, buzz - Math.max(0, affectedIndex) * 11) : 8, latestEvent: active ? (district === c.district ? profile.event : `Poster copies detected across ${district}.`) : 'No linked activity.' } satisfies DistrictState];
  }));
  const events: CityEvent[] = [
    { id: 'publish', type: 'poster', timestamp: time(0), district: c.district, title: 'WANTED POSTER PUBLISHED', description: `${c.alias}'s visual identity entered the Vice Coast network.` },
    { id: 'social', type: 'social', timestamp: time(1), district: c.district, title: 'VICEFEED POST CREATED', description: `The poster begins spreading from ${c.district}.`, buzzDelta: 18 },
    { id: 'trend', type: 'district', timestamp: time(2), district: c.district, title: `${c.district.toUpperCase()} TRENDING`, description: profile.event, reputationDelta: Math.ceil(reputationDelta / 2) },
    { id: 'match', type: 'police', timestamp: time(3), district: c.district, title: 'VMPD IDENTIFIES SUBJECT', description: `Visual match confirmed for ${c.name} “${c.alias}”.`, heatDelta: Math.ceil(heatDelta / 2) },
    { id: 'response', type: 'police', timestamp: time(5), district: affectedDistricts[1] || c.district, title: 'POLICE ACTIVITY INCREASES', description: `Patrol presence increased near ${affectedDistricts[1] || c.district}.`, heatDelta: heatDelta - Math.ceil(heatDelta / 2) },
    { id: 'media', type: 'media', timestamp: time(7), district: c.district, title: 'VICEWIRE PUBLISHES IDENTITY REPORT', description: `${c.lifestyle.replace('-', ' ')} profile becomes a city headline.`, reputationDelta: reputationDelta - Math.ceil(reputationDelta / 2) },
    { id: 'status', type: 'sighting', timestamp: time(10), district: affectedDistricts.at(-1), title: 'WANTED STATUS UPDATED', description: `${affectedDistricts.length} districts now report linked activity.` },
  ];
  return { initialHeat: c.heat, initialReputation: c.reputation, heat: Math.min(100, c.heat + heatDelta), reputation: Math.min(100, c.reputation + reputationDelta), buzz, posterReach, policeAttention, affectedDistricts, districtStates, events, hoursSimulated: 0 };
}

export function simulateNextHour(city: CityState): CityState {
  const hours = city.hoursSimulated + 1;
  const heatGain = Math.max(2, 6 - hours), repGain = Math.max(2, 5 - hours);
  const district = allDistricts[(city.affectedDistricts.length + hours - 1) % allDistricts.length];
  const affectedDistricts = city.affectedDistricts.includes(district) ? city.affectedDistricts : [...city.affectedDistricts, district];
  const minutes = 23 * 60 + 51 + hours * 60;
  const timestamp = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const event: CityEvent = { id: `hour-${hours}`, type: hours % 2 ? 'sighting' : 'police', timestamp, district, title: hours % 2 ? 'NEW SUBJECT SIGHTING' : 'PATROL GRID EXPANDED', description: `New activity connected to the poster near ${district}.`, heatDelta: heatGain, reputationDelta: repGain, buzzDelta: 4 };
  return { ...city, heat: Math.min(100, city.heat + heatGain), reputation: Math.min(100, city.reputation + repGain), buzz: Math.min(100, city.buzz + 4), posterReach: Math.round(city.posterReach * 1.32), policeAttention: Math.min(100, city.policeAttention + 5), affectedDistricts, districtStates: { ...city.districtStates, [district]: { ...city.districtStates[district], status: city.heat > 75 ? 'high-alert' : 'police-active', posterSightings: city.districtStates[district].posterSightings + 4, policeUnits: city.districtStates[district].policeUnits + 2, socialBuzz: Math.min(100, city.districtStates[district].socialBuzz + 12), latestEvent: event.description } }, events: [...city.events, event], hoursSimulated: hours };
}

export const heatLabel = (v: number) => v > 80 ? 'CITYWIDE ALERT' : v > 60 ? 'HIGH PRIORITY' : v > 40 ? 'ACTIVE' : v > 20 ? 'WATCHED' : 'LOW';
export const buzzLabel = (v: number) => v > 80 ? 'CITYWIDE' : v > 60 ? 'VIRAL' : v > 40 ? 'TRENDING' : v > 20 ? 'PICKING UP' : 'QUIET';
