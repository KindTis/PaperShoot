import { buildBaseStage } from './buildBaseStage';

export const stage05 = buildBaseStage({
  id: 'stage-05',
  order: 5,
  theme: 'office',
  clear: { throwLimit: 5, requiredSuccesses: 1 },
  fan: {
    enabled: true,
    position: { x: -1.5, y: 1.35, z: 2.0 },
    directionDeg: 90,
    strength: 1,
    strengthLabel: 'medium',
    targetLateralSpeed: 2.2,
    windResponse: 7,
    gravityScaleInZone: 0.92,
    influenceShape: 'box',
    influenceLength: 4.5,
    influenceWidth: 2.8,
    influenceHeight: 2.2,
    feather: 0.3,
    showParticles: true,
  },
  obstacles: [
    {
      id: 'moving-slab',
      kind: 'moving_block',
      position: { x: 0, y: 1.25, z: 5.8 },
      size: { x: 0.9, y: 1.0, z: 0.35 },
      motion: { type: 'ping_pong_x', amplitude: 1.1, durationMs: 2000, phaseMs: 0, timeSource: 'world_time' },
    },
  ],
  tutorialText: '움직이는 장애물 타이밍을 읽는다.',
  clearConditionText: '5번 안에 1회 성공',
});
