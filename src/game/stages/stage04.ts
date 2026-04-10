import { buildBaseStage } from './buildBaseStage';

export const stage04 = buildBaseStage({
  id: 'stage-04',
  order: 4,
  theme: 'office',
  clear: { throwLimit: 4, requiredSuccesses: 1 },
  fan: {
    enabled: true,
    position: { x: -1.45, y: 1.35, z: 2.05 },
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
      id: 'block-left',
      kind: 'static_block',
      position: { x: -0.55, y: 1.15, z: 5.15 },
      size: { x: 0.6, y: 0.95, z: 0.35 },
      motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' },
    },
    {
      id: 'block-right',
      kind: 'static_block',
      position: { x: 0.75, y: 1.2, z: 6.05 },
      size: { x: 0.7, y: 1.0, z: 0.35 },
      motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' },
    },
  ],
  tutorialText: '강한 바람 속에서 두 장애물을 우회하는 경로를 읽는다.',
  clearConditionText: '4번 안에 1회 성공',
});
