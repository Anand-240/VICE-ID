import { useId } from 'react';
import { getDistrictTheme } from '../game/districts';

/** Original district illustrations, sharing the playable world's palette and architecture. */
export function DistrictArtwork({ district }: { district: string }) {
  const theme = getDistrictTheme(district);
  const id = useId().replace(/:/g, '');
  const coastal = theme.layout === 'marina' || theme.layout === 'luxury';
  const towers = theme.layout === 'downtown' || theme.layout === 'luxury';
  const industrial = theme.layout === 'harbor' || theme.layout === 'industrial';
  const heights = towers ? [62, 99, 75, 119, 87] : industrial ? [35, 28, 44, 30, 24] : [46, 57, 35, 64, 44];
  return <svg className="district-artwork" viewBox="0 0 280 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={theme.fog} /><stop offset="1" stopColor={theme.accent} /></linearGradient>
      <linearGradient id={`${id}-shade`} x2="0" y2="1"><stop stopColor="#0b101c" stopOpacity="0" /><stop offset="1" stopColor="#0b101c" stopOpacity=".7" /></linearGradient>
    </defs>
    <path fill={`url(#${id}-sky)`} d="M0 0h280v180H0z" />
    <circle cx={coastal ? 192 : 66} cy="65" r="31" fill="#ffe0ae" opacity=".8" />
    {heights.map((height, index) => <g key={index}>
      <path d={`M${index * 60 - 10} 137v-${height}h43v${height}z`} fill={index % 2 ? '#283044' : '#343346'} />
      {Array.from({ length: Math.floor(height / 15) }, (_, row) => <path key={row} d={`M${index * 60 - 4} ${143 - height + row * 15}h28`} stroke={theme.secondary} strokeWidth="2" opacity={row % 2 ? '.35' : '.7'} />)}
    </g>)}
    {industrial && <g fill="none" stroke="#131e2b" strokeWidth="5"><path d="M192 137V35h63M169 61l23-26 51 26M238 36v54" /><path d="M17 131h59v21H17zM29 109h59v21H29z" fill={theme.secondary} strokeWidth="2" /></g>}
    {coastal ? <><path d="M0 139h280v41H0z" fill={theme.water} /><path d="M116 147h88l-16 12h-58z" fill="#e6d9c5" /><path d="M153 90v57h34z" fill="#f4e7d3" /><path d="M12 162h69m125 7h55m-167 5h53" stroke={theme.accent} opacity=".7" /></> : <><path d="M116 133h48l66 47H50z" fill="#101521" /><path d="M140 139v8m0 10v15" stroke="#f4d6ab" strokeWidth="2" /></>}
    {!industrial && <g stroke="#141c28" fill="#141c28" strokeWidth="3"><path d="M32 156q9-31 4-57m209 66q-8-32-3-65" fill="none" /><path d="M36 99q-23-20-30 1 18-5 30 1-11-23 10-24l-10 22q22-16 30 8l-30-8m206 1q-20-18-28 2l28-2q-9-22 12-22l-12 22q21-14 29 7z" /></g>}
    {theme.layout === 'nightlife' && <g stroke={theme.accent} strokeWidth="3" fill="#171522"><path d="M67 89h63v22H67zM186 74h53v19h-53z" /><path d="M79 101h39m78-17h32" stroke={theme.secondary} strokeWidth="2" /></g>}
    <path fill={`url(#${id}-shade)`} d="M0 0h280v180H0z" />
  </svg>;
}
