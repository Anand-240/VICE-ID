import type { DistrictTheme } from './districts';

export function DistrictMinimap({ theme, player, posters, patrol }: { theme: DistrictTheme; player: { x: number; z: number; heading: number }; posters: boolean; patrol: boolean }) {
  const roadWidth = { luxury: 13, harbor: 11, nightlife: 18, marina: 11, barrio: 9, downtown: 15, industrial: 16 }[theme.layout];
  const cross = { luxury: 18, harbor: 10, barrio: 8, downtown: 10 }[theme.layout as 'luxury' | 'harbor' | 'barrio' | 'downtown'];
  return <div className="game-minimap" aria-label={`${theme.name} map${patrol ? ', patrol active; officer positions not tracked' : ''}`}>
    <svg viewBox="-55 -72 110 144" role="img" aria-label="District roads, published posters and player position">
      <rect x="-55" y="-72" width="110" height="144" fill="#16212b" />
      <rect x={-roadWidth / 2} y={theme.layout === 'marina' ? -40 : -70} width={roadWidth} height={theme.layout === 'marina' ? 110 : 140} fill="#505860" />
      {cross !== undefined && <rect x="-55" y={cross - roadWidth / 2} width="110" height={roadWidth} fill="#505860" />}
      {theme.layout === 'marina' && <circle cy="-7" r="9.5" fill="none" stroke="#505860" strokeWidth="5" />}
      {theme.layout === 'industrial' && <rect x="-39.5" y="-16" width="45" height="12" transform="rotate(12.6 -17 -10)" fill="#505860" />}
      {posters && [[10.7,-36],[-10.7,-10],[7,17],[13.5,37.4]].map(([x,z]) => <rect key={`${x}-${z}`} x={x-1.4} y={z-1.4} width="2.8" height="2.8" fill="#ffba82" stroke="white" strokeWidth=".5" />)}
      <path d="M0 4 L-3 -3 L3 -3 Z" fill="#bdf7ff" transform={`translate(${player.x} ${player.z}) rotate(${-player.heading * 180 / Math.PI})`} />
    </svg>
    <small>{theme.code}{patrol ? ' / PATROL' : ''}</small>
  </div>;
}
