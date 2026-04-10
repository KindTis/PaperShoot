import { describe, expect, it } from 'vitest';
import { resolveObstacleCollision } from '../../src/game/collision/resolveObstacleCollision';

describe('resolveObstacleCollision', () => {
  it('reflects relative velocity then adds obstacle surface velocity after tangential damping', () => {
    const next = resolveObstacleCollision({
      bodyVelocity: { x: 4, y: 0, z: 2 },
      obstacleSurfaceVelocity: { x: 1, y: 0, z: 0 },
      obstacleNormal: { x: 1, y: 0, z: 0 },
      restitution: 1,
      tangentialDamping: 0.5,
    });

    expect(next.x).toBeCloseTo(-2, 6);
    expect(next.y).toBeCloseTo(0, 6);
    expect(next.z).toBeCloseTo(1, 6);
  });

  it('produces negative normal-direction response for frontal hit', () => {
    const next = resolveObstacleCollision({
      bodyVelocity: { x: 0, y: 0, z: 3 },
      obstacleSurfaceVelocity: { x: 0, y: 0, z: 0 },
      obstacleNormal: { x: 0, y: 0, z: 1 },
      restitution: 0.7,
      tangentialDamping: 0.8,
    });

    expect(next.z).toBeLessThan(0);
  });
});
