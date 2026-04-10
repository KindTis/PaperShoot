import { describe, expect, it } from 'vitest';
import { createLaunchVector } from '../../src/game/simulation/createLaunchVector';

describe('createLaunchVector', () => {
  it('maps yaw pitch and normalized power to launch vector', () => {
    const vector = createLaunchVector({
      yawDeg: 0,
      pitchDeg: 30,
      power: 0.5,
      minPower: 0,
      maxPower: 1,
    });

    expect(vector).toMatchObject({
      x: 0,
      y: 6.25,
      z: 10.83,
    });
  });

  it('clamps power below range to minimum launch speed', () => {
    const vector = createLaunchVector({
      yawDeg: 0,
      pitchDeg: 0,
      power: -10,
      minPower: 0,
      maxPower: 1,
    });

    expect(vector.z).toBeCloseTo(9.5, 6);
  });

  it('clamps power above range to maximum launch speed', () => {
    const vector = createLaunchVector({
      yawDeg: 0,
      pitchDeg: 0,
      power: 999,
      minPower: 0,
      maxPower: 1,
    });

    expect(vector.z).toBeCloseTo(15.5, 6);
  });
});
