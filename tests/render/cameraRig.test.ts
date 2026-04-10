import { describe, expect, it } from 'vitest';
import { projectDeskPoint } from '../../src/game/render/cameraRig';

describe('projectDeskPoint', () => {
  it('projects far points higher and smaller than near points', () => {
    const viewport = { width: 1280, height: 720 };
    const near = projectDeskPoint({ x: 0, y: 1.1, z: 1.2 }, viewport);
    const far = projectDeskPoint({ x: 0, y: 1.1, z: 8.4 }, viewport);

    expect(far.y).toBeLessThan(near.y);
    expect(far.scale).toBeLessThan(near.scale);
  });

  it('compresses lateral offset with depth', () => {
    const viewport = { width: 1280, height: 720 };
    const centerX = viewport.width * 0.5;
    const near = projectDeskPoint({ x: 1.4, y: 1.1, z: 1.2 }, viewport);
    const far = projectDeskPoint({ x: 1.4, y: 1.1, z: 8.4 }, viewport);

    expect(Math.abs(far.x - centerX)).toBeLessThan(Math.abs(near.x - centerX));
  });
});
