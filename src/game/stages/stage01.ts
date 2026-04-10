import { buildBaseStage } from './buildBaseStage';

export const stage01 = buildBaseStage({
  id: 'stage-01',
  order: 1,
  theme: 'room',
  clear: { throwLimit: 3, requiredSuccesses: 1 },
  fan: {
    enabled: true,
    position: { x: -1.4, y: 1.35, z: 2.1 },
    directionDeg: 90,
    strength: 1,
    strengthLabel: 'weak',
    targetLateralSpeed: 1.2,
    windResponse: 6,
    gravityScaleInZone: 0.96,
    influenceShape: 'box',
    influenceLength: 4.2,
    influenceWidth: 2.6,
    influenceHeight: 2.2,
    feather: 0.3,
    showParticles: true,
  },
  obstacles: [],
  tutorialText: '약한 바람에서 기본 투척 감각을 익힌다.',
  clearConditionText: '3번 안에 1회 성공',
});
