import { describe, expect, it } from 'vitest';
import { selectFailureReason } from '../../src/game/scoring/selectFailureReason';

describe('selectFailureReason', () => {
  it('applies priority: rim > obstacle > wind > low > high > ground > null', () => {
    expect(
      selectFailureReason({
        rimRejected: true,
        hitObstacle: true,
        leftByWind: true,
        launchWasTooWeak: true,
        launchWasTooStrong: true,
        hitGround: true,
      }),
    ).toBe('rim_reject');

    expect(
      selectFailureReason({
        rimRejected: false,
        hitObstacle: true,
        leftByWind: true,
        launchWasTooWeak: true,
        launchWasTooStrong: true,
        hitGround: true,
      }),
    ).toBe('obstacle_block');

    expect(
      selectFailureReason({
        rimRejected: false,
        hitObstacle: false,
        leftByWind: true,
        launchWasTooWeak: true,
        launchWasTooStrong: true,
        hitGround: true,
      }),
    ).toBe('wind_push');

    expect(
      selectFailureReason({
        rimRejected: false,
        hitObstacle: false,
        leftByWind: false,
        launchWasTooWeak: true,
        launchWasTooStrong: true,
        hitGround: true,
      }),
    ).toBe('power_low');

    expect(
      selectFailureReason({
        rimRejected: false,
        hitObstacle: false,
        leftByWind: false,
        launchWasTooWeak: false,
        launchWasTooStrong: true,
        hitGround: true,
      }),
    ).toBe('power_high');

    expect(
      selectFailureReason({
        rimRejected: false,
        hitObstacle: false,
        leftByWind: false,
        launchWasTooWeak: false,
        launchWasTooStrong: false,
        hitGround: true,
      }),
    ).toBe('ground_hit');

    expect(
      selectFailureReason({
        rimRejected: false,
        hitObstacle: false,
        leftByWind: false,
        launchWasTooWeak: false,
        launchWasTooStrong: false,
        hitGround: false,
      }),
    ).toBe(null);
  });
});
