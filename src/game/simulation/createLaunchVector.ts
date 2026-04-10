import type { Vec3 } from '../contracts';

interface CreateLaunchVectorInput {
  yawDeg: number;
  pitchDeg: number;
  power: number;
  minPower: number;
  maxPower: number;
}

const MIN_LAUNCH_SPEED = 9.5;
const MAX_LAUNCH_SPEED = 15.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createLaunchVector(input: CreateLaunchVectorInput): Vec3 {
  const { yawDeg, pitchDeg, power, minPower, maxPower } = input;
  const powerDenominator = maxPower - minPower;
  const rawPower01 = powerDenominator === 0 ? 0 : (power - minPower) / powerDenominator;
  const power01 = clamp(rawPower01, 0, 1);
  const launchSpeed = MIN_LAUNCH_SPEED + (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED) * power01;

  const yawRad = degToRad(yawDeg);
  const pitchRad = degToRad(pitchDeg);
  const planarSpeed = launchSpeed * Math.cos(pitchRad);

  return {
    x: round2(planarSpeed * Math.sin(yawRad)),
    y: round2(launchSpeed * Math.sin(pitchRad)),
    z: round2(planarSpeed * Math.cos(yawRad)),
  };
}
