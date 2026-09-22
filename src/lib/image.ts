import type { Character, CityState, DistrictOutcome } from '../types/character';
import { bountyFor, caseId } from './scoring';

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
  });
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

export async function makeWantedPoster(c: Character) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#eadcc5'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#101014'; ctx.fillRect(42, 42, 996, 1266); ctx.fillStyle = '#eadcc5'; ctx.fillRect(57, 57, 966, 1236);
  ctx.fillStyle = '#101014'; ctx.font = '900 154px Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('WANTED', 540, 205);
  ctx.font = '24px monospace'; ctx.fillText(`VICE METROPOLITAN POLICE // ${caseId(c.id)}`, 540, 255);
  if (c.editedImage || c.originalImage) { const img = await load(c.editedImage || c.originalImage!); cover(ctx, img, 110, 305, 860, 620); }
  ctx.fillStyle = '#101014'; ctx.textAlign = 'left'; ctx.font = '30px monospace'; ctx.fillText('KNOWN AS', 110, 995);
  ctx.font = '900 78px Impact, sans-serif'; ctx.fillText(c.alias.toUpperCase(), 110, 1070, 470);
  ctx.fillStyle = '#b12626'; ctx.textAlign = 'right'; ctx.fillText('★'.repeat(c.wantedLevel), 970, 1070);
  ctx.fillStyle = '#101014'; ctx.font = '24px monospace'; ctx.textAlign = 'left'; ctx.fillText(c.district.toUpperCase(), 110, 1135);
  ctx.textAlign = 'right'; ctx.fillText(c.lifestyle.replace('-', ' ').toUpperCase(), 970, 1135);
  ctx.fillStyle = '#b12626'; ctx.textAlign = 'center'; ctx.font = '900 54px Impact, sans-serif'; ctx.fillText(`REWARD  $${bountyFor(c.wantedLevel).toLocaleString()}`, 540, 1238);
  return canvas.toDataURL('image/png');
}

export async function makeFinalCard(c: Character, city?: CityState, outcome?: DistrictOutcome) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#101321'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#f4e7d3'; ctx.font = '900 74px Impact, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('VICE ID', 70, 105);
  ctx.fillStyle = '#56d7e8'; ctx.font = '18px monospace'; ctx.fillText(`IDENTITY ARCHIVE // ${caseId(c.id)} // 24°N 80°W`, 70, 148);
  if (c.editedImage || c.originalImage) { const img = await load(c.editedImage || c.originalImage!); cover(ctx, img, 46, 185, 988, 725); }
  const g = ctx.createLinearGradient(0, 580, 0, 950); g.addColorStop(0, 'rgba(16,19,33,0)'); g.addColorStop(1, '#101321'); ctx.fillStyle = g; ctx.fillRect(46, 500, 988, 430);
  ctx.fillStyle = '#f4e7d3'; ctx.font = '900 108px Impact, sans-serif'; ctx.fillText(c.alias.toUpperCase(), 70, 965, 900);
  ctx.fillStyle = '#ff7867'; ctx.font = '900 42px Impact, sans-serif'; ctx.fillText(c.name.toUpperCase(), 74, 1020, 900);
  ctx.fillStyle = '#f4e7d3'; ctx.font = '27px monospace'; ctx.fillText(`${c.lifestyle.replace('-', ' ').toUpperCase()}  /  ${c.district.toUpperCase()}`, 74, 1072);
  ctx.fillStyle = '#ff7867'; ctx.font = '44px sans-serif'; ctx.fillText('★'.repeat(c.wantedLevel) + '☆'.repeat(5 - c.wantedLevel), 72, 1144);
  const stats = [['REP', c.reputation], ['HEAT', c.heat], ['STYLE', c.style]] as const;
  stats.forEach(([label, value], i) => { const x = 74 + i * 325; ctx.fillStyle = '#8390a8'; ctx.font = '20px monospace'; ctx.fillText(label, x, 1220); ctx.fillStyle = '#f4e7d3'; ctx.font = '900 52px Impact, sans-serif'; ctx.fillText(String(value).padStart(2, '0'), x, 1280); });
  if (city) { ctx.fillStyle = '#56d7e8'; ctx.font = '16px monospace'; ctx.textAlign = 'right'; ctx.fillText(`CITY IMPACT RECORDED // REACH ${city.posterReach.toLocaleString()} // DISTRICTS ${String(city.affectedDistricts.length).padStart(2, '0')}`, 980, 1312); }
  if (outcome) { ctx.fillStyle = '#ff7867'; ctx.font = '14px monospace'; ctx.fillText(`LAST SEEN ${outcome.lastSeen} // ${outcome.result.replace('-', ' ').toUpperCase()}`, 980, 1336, 910); }
  ctx.fillStyle = '#ff7867'; ctx.fillRect(1005, 970, 29, 310);
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  // The native editor may preserve JPEG/WebP rather than returning PNG.
  const extension = dataUrl.startsWith('data:image/jpeg') ? 'jpg' : dataUrl.startsWith('data:image/webp') ? 'webp' : 'png';
  const a = document.createElement('a'); a.href = dataUrl; a.download = filename.replace(/\.(png|jpe?g|webp)$/i, `.${extension}`); a.click();
}
