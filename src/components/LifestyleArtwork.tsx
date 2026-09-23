import { useId } from 'react';
import type { Lifestyle } from '../types/character';

export const lifestyleColors: Record<Lifestyle, string> = {
  'street-racer': '#ff967e', 'nightlife-owner': '#e67cb8', fixer: '#82c7c8',
  influencer: '#ba9af0', hustler: '#e2bb77', detective: '#86adcf', kingpin: '#d1ac76',
};

/** Original vector vignettes using the same illustration language as district cards. */
export function LifestyleArtwork({ lifestyle }: { lifestyle: Lifestyle }) {
  const id = useId().replace(/:/g, '');
  const accent = lifestyleColors[lifestyle];
  return <svg className="lifestyle-artwork" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
    <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor={accent} stopOpacity=".42" /><stop offset="1" stopColor="#152230" /></linearGradient></defs>
    <path d="M0 0h180v180H0z" fill="#151c2b" /><path d="M0 0h180v180H0z" fill={`url(#${id})`} />
    <circle cx="138" cy="45" r="25" fill={accent} opacity=".35" />
    <g fill="#182232"><path d="M0 100V69h24v31h9V48h29v52h59V60h23v40h12V77h24v103H0z" /></g>
    <path d="M0 151h180" stroke={accent} opacity=".3" />
    {lifestyle === 'street-racer' && <g>
      <path d="M43 180l37-69h20l44 69" fill="#0c131e" /><path d="M90 161v14" stroke="#dfd6bb" strokeWidth="3" />
      <path d="M29 112l21-14 14-27h47l24 28 20 13v24H27z" fill={accent} />
      <path d="M59 97l12-20h34l18 20z" fill="#223347" /><path d="M90 77v20" stroke="#73949f" strokeWidth="2" />
      <rect x="36" y="128" width="19" height="15" rx="4" fill="#080e18" /><rect x="129" y="128" width="19" height="15" rx="4" fill="#080e18" />
      <path d="M33 113h24m66 0h25" stroke="#fff0ca" strokeWidth="5" /><path d="M69 126h42" stroke="#182332" strokeWidth="6" />
    </g>}
    {lifestyle === 'nightlife-owner' && <g>
      <path d="M24 144V57h132v87" fill="#201c32" stroke={accent} strokeWidth="2" /><path d="M42 58l30 73m65-73l-30 73" stroke={accent} opacity=".25" strokeWidth="15" />
      <rect x="43" y="67" width="94" height="28" fill="#111a29" stroke={accent} strokeWidth="3" />
      <path d="M59 81h61" stroke="#eed5ef" strokeWidth="3" /><path d="M63 144v-40h54v40" fill="#0c1220" stroke="#7998bf" strokeWidth="2" />
      <path d="M90 105v39M18 151h144" stroke={accent} strokeWidth="2" /><circle cx="41" cy="129" r="4" fill="#dec4b9" /><path d="M41 134v17" stroke="#dec4b9" strokeWidth="3" />
    </g>}
    {lifestyle === 'fixer' && <g>
      <rect x="27" y="87" width="103" height="58" rx="5" fill="#344751" stroke={accent} strokeWidth="2" />
      <path d="M59 87V75h38v12M27 110h103" fill="none" stroke={accent} strokeWidth="3" /><rect x="72" y="106" width="14" height="12" fill="#d7b479" />
      <g transform="rotate(12 132 89)"><rect x="113" y="51" width="36" height="70" rx="5" fill="#101928" stroke={accent} strokeWidth="2" /><path d="M120 66h22m-22 9h22m-22 9h15" stroke={accent} strokeWidth="2" /><circle cx="131" cy="108" r="3" fill={accent} /></g>
    </g>}
    {lifestyle === 'influencer' && <g>
      <circle cx="90" cy="89" r="46" fill="none" stroke={accent} strokeWidth="7" /><path d="M90 135v22m-19 0h38" stroke="#9aa6b7" strokeWidth="4" />
      <rect x="71" y="56" width="38" height="70" rx="5" fill="#142134" stroke="#e7d7e7" strokeWidth="2" /><circle cx="90" cy="79" r="9" fill={accent} /><path d="M78 105q0-22 12-22t12 22" fill={accent} /><path d="M83 116h14" stroke="#e7d7e7" strokeWidth="2" />
      <path d="M138 56l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#f2d6af" />
    </g>}
    {lifestyle === 'hustler' && <g>
      <path d="M26 141V77h127v64" fill="#27343e" /><path d="M21 77l14-25h108l15 25" fill={accent} /><path d="M48 52l-6 25m28-25l-3 25m25-25v25m22-25l4 25m18-25l7 25" stroke="#705849" strokeWidth="9" />
      <path d="M39 87h100v37H39z" fill="#111e2a" /><rect x="57" y="104" width="29" height="20" fill="#b38755" /><rect x="91" y="94" width="23" height="30" fill="#769c94" /><path d="M24 128h132v16H24z" fill={accent} /><path d="M39 144v12m100-12v12" stroke="#82959e" strokeWidth="4" />
    </g>}
    {lifestyle === 'detective' && <g>
      <path d="M30 58h107v91H30z" fill="#d0c4ac" /><path d="M41 72h69m-69 12h43m-43 42h35m-35 10h46" stroke="#556373" strokeWidth="3" /><rect x="41" y="93" width="31" height="24" fill="#576a7b" />
      <circle cx="112" cy="108" r="25" fill="#162b3d" fillOpacity=".75" stroke={accent} strokeWidth="6" /><path d="M130 128l22 25" stroke="#0d1724" strokeWidth="11" /><path d="M97 108h29m-14-14v29" stroke={accent} opacity=".55" />
    </g>}
    {lifestyle === 'kingpin' && <g>
      <path d="M23 144V47h134v97" fill="#121e2e" stroke="#526473" strokeWidth="2" /><path d="M67 47v64m45-64v64M23 87h134" stroke="#526473" strokeWidth="2" />
      <path d="M38 129h105v12H38zM45 141v16m91-16v16" fill={accent} stroke={accent} strokeWidth="4" />
      <path d="M71 128v-24q0-13 19-13t19 13v24" fill="#4c4445" stroke={accent} strokeWidth="2" />
      <path d="M67 76l-3-22 17 11 9-20 9 20 17-11-3 22z" fill={accent} /><path d="M69 83h42" stroke={accent} strokeWidth="3" />
    </g>}
  </svg>;
}
