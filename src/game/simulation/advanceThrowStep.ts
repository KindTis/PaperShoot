import type { Vec3 } from '../contracts';

interface AdvanceThrowStepInput {
  velocity: Vec3;
  dtSec: number;
  gravityY: number;
  gravityScale: number;
  windTargetX: number;
  windResponse: number;
  linearDrag: number;
  maxFallSpeed: number;
}

interface AdvanceThrowStepResult {
  velocity: Vec3;
}

export function advanceThrowStep(input: AdvanceThrowStepInput): AdvanceThrowStepResult {
  const {
    velocity,
    dtSec,
    gravityY,
    gravityScale,
    windTargetX,
    windResponse,
    linearDrag,
    maxFallSpeed,
  } = input;

  const nextVelocity: Vec3 = {
    x: velocity.x,
    y: velocity.y,
    z: velocity.z,
  };

  nextVelocity.y += gravityY * gravityScale * dtSec;
  nextVelocity.x += (windTargetX - nextVelocity.x) * windResponse * dtSec;

  const dragFactor = Math.max(0, 1 - linearDrag * dtSec);
  nextVelocity.x *= dragFactor;
  nextVelocity.y *= dragFactor;
  nextVelocity.z *= dragFactor;

  nextVelocity.y = Math.max(nextVelocity.y, maxFallSpeed);

  return { velocity: nextVelocity };
}
