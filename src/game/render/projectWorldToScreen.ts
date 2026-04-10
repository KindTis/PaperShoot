import type { Vec3 } from '../contracts';

export interface ScreenProjection {
  x: number;
  y: number;
  scale: number;
}

export function projectWorldToScreen(position: Vec3): ScreenProjection {
  const depth = Math.max(1, position.z + 1);
  const scale = 1 / depth;

  return {
    x: position.x * 120 * scale,
    y: -position.y * 120 * scale,
    scale,
  };
}
