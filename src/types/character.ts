export type Lifestyle = 'street-racer' | 'nightlife-owner' | 'fixer' | 'influencer' | 'hustler' | 'detective' | 'kingpin';
export type WantedLevel = 1 | 2 | 3 | 4 | 5;

export interface Character {
  id: string;
  name: string;
  alias: string;
  district: string;
  lifestyle: Lifestyle;
  crew?: string;
  wantedLevel: WantedLevel;
  reputation: number;
  heat: number;
  style: number;
  originalImage?: string;
  editedImage?: string;
  wantedPosterImage?: string;
  bio?: string;
  createdAt: string;
}

export type Stage = 'landing' | 'creator' | 'studio' | 'dossier' | 'poster' | 'impact' | 'district' | 'feed' | 'final';

export type CityEventType = 'social' | 'police' | 'media' | 'sighting' | 'district' | 'poster';
export type DistrictStatus = 'normal' | 'watched' | 'trending' | 'police-active' | 'high-alert';

export interface CityEvent {
  id: string;
  type: CityEventType;
  timestamp: string;
  district?: string;
  title: string;
  description: string;
  heatDelta?: number;
  reputationDelta?: number;
  buzzDelta?: number;
}

export interface DistrictState {
  status: DistrictStatus;
  posterSightings: number;
  policeUnits: number;
  socialBuzz: number;
  latestEvent: string;
}

export interface CityState {
  initialHeat: number;
  initialReputation: number;
  heat: number;
  reputation: number;
  buzz: number;
  posterReach: number;
  policeAttention: number;
  affectedDistricts: string[];
  districtStates: Record<string, DistrictState>;
  events: CityEvent[];
  hoursSimulated: number;
}

export interface DistrictOutcome {
  district?: string;
  completed: boolean;
  result: 'escaped-attention' | 'identity-confirmed' | 'citywide-trending' | 'high-priority' | 'arrested';
  npcRecognitions: number;
  policeReports: number;
  posterSightings: number;
  heatDelta: number;
  reputationDelta: number;
  buzzDelta: number;
  reachDelta: number;
  lastSeen: string;
}
