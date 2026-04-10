import { describe, expect, it } from 'vitest';
import type { StageConfig, Vec3 } from '../../src/game/contracts';
import { applyWindZone } from '../../src/game/simulation/applyWindZone';

function makeFan(overrides: Partial<StageConfig['fan']> = {}): StageConfig['fan'] {
  return {
    enabled: true,
    position: { x: 0, y: 1.35, z: 0 },
    directionDeg: 0,
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
    ...overrides,
  };
}

function sample(bodyPosition: Vec3, fan: StageConfig['fan']) {
  return applyWindZone({ bodyPosition, fan });
}

describe('applyWindZone', () => {
  it('applies wind and gravity scale only inside oriented box volume', () => {
    const forwardFan = makeFan({ directionDeg: 0 });
    const rightFan = makeFan({ directionDeg: 90 });

    expect(sample({ x: 0, y: 1.4, z: 3.4 }, forwardFan).gravityScale).toBeCloseTo(0.88, 2);
    expect(sample({ x: 0, y: 1.4, z: 3.4 }, forwardFan).windTargetX).toBeLessThan(0);
    expect(sample({ x: 3.4, y: 1.4, z: 0 }, rightFan).windTargetX).toBeLessThan(0);
    expect(sample({ x: 0, y: 1.4, z: 3.4 }, rightFan).windTargetX).toBe(0);
    expect(sample({ x: 1.29, y: 1.4, z: 3.4 }, forwardFan).windTargetX).toBeLessThan(0);
    expect(sample({ x: 1.6, y: 1.4, z: 3.4 }, forwardFan).windTargetX).toBe(0);
    expect(sample({ x: 0, y: 1.4, z: 6.8 }, forwardFan).gravityScale).toBe(1);
  });

  it('uses feather falloff near edges with bounded edge strength', () => {
    const forwardFan = makeFan({ directionDeg: 0 });
    const center = sample({ x: 0, y: 1.4, z: 3.4 }, forwardFan);
    const edge = sample({ x: 1.29, y: 1.4, z: 3.4 }, forwardFan);

    expect(Math.abs(edge.windTargetX)).toBeLessThan(Math.abs(center.windTargetX));
    expect(Math.abs(edge.windTargetX)).toBeGreaterThan(Math.abs(center.windTargetX) * 0.25);
    expect(Math.abs(edge.windTargetX)).toBeLessThan(Math.abs(center.windTargetX) * 0.75);
    expect(edge.gravityScale).toBeGreaterThan(center.gravityScale);
  });
});
