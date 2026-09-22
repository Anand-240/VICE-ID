export interface DistrictTheme {
  name: string;
  code: string;
  tagline: string;
  accent: string;
  secondary: string;
  fog: string;
  ground: string;
  water: string;
  landmarks: [string, string, string, string, string];
  billboard: string;
  lastSeenPolice: string;
  lastSeenQuiet: string;
  feedHandle: string;
  heightBoost: number;
  layout: 'luxury' | 'harbor' | 'nightlife' | 'marina' | 'barrio' | 'downtown' | 'industrial';
  spawn: [number, number];
  startYaw: number;
}

export const DISTRICT_THEMES: Record<string, DistrictTheme> = {
  'Ocean Heights': {
    name: 'Ocean Heights', code: 'OH-01', tagline: 'LUXURY COAST // PRIVATE SECURITY', accent: '#ffba82', secondary: '#60d9e8', fog: '#35405a', ground: '#343741', water: '#17657b',
    landmarks: ['AZURE TOWERS', 'MIRAGE BEACH CLUB', 'OCEAN GALLERIA', 'SKYLINE CONDOS', 'MARINA HOUSE'], billboard: 'LIVE ABOVE THE COAST', lastSeenPolice: 'MIRAGE CLUB / OCEAN HEIGHTS', lastSeenQuiet: 'OCEAN HEIGHTS / MARINA WALK', feedHandle: '@oceanwatch', heightBoost: 5, layout: 'luxury', spawn: [-38, 8], startYaw: -Math.PI / 2,
  },
  'Neon Harbor': {
    name: 'Neon Harbor', code: 'NH-07', tagline: 'PORT DISTRICT // HIGH ALERT', accent: '#52d7e8', secondary: '#ff5f92', fog: '#342742', ground: '#252730', water: '#0b3447',
    landmarks: ['CLUB CURRENT', 'HARBOR STORAGE', 'NEON AUTO', 'VICE MART', 'BLUE PALM MOTEL'], billboard: 'VISIT CORAL BAY', lastSeenPolice: 'CLUB CURRENT / NEON HARBOR', lastSeenQuiet: 'NEON HARBOR / PIER 9', feedHandle: '@harborlive', heightBoost: 0, layout: 'harbor', spawn: [0, 38], startYaw: 0,
  },
  'Sunset Strip': {
    name: 'Sunset Strip', code: 'SS-12', tagline: 'NIGHTLIFE ROW // CROWD CONTROL', accent: '#ff4f9d', secondary: '#ff9a58', fog: '#48243f', ground: '#29232f', water: '#3b2749',
    landmarks: ['ECHO ROOM', 'STARLINE HOTEL', 'SUNSET RECORDS', 'PULSE ARCADE', 'ROYALE THEATER'], billboard: 'TONIGHT NEVER ENDS', lastSeenPolice: 'ECHO ROOM / SUNSET STRIP', lastSeenQuiet: 'SUNSET STRIP / STARLINE', feedHandle: '@stripafterdark', heightBoost: 3, layout: 'nightlife', spawn: [0, 46], startYaw: 0,
  },
  'Coral Bay': {
    name: 'Coral Bay', code: 'CB-04', tagline: 'PRIVATE COAST // MARINE PATROL', accent: '#f1bf68', secondary: '#ff766d', fog: '#554052', ground: '#3b3739', water: '#19768a',
    landmarks: ['CORAL YACHT CLUB', 'BAY HOUSE', 'SOL MARINA', 'PALM COURT', 'CAYO HOTEL'], billboard: 'YOUR PLACE IN THE SUN', lastSeenPolice: 'YACHT CLUB / CORAL BAY', lastSeenQuiet: 'CORAL BAY / SOL MARINA', feedHandle: '@coralcurrent', heightBoost: -2, layout: 'marina', spawn: [0, 44], startYaw: 0,
  },
  'Little Palma': {
    name: 'Little Palma', code: 'LP-09', tagline: 'LOCAL STREETS // COMMUNITY WATCH', accent: '#79d399', secondary: '#ff9a62', fog: '#34443e', ground: '#34332f', water: '#245966',
    landmarks: ['PALMA MARKET', 'CASA SOL', 'CALLE 9 GARAGE', 'LA ESTRELLA', 'BARRIO SOCIAL'], billboard: 'PALMA LIVES HERE', lastSeenPolice: 'PALMA MARKET / LITTLE PALMA', lastSeenQuiet: 'LITTLE PALMA / CALLE 9', feedHandle: '@palmalocal', heightBoost: -3, layout: 'barrio', spawn: [-30, 8], startYaw: -Math.PI / 2,
  },
  'Downtown Vice': {
    name: 'Downtown Vice', code: 'DV-02', tagline: 'CENTRAL GRID // CAMERA NETWORK', accent: '#8d73ff', secondary: '#55dce8', fog: '#282b4b', ground: '#252832', water: '#183f5b',
    landmarks: ['VICE FINANCIAL', 'METRO CENTER', 'CIVIC TOWER', 'GRID 24', 'CENTRAL HOTEL'], billboard: 'THE CITY MOVES WITH YOU', lastSeenPolice: 'METRO CENTER / DOWNTOWN VICE', lastSeenQuiet: 'DOWNTOWN VICE / GRID 24', feedHandle: '@vicecentral', heightBoost: 11, layout: 'downtown', spawn: [-39, 10], startYaw: -Math.PI / 2,
  },
  'South Point': {
    name: 'South Point', code: 'SP-11', tagline: 'INDUSTRIAL ZONE // STREET RACING', accent: '#ef5b54', secondary: '#f2a54e', fog: '#442b31', ground: '#302c2c', water: '#29434b',
    landmarks: ['REDLINE GARAGE', 'SOUTH DEPOT', 'TRACK 11', 'IRONWORKS', 'LAST EXIT MOTEL'], billboard: 'BUILT FOR THE NIGHT', lastSeenPolice: 'REDLINE GARAGE / SOUTH POINT', lastSeenQuiet: 'SOUTH POINT / TRACK 11', feedHandle: '@southgrid', heightBoost: -1, layout: 'industrial', spawn: [0, -8], startYaw: -Math.PI / 2,
  },
};

export const getDistrictTheme = (district: string) => DISTRICT_THEMES[district] || DISTRICT_THEMES['Neon Harbor'];
