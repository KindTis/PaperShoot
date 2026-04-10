import { describe, expect, it } from 'vitest';
import { advanceThrowStep } from '../../src/game/simulation/advanceThrowStep';

describe('advanceThrowStep', () => {
  it('applies gravity wind response and drag in a fixed step', () => {
    const next = advanceThrowStep({
      velocity: { x: 0, y: 0, z: 10 },
      dtSec: 1 / 60,
      gravityY: -28,
      gravityScale: 0.88,
      windTargetX: -3.4,
      windResponse: 8,
      linearDrag: 0.15,
      maxFallSpeed: -18,
    });

    expect(next.velocity.x).toBeLessThan(0);
    expect(next.velocity.y).toBeLessThan(0);
    expect(next.velocity.z).toBeLessThan(10);
  });

  it('clamps fall speed by maxFallSpeed', () => {
    const next = advanceThrowStep({
      velocity: { x: 0, y: -100, z: 0 },
      dtSec: 1 / 60,
      gravityY: -28,
      gravityScale: 1,
      windTargetX: 0,
      windResponse: 8,
      linearDrag: 0.15,
      maxFallSpeed: -18,
    });

    expect(next.velocity.y).toBeGreaterThanOrEqual(-18);
  });
});
