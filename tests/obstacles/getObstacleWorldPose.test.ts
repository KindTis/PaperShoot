import { describe, expect, it } from 'vitest';
import { getObstacleWorldPose } from '../../src/game/obstacles/getObstacleWorldPose';

describe('getObstacleWorldPose', () => {
  it('moves ping-pong obstacles with world time', () => {
    const motion = {
      type: 'ping_pong_x' as const,
      amplitude: 1.1,
      durationMs: 2000,
      phaseMs: 0,
      timeSource: 'world_time' as const,
    };

    const poseA = getObstacleWorldPose({
      basePosition: { x: 0, y: 1.3, z: 5.8 },
      motion,
      worldTimeMs: 0,
    });
    const poseB = getObstacleWorldPose({
      basePosition: { x: 0, y: 1.3, z: 5.8 },
      motion,
      worldTimeMs: 1000,
    });

    expect(poseA.x).not.toBe(poseB.x);
  });
});
