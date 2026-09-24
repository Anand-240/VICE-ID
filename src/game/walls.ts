export const WALL_REPORT_DELAY = 10;
export const WALLS = [
  { id: 'canal', name: 'Canal service wall', x: 9, z: 32 },
  { id: 'market', name: 'Market service wall', x: 9, z: -3 },
  { id: 'club', name: 'Club service wall', x: 9, z: -29 },
] as const;
export type WallId = typeof WALLS[number]['id'];
export function wallResponseReady(age: number | null) {
  return age !== null && age >= WALL_REPORT_DELAY;
}
export function nearbyWall(x: number, z: number) {
  return WALLS.find(wall => x < wall.x && Math.hypot(x - wall.x, z - wall.z) < 3.5);
}

export function makeWallCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 700;
  const ctx = canvas.getContext('2d')!;
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
