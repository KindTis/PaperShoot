import { describe, expect, it, vi } from 'vitest';
import { assetManifest } from '../../src/game/assets/assetManifest';
import { projectDeskPoint } from '../../src/game/render/cameraRig';
import { createDeskLayout } from '../../src/game/render/deskLayout';
import { createBinEntryWindowRect, createBinSpriteLayout } from '../../src/game/render/stageSpriteLayout';
import { stage03 } from '../../src/game/stages/stage03';
import { stage06 } from '../../src/game/stages/stage06';
import type { RuntimeSnapshot } from '../../src/game/runtime/runtimeTypes';

function createSnapshot(): RuntimeSnapshot {
  return {
    worldTimeMs: 0,
    throwIndex: 0,
    remainingThrows: 3,
    successCount: 0,
    stageStatus: 'playing',
    resultOverlay: { kind: null, text: '' },
    failureReason: null,
    input: {
      phase: 'aim',
      yawDeg: 0,
      pitchDeg: 30,
      power: 0.55,
    },
    activeBody: null,
  };
}

function createGraphicsStub() {
  return {
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
    closePath: vi.fn(),
    fillPath: vi.fn(),
  };
}

function createImageStub() {
  return {
    setVisible: vi.fn(),
    setDepth: vi.fn(),
    setPosition: vi.fn(),
    setDisplaySize: vi.fn(),
    setAngle: vi.fn(),
    setAlpha: vi.fn(),
    setOrigin: vi.fn(),
  };
}

describe('StageRenderer theme routing', () => {
  it('uses a distinct backdrop color for office stages', async () => {
    vi.resetModules();
    vi.doMock('phaser', () => ({
      default: {
        Math: {
          Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
          Linear: (start: number, end: number, t: number) => start + (end - start) * t,
        },
      },
    }));

    const { StageRenderer } = await import('../../src/game/render/StageRenderer');
    const roomGraphics = createGraphicsStub();
    const officeGraphics = createGraphicsStub();
    const roomCamera = { setBackgroundColor: vi.fn() };
    const officeCamera = { setBackgroundColor: vi.fn() };
    const roomScene = {
      add: { graphics: () => roomGraphics },
      scale: { width: 800, height: 800 },
      cameras: { main: roomCamera },
    };
    const officeScene = {
      add: { graphics: () => officeGraphics },
      scale: { width: 800, height: 800 },
      cameras: { main: officeCamera },
    };

    const roomStage = {
      ...stage03,
      id: 'theme-room-test',
      theme: 'room' as const,
    };

    const roomRenderer = new StageRenderer(roomScene as never, roomStage);
    const officeRenderer = new StageRenderer(officeScene as never, stage03);

    roomRenderer.render(createSnapshot());
    officeRenderer.render(createSnapshot());

    expect(roomCamera.setBackgroundColor).toHaveBeenCalledTimes(1);
    expect(officeCamera.setBackgroundColor).toHaveBeenCalledTimes(1);
    expect(officeCamera.setBackgroundColor.mock.lastCall?.[0]).not.toBe(roomCamera.setBackgroundColor.mock.lastCall?.[0]);
  });

  it('creates office raster background layers and maps late-game obstacle ids to authored raster keys', async () => {
    vi.resetModules();
    vi.doMock('phaser', () => ({
      default: {
        Math: {
          Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
          Linear: (start: number, end: number, t: number) => start + (end - start) * t,
        },
      },
    }));

    const { StageRenderer } = await import('../../src/game/render/StageRenderer');
    const graphics = createGraphicsStub();
    const createdKeys: string[] = [];
    const imageFactory = vi.fn((_: number, __: number, key: string) => {
      createdKeys.push(key);
      return createImageStub();
    });
    const scene = {
      add: {
        graphics: () => graphics,
        image: imageFactory,
      },
      textures: { exists: vi.fn(() => true) },
      scale: { width: 1280, height: 720 },
      cameras: { main: { setBackgroundColor: vi.fn() } },
    };

    const renderer = new StageRenderer(scene as never, stage06);
    renderer.render(createSnapshot());

    expect(createdKeys).toEqual(
      expect.arrayContaining([
        assetManifest.background.backplate.key,
        assetManifest.background.foregroundDeskEdge.key,
      ]),
    );
    expect(createdKeys).toEqual(
      expect.arrayContaining([assetManifest.obstacles.swingPanel.key, assetManifest.obstacles.narrowGate.key]),
    );
  });


});
