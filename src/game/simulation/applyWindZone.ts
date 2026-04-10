import type { StageConfig, Vec3 } from '../contracts';

interface ApplyWindZoneInput {
  bodyPosition: Vec3;
  fan: StageConfig['fan'];
}

interface WindZoneResult {
  windTargetX: number;
  gravityScale: number;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function rotateY(vec: Vec3, rad: number): Vec3 {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: vec.x * cos + vec.z * sin,
    y: vec.y,
    z: -vec.x * sin + vec.z * cos,
  };
}

function insideBox(localOffset: Vec3, fan: StageConfig['fan']): boolean {
  const halfWidth = fan.influenceWidth * 0.5;
  const halfHeight = fan.influenceHeight * 0.5;
  return (
    localOffset.z >= 0 &&
    localOffset.z <= fan.influenceLength &&
    Math.abs(localOffset.x) <= halfWidth &&
    Math.abs(localOffset.y) <= halfHeight
  );
}

function edgeFalloff(localOffset: Vec3, fan: StageConfig['fan']): number {
  const halfWidth = fan.influenceWidth * 0.5;
  const halfHeight = fan.influenceHeight * 0.5;
  const featherWidth = Math.max(halfWidth * fan.feather, 1e-6);
  const featherHeight = Math.max(halfHeight * fan.feather, 1e-6);

  const distToXEdge = halfWidth - Math.abs(localOffset.x);
  const distToYEdge = halfHeight - Math.abs(localOffset.y);

  const xFactor = clamp(distToXEdge / featherWidth, 0, 1);
  const yFactor = clamp(distToYEdge / featherHeight, 0, 1);
  const linearFactor = Math.min(xFactor, yFactor);

  return Math.max(0.3, linearFactor);
}

export function applyWindZone(input: ApplyWindZoneInput): WindZoneResult {
  const { bodyPosition, fan } = input;
  if (!fan.enabled || fan.influenceShape !== 'box') {
    return { windTargetX: 0, gravityScale: 1 };
  }

  const worldOffset = subtract(bodyPosition, fan.position);
  const localOffset = rotateY(worldOffset, -degToRad(fan.directionDeg));

  if (!insideBox(localOffset, fan)) {
    return { windTargetX: 0, gravityScale: 1 };
  }

  const strength01 = edgeFalloff(localOffset, fan);
  const windTargetX = -fan.targetLateralSpeed * strength01;
  const gravityScale = 1 + (fan.gravityScaleInZone - 1) * strength01;

  return {
    windTargetX,
    gravityScale,
  };
}
