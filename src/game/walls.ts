export const WALL_REPORT_DELAY = 10;
export const WALLS = [
  { id: 'canal', name: 'Canal service wall', x: 9, z: 32 },
  { id: 'market', name: 'Market shutter', x: 9, z: -3 },
  { id: 'club', name: 'Club notice panel', x: 9, z: -29 },
] as const;
export type WallId = typeof WALLS[number]['id'];
export type SignalIntent = 'mark' | 'north' | 'south';
export interface StreetSignal {
  sequence: number;
  origin: { x: number; z: number };
  target: { x: number; z: number };
  intent: SignalIntent;
  expires: number;
}
export function signalTarget(wall: { x: number; z: number }, intent: SignalIntent) {
  return { x: wall.x - 3, z: Math.max(-60, Math.min(60, wall.z + (intent === 'north' ? -14 : intent === 'south' ? 14 : 0))) };
}
export function closestWall(x: number, z: number) {
  return WALLS.reduce((best, wall) => Math.hypot(x - wall.x, z - wall.z) < Math.hypot(x - best.x, z - best.z) ? wall : best);
}
export function wallResponseReady(age: number | null) {
  return age !== null && age >= WALL_REPORT_DELAY;
}
export function nearbyWall(x: number, z: number) {
  return WALLS.find(wall => x < wall.x && Math.hypot(x - wall.x, z - wall.z) < 3.5);
}

export function makeWallCanvas(surface: WallId = 'canal') {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 700;
  const ctx = canvas.getContext('2d')!;
  if (surface !== 'canal') {
    ctx.fillStyle = surface === 'market' ? '#77818a' : '#263d49';
    ctx.fillRect(0, 0, 1200, 700);
    if (surface === 'market') {
      for (let y = 0; y < 700; y += 28) {
        ctx.fillStyle = '#465561'; ctx.fillRect(0, y, 1200, 3);
        ctx.fillStyle = '#a3adb4'; ctx.fillRect(0, y + 4, 1200, 2);
      }
    } else {
      ctx.strokeStyle = '#b5aaa0'; ctx.lineWidth = 8; ctx.strokeRect(20, 20, 1160, 660);
      ctx.fillStyle = '#cebe9e'; ctx.font = '24px monospace'; ctx.fillText('VICE COAST / PUBLIC MESSAGE BOARD', 44, 62);
    }
    return canvas.toDataURL('image/png');
  }
  ctx.fillStyle = '#b4aca0'; ctx.fillRect(0, 0, 1200, 700);
  for (let row = 0; row < 14; row++) {
    for (let col = -1; col < 11; col++) {
      const shade = 154 + (row * 17 + col * 11 + 30) % 28;
      ctx.fillStyle = `rgb(${shade + 18},${shade + 10},${shade})`;
      ctx.fillRect(col * 120 + (row % 2) * 60 + 2, row * 50 + 2, 116, 46);
    }
  }
  return canvas.toDataURL('image/png');
}
