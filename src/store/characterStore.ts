import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { imageStorage } from '../lib/storage';
import type { Character, CityState, DistrictOutcome, Stage, WantedLevel } from '../types/character';
import { generateCityImpact, simulateNextHour } from '../lib/city';

const initialCharacter: Character = {
  id: `vice-${Date.now().toString(36)}`, name: '', alias: '', district: 'Neon Harbor', lifestyle: 'street-racer',
  wantedLevel: 4, reputation: 0, heat: 0, style: 0, createdAt: new Date().toISOString(),
};

interface ViceState {
  stage: Stage;
  character: Character;
  cityState?: CityState;
  posterPublished: boolean;
  districtOutcome?: DistrictOutcome;
  setStage: (stage: Stage) => void;
  updateCharacter: (data: Partial<Character>) => void;
  publishPoster: () => void;
  simulateHour: () => void;
  completeDistrict: (outcome: DistrictOutcome) => void;
  restart: () => void;
}

export const useCharacterStore = create<ViceState>()(persist((set) => ({
  stage: 'landing', character: initialCharacter, posterPublished: false,
  setStage: (stage) => set({ stage }),
  updateCharacter: (data) => set((s) => ({ character: { ...s.character, ...data } })),
  publishPoster: () => set((s) => { const cityState = generateCityImpact(s.character); return { posterPublished: true, cityState, character: { ...s.character, heat: cityState.heat, reputation: cityState.reputation } }; }),
  simulateHour: () => set((s) => { if (!s.cityState) return s; const cityState = simulateNextHour(s.cityState); return { cityState, character: { ...s.character, heat: cityState.heat, reputation: cityState.reputation } }; }),
  completeDistrict: (outcome) => set((s) => {
    if (!s.cityState) return { districtOutcome: outcome };
    const district = outcome.district || s.character.district;
    const current = s.cityState.districtStates[district] || { status: 'normal' as const, posterSightings: 0, policeUnits: 0, socialBuzz: 0, latestEvent: 'No linked activity.' };
    const wantedLevel = Math.min(5, s.character.wantedLevel + (outcome.policeReports > 0 ? 1 : 0)) as WantedLevel;
    const cityState: CityState = {
      ...s.cityState,
      heat: Math.min(100, s.cityState.heat + outcome.heatDelta), reputation: Math.min(100, s.cityState.reputation + outcome.reputationDelta), buzz: Math.min(100, s.cityState.buzz + outcome.buzzDelta), posterReach: s.cityState.posterReach + outcome.reachDelta, policeAttention: Math.min(100, s.cityState.policeAttention + outcome.policeReports * 6),
      affectedDistricts: s.cityState.affectedDistricts.includes(district) ? s.cityState.affectedDistricts : [...s.cityState.affectedDistricts, district],
      districtStates: { ...s.cityState.districtStates, [district]: { ...current, status: outcome.policeReports ? 'high-alert' : 'trending', posterSightings: current.posterSightings + outcome.posterSightings, policeUnits: current.policeUnits + outcome.policeReports, socialBuzz: Math.min(100, current.socialBuzz + outcome.buzzDelta), latestEvent: outcome.policeReports ? `Subject identified in ${district}. Patrol grid expanded.` : `Player-created poster is spreading through ${district}.` } },
      events: [...s.cityState.events, { id: `district-play-${district.toLowerCase().replace(/\s/g, '-')}-${s.cityState.events.length}`, type: 'sighting', timestamp: '23:57', district, title: outcome.policeReports ? `SUBJECT IDENTIFIED IN ${district.toUpperCase()}` : `${district.toUpperCase()} POSTER SIGHTINGS INCREASE`, description: `${outcome.npcRecognitions} NPC recognitions and ${outcome.policeReports} police reports logged.`, heatDelta: outcome.heatDelta, reputationDelta: outcome.reputationDelta, buzzDelta: outcome.buzzDelta }],
    };
    return { districtOutcome: outcome, cityState, character: { ...s.character, heat: cityState.heat, reputation: cityState.reputation, wantedLevel } };
  }),
  restart: () => set({ stage: 'landing', character: { ...initialCharacter, id: `vice-${Date.now().toString(36)}`, createdAt: new Date().toISOString() }, cityState: undefined, posterPublished: false, districtOutcome: undefined }),
}), { name: 'vice-id-session', storage: createJSONStorage(() => imageStorage), partialize: (s) => ({ stage: s.stage === 'district' ? 'impact' : s.stage, character: s.character, cityState: s.cityState, posterPublished: s.posterPublished, districtOutcome: s.districtOutcome }) }));
