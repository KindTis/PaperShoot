import { buildBaseStage } from './buildBaseStage';

export const stage06 = buildBaseStage({
  id: 'stage-06',
  order: 6,
  theme: 'cafe',
  clear: { throwLimit: 5, requiredSuccesses: 1 },
  fan: {
    enabled: true,
    position: { x: -1.6, y: 1.35, z: 1.9 },
    directionDeg: 90,
    strength: 1,
    strengthLabel: 'strong',
    targetLateralSpeed: 3.4,
    windResponse: 8,
    gravityScaleInZone: 0.88,
    influenceShape: 'box',
    influenceLength: 4.5,
    influenceWidth: 2.8,
    influenceHeight: 2.2,
    feather: 0.3,
    showParticles: true,
  },
  obstacles: [
    {
      id: 'moving-panel',
      kind: 'moving_block',
      position: { x: 0.2, y: 1.2, z: 5.6 },
      size: { x: 0.7, y: 1.0, z: 0.35 },
      motion: { type: 'ping_pong_y', amplitude: 0.7, durationMs: 1800, phaseMs: 150, timeSource: 'world_time' },
    },
    {
      id: 'gate-final',
      kind: 'narrow_gate',
      position: { x: 0.15, y: 1.1, z: 7.2 },
      size: { x: 0.55, y: 1.1, z: 0.2 },
      motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' },
    },
  ],
  tutorialText: '강한 바람, 타이밍, 좁은 입구를 함께 푼다.',
  clearConditionText: '5번 안에 1회 성공',
});
