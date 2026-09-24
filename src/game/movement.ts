export const WALK_SPEED = 3.75;
export const SPRINT_SPEED = 6.5;
export const ESCAPE_SPEED = 8.5;
// Once police awareness crosses this, escape speed engages on its own: the
// player never has to hold Shift to stay ahead of a unit that is closing in.
export const AUTO_BOOST_AWARENESS = 60;
export function autoBoost(awareness: number, pursuit: boolean) {
  return pursuit || awareness >= AUTO_BOOST_AWARENESS;
}
export function playerSpeed(pursuit: boolean, sprinting: boolean) {
  return pursuit ? ESCAPE_SPEED : sprinting ? SPRINT_SPEED : WALK_SPEED;
}
