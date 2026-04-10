import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectDeskPoint } from '../../src/game/render/cameraRig';

describe('projectDeskPoint', () => {
  it('projects far points higher and smaller than near points', () => {
    const viewport = { width: 1280, height: 720 };
    const near = projectDeskPoint({ x: 0, y: 1.1, z: 1.2 }, viewport);
    const far = projectDeskPoint({ x: 0, y: 1.1, z: 8.4 }, viewport);

    expect(far.y).toBeLessThan(near.y);
    expect(far.scale).toBeLessThan(near.scale);
    expect(near.y - far.y).toBeGreaterThan(60);
    expect(near.scale / far.scale).toBeGreaterThan(3);
  });

  it('compresses lateral offset with depth', () => {
    const viewport = { width: 1280, height: 720 };
    const centerX = viewport.width * 0.5;
    const near = projectDeskPoint({ x: 1.4, y: 1.1, z: 1.2 }, viewport);
    const far = projectDeskPoint({ x: 1.4, y: 1.1, z: 8.4 }, viewport);

    const nearOffset = Math.abs(near.x - centerX);
    const farOffset = Math.abs(far.x - centerX);
    expect(farOffset).toBeLessThan(nearOffset);
    expect(nearOffset / farOffset).toBeGreaterThan(3);
  });

  it('flags behind-camera depth and avoids normal projection scale', () => {
    const viewport = { width: 1280, height: 720 };
    const projected = projectDeskPoint({ x: 0.8, y: 1.1, z: -0.2 }, viewport);

    expect(projected.depthClamped).toBe(true);
    expect(projected.scale).toBe(0);
    expect(projected.x).toBeCloseTo(viewport.width * 0.5, 6);
    expect(projected.y).toBeCloseTo(viewport.height * 0.88, 6);
  });

  it('is wired into StageRenderer render path', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/game/render/StageRenderer.ts'), 'utf-8');

    expect(source).toContain("from './cameraRig'");
    expect(source).toContain('projectDeskPoint(');
    expect(source).toContain("from './deskLayout'");
    expect(source).toContain('createDeskLayout(');
  });
});
