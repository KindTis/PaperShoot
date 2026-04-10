import type { Vec3 } from '../contracts';

export interface ResolveObstacleCollisionInput {
  bodyVelocity: Vec3;
  obstacleSurfaceVelocity: Vec3;
  obstacleNormal: Vec3;
  restitution: number;
  tangentialDamping: number;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const dot = (a: Vec3, b: Vec3): number => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};

const add = (a: Vec3, b: Vec3): Vec3 => {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
};

const subtract = (a: Vec3, b: Vec3): Vec3 => {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
};

const scale = (v: Vec3, s: number): Vec3 => {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
};

const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v.x, v.y, v.z);
  if (length === 0) {
    return { x: 0, y: 0, z: 1 };
  }
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};

const reflect = (velocity: Vec3, normal: Vec3, restitution: number): Vec3 => {
  const n = normalize(normal);
  const normalComponent = dot(velocity, n);
  const bounceScale = (1 + restitution) * normalComponent;
  return subtract(velocity, scale(n, bounceScale));
};

const applyTangentialDamping = (velocity: Vec3, normal: Vec3, tangentialDamping: number): Vec3 => {
  const n = normalize(normal);
  const normalPart = scale(n, dot(velocity, n));
  const tangentialPart = subtract(velocity, normalPart);
  const dampFactor = 1 - clamp(tangentialDamping, 0, 1);
  return add(normalPart, scale(tangentialPart, dampFactor));
};

export const resolveObstacleCollision = (input: ResolveObstacleCollisionInput): Vec3 => {
  const relative = subtract(input.bodyVelocity, input.obstacleSurfaceVelocity);
  const bounced = reflect(relative, input.obstacleNormal, input.restitution);
  const damped = applyTangentialDamping(bounced, input.obstacleNormal, input.tangentialDamping);
  return add(damped, input.obstacleSurfaceVelocity);
};
