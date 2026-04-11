import { buildBaseStage } from './buildBaseStage';

export const stage02 = buildBaseStage({
  id: 'stage-02',
  order: 2,
  theme: 'office',
  clear: { throwLimit: 3, requiredSuccesses: 1 },
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
  obstacles: [],
  tutorialText: '강한 바람 보정을 익힌다.',
  clearConditionText: '3번 안에 1회 성공',
});
