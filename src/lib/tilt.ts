// Deterministic "glued on by hand" tilt: the same seed always gives the same angle,
// so photos don't jump around between builds. Range: -2..2 degrees.
export function tilt(seed: string, max = 2): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unit = ((h >>> 0) % 1000) / 999; // 0..1
  return `${((unit * 2 - 1) * max).toFixed(2)}deg`;
}
