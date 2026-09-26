// How the city finds out. Paint somewhere nobody can see and nothing happens.
// Someone has to notice the mark, or catch you in the act, and then recognise
// you before police are told anything.

export const MARK_NOTICE_RANGE = 26;
export const MARK_INSPECT_RANGE = 3.4;
export const CAUGHT_IN_ACT_RANGE = 11;

export type WitnessReport = 'none' | 'suspicion' | 'linked' | 'caught';

// A mark has to be in range and in clear line of sight to be noticed at all.
export function noticesMark(distance: number, clear: boolean, range = MARK_NOTICE_RANGE) {
  return clear && distance > 0 && distance <= range;
}

export function hasInspected(distance: number) {
  return distance <= MARK_INSPECT_RANGE;
}

// Seeing the painting happen is the strongest link. Having seen the mark first
// and then recognising the face is the next. Recognising the face on its own is
// only suspicion, which is not worth a phone call.
export function classifyWitness(sawMark: boolean, caughtInAct: boolean, posterActive: boolean): WitnessReport {
  if (caughtInAct) return 'caught';
  if (!posterActive) return 'none';
  return sawMark ? 'linked' : 'suspicion';
}

export function callsPolice(report: WitnessReport) {
  return report === 'caught' || report === 'linked';
}

export function awarenessJump(report: WitnessReport, influencer: boolean) {
  if (report === 'caught') return influencer ? 46 : 38;
  if (report === 'linked') return influencer ? 30 : 22;
  return 0;
}
