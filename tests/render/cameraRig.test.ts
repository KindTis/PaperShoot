import { describe, expect, it, vi } from 'vitest';
import { projectDeskPoint } from '../../src/game/render/cameraRig';
import { stage01 } from '../../src/game/stages/stage01';
import type { RuntimeSnapshot } from '../../src/game/runtime/runtimeTypes';

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

  it('suppresses behind-camera paper rendering through StageRenderer path', async () => {
    vi.resetModules();
    vi.doMock('phaser', () => ({
      default: {
        Math: {
          Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
        },
      },
    }));
    const { StageRenderer } = await import('../../src/game/render/StageRenderer');

    const graphics = {
      setDepth: vi.fn(),
      clear: vi.fn(),
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      fillRoundedRect: vi.fn(),
      lineStyle: vi.fn(),
      strokeRoundedRect: vi.fn(),
      strokeCircle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn(),
      fillCircle: vi.fn(),
    };
    const scene = {
      add: { graphics: () => graphics },
      scale: { width: 1280, height: 720 },
      cameras: { main: { setBackgroundColor: vi.fn() } },
    };
    const stage = {
      ...stage01,
      theme: 'room' as const,
      fan: { ...stage01.fan, enabled: false },
      paper: { ...stage01.paper, spawn: { ...stage01.paper.spawn, z: -0.2 } },
    };
    const snapshot: RuntimeSnapshot = {
      worldTimeMs: 0,
      throwIndex: 0,
      remainingThrows: stage.clear.throwLimit,
      successCount: 0,
      stageStatus: 'playing',
      resultOverlay: { kind: null, text: '' },
      failureReason: null,
      input: {
        phase: 'aim',
        yawDeg: stage.aim.defaultYawDeg,
        pitchDeg: stage.aim.defaultPitchDeg,
        power: stage.power.startPower,
      },
      activeBody: null,
    };
    const renderer = new StageRenderer(scene as never, stage);

    renderer.render(snapshot);

    expect(graphics.strokeCircle).not.toHaveBeenCalled();
    const largeFillCircleCalls = graphics.fillCircle.mock.calls.filter((call) => call[2] >= 10);
    expect(largeFillCircleCalls).toHaveLength(0);
  });
});
