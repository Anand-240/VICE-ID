export const WALK_SPEED = 3.75;
export const SPRINT_SPEED = 6.5;
export const ESCAPE_SPEED = 8.5;
// Past this awareness the police speed up, so escape speed engages on its own:
// the player never has to hold Shift to stay ahead of a unit that is closing in.
export const AUTO_BOOST_AWARENESS = 50;
export function autoBoost(awareness: number, pursuit: boolean) {
  return pursuit || awareness >= AUTO_BOOST_AWARENESS;
}
export function playerSpeed(pursuit: boolean, sprinting: boolean) {
  return pursuit ? ESCAPE_SPEED : sprinting ? SPRINT_SPEED : WALK_SPEED;
}

export const CROUCH_SPEED = 1.95;
export const AIM_FACTOR = .42;

// One place decides how fast the character may travel, so crouch, aim, sprint
// and the automatic escape boost cannot disagree with each other.
export function moveSpeed(options: { pursuit: boolean; sprinting: boolean; aiming?: boolean; crouching?: boolean }) {
  if (options.crouching) return CROUCH_SPEED;
  return playerSpeed(options.pursuit, options.sprinting) * (options.aiming ? AIM_FACTOR : 1);
}
