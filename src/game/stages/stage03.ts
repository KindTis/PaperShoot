import { buildBaseStage } from './buildBaseStage';

export const stage03 = buildBaseStage({
  id: 'stage-03',
  order: 3,
  theme: 'office',
  clear: { throwLimit: 4, requiredSuccesses: 1 },
  fan: {
    enabled: true,
    position: { x: -1.4, y: 1.35, z: 2.1 },
    directionDeg: 90,
    strength: 1,
    strengthLabel: 'strong',
    targetLateralSpeed: 3.4,
    windResponse: 8,
    gravityScaleInZone: 0.88,
    influenceShape: 'box',
    influenceLength: 4.2,
    influenceWidth: 2.6,
    influenceHeight: 2.2,
    feather: 0.3,
    showParticles: true,
  },
  obstacles: [
    {
      id: 'block-center',
      kind: 'static_block',
      position: { x: 0.1, y: 1.2, z: 5.3 },
      size: { x: 0.8, y: 1.0, z: 0.4 },
      motion: {
        type: 'none',
        amplitude: 0,
        durationMs: 0,
        phaseMs: 0,
        timeSource: 'world_time',
      },
    },
  ],
  tutorialText: '강한 바람과 고정 장애물을 함께 읽는다.',
  clearConditionText: '4번 안에 1회 성공',
});
