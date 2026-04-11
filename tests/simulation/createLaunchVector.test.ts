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
      y: 8,
      z: 13.86,
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

    expect(vector.z).toBeCloseTo(11, 6);
  });

  it('clamps power above range to maximum launch speed', () => {
    const vector = createLaunchVector({
      yawDeg: 0,
      pitchDeg: 0,
      power: 999,
      minPower: 0,
      maxPower: 1,
    });

    expect(vector.z).toBeCloseTo(21, 6);
  });

  it('biases a strong drag throw toward forward travel', () => {
    const vector = createLaunchVector({
      yawDeg: 4,
      pitchDeg: 38,
      power: 0.72,
      minPower: 0.25,
      maxPower: 1,
    });

    expect(vector.z).toBeGreaterThan(12);
    expect(vector.y).toBeGreaterThan(9);
  });
});
