export interface PoliceDetection {
  visible: boolean;
  distance: number;
  rate: number;
  contact: boolean;
  source: 'officer' | 'vehicle';
}

export interface ReportedLocation { x: number; z: number; sequence: number }
export interface Point { x: number; z: number }

// Rates are percentage points per second, independent of rendering frequency.
export function officerDetection(distance: number, facing: number, clear: boolean, searching: boolean, heightDifference = 0): PoliceDetection {
  const visible = clear && heightDifference < 3 && distance <= (searching ? 30 : 24)
    && (distance <= 5 || facing >= (searching ? -.25 : .15));
  return { visible, distance, source: 'officer', contact: visible && distance <= 1.35 && heightDifference < 1,
    rate: !visible ? 0 : distance <= 2.5 ? 65 : distance <= 5 ? 38 : distance <= 12 ? 20 : 10 };
}

export function advanceAwareness(value: number, detections: PoliceDetection[], seconds: number, pursuit: boolean) {
  const rate = Math.max(0, ...detections.filter(d => d.visible).map(d => d.rate));
  return Math.max(0, Math.min(100, value + (rate || (pursuit ? -10 : -3)) * seconds));
}

export function policeSpeed(awareness: number, pursuit: boolean) {
  return pursuit ? 6.1 : awareness >= 65 ? 5.5 : 3.8;
}

// A bounded A* search over the actual scene's static-collider clearance query.
// Each edge includes capsule clearance; diagonal moves cannot cut through corners.
export function findPolicePath(start: Point, goal: Point, clear: (a: Point, b: Point) => boolean): Point[] {
  if (clear(start, goal)) return [goal];
  const step = 1.5;
  const nodes = [{ ...start, gx: 0, gz: 0, cost: 0, score: Math.hypot(goal.x - start.x, goal.z - start.z), parent: -1 }];
  const open = [0];
  const best = new Map<string, number>([['0,0', 0]]);
  for (let visited = 0; open.length && visited < 2500; visited++) {
    let pick = 0;
    for (let i = 1; i < open.length; i++) if (nodes[open[i]].score < nodes[open[pick]].score) pick = i;
    const index = open.splice(pick, 1)[0];
    const node = nodes[index];
    if (node.cost > (best.get(`${node.gx},${node.gz}`) ?? Infinity)) continue;
    if (Math.hypot(goal.x - node.x, goal.z - node.z) < step * 2 && clear(node, goal)) {
      const path: Point[] = [goal];
      let back = index;
      while (back > 0) { path.unshift({ x: nodes[back].x, z: nodes[back].z }); back = nodes[back].parent; }
      return path;
    }
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const gx = node.gx + dx, gz = node.gz + dz;
      const next = { x: start.x + gx * step, z: start.z + gz * step };
      if (Math.abs(next.x) > 53 || Math.abs(next.z) > 69) continue;
      const cost = node.cost + Math.hypot(dx, dz) * step;
      const key = `${gx},${gz}`;
      if (cost >= (best.get(key) ?? Infinity) || !clear(node, next)) continue;
      best.set(key, cost);
      nodes.push({ ...next, gx, gz, cost, score: cost + Math.hypot(goal.x - next.x, goal.z - next.z), parent: index });
      open.push(nodes.length - 1);
    }
  }
  return [];
}
