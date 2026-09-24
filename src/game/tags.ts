// Free-hand surfaces: anything upright the player can stand in front of can be
// painted, not only the three prepared walls.
export const TAG_RANGE = 4.6;
export const MAX_TAGS = 10;
export const TAG_WIDTH = 2.4;
export const TAG_HEIGHT = 1.5;

export interface SurfaceHit {
  x: number; y: number; z: number;
  nx: number; ny: number; nz: number;
  distance: number;
}

// What the camera frames while a surface is being painted: a point, the
// direction it faces, and how far back to sit from it.
export interface FocusTarget {
  x: number; y: number; z: number;
  nx: number; ny: number; nz: number;
  standOff: number;
}

export interface Tag {
  id: string;
  point: [number, number, number];
  normal: [number, number, number];
}

// Floors and ceilings are not paintable, the surface has to be in reach, and a
// degenerate normal (a ray starting inside geometry) gives no usable facing.
export function paintableSurface(hit: SurfaceHit | null | undefined): hit is SurfaceHit {
  return Boolean(hit) && hit!.distance <= TAG_RANGE && hit!.y > .2
    && Math.abs(hit!.ny) < .6 && Math.hypot(hit!.nx, hit!.nz) > .5;
}

export function makeTag(id: string, hit: SurfaceHit): Tag {
  return {
    id,
    // Lift the decal off the surface so it never z-fights with the wall it sits on.
    point: [hit.x + hit.nx * .03, Math.max(TAG_HEIGHT / 2 + .1, hit.y), hit.z + hit.nz * .03],
    normal: [hit.nx, hit.ny, hit.nz],
  };
}

export function addTag(tags: Tag[], tag: Tag) {
  return [...tags, tag].slice(-MAX_TAGS);
}

export function makeTagCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 600;
  // Left transparent: paint should read as paint on the surface underneath.
  return canvas.toDataURL('image/png');
}
