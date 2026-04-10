import type { FailureReason } from '../contracts';

export interface FailureFlags {
  rimRejected: boolean;
  hitObstacle: boolean;
  leftByWind: boolean;
  launchWasTooWeak: boolean;
  launchWasTooStrong: boolean;
  hitGround: boolean;
}

export const selectFailureReason = (flags: FailureFlags): FailureReason => {
  if (flags.rimRejected) return 'rim_reject';
  if (flags.hitObstacle) return 'obstacle_block';
  if (flags.leftByWind) return 'wind_push';
  if (flags.launchWasTooWeak) return 'power_low';
  if (flags.launchWasTooStrong) return 'power_high';
  if (flags.hitGround) return 'ground_hit';
  return null;
};
