import type { StageConfig, Vec3 } from '../contracts';

interface GetObstacleWorldPoseInput {
  basePosition: Vec3;
  motion: StageConfig['obstacles'][number]['motion'];
  worldTimeMs: number;
}

export function getObstacleWorldPose(input: GetObstacleWorldPoseInput): Vec3 {
  const { basePosition, motion, worldTimeMs } = input;

  if (motion.type === 'none' || motion.durationMs <= 0) {
    return basePosition;
  }

  const phase01 = ((worldTimeMs + motion.phaseMs) % motion.durationMs) / motion.durationMs;
  const pingPong = phase01 < 0.5 ? phase01 * 2 : (1 - phase01) * 2;
  const offset = (pingPong - 0.5) * 2 * motion.amplitude;

  if (motion.type === 'ping_pong_x') {
    return { ...basePosition, x: basePosition.x + offset };
  }

  return { ...basePosition, y: basePosition.y + offset };
}
