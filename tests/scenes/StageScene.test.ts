import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RuntimeSnapshot, ShellEvent } from '../../src/game/runtime/runtimeTypes';

function createSnapshot(
  overrides: Partial<RuntimeSnapshot> = {},
): RuntimeSnapshot {
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
    ...overrides,
  };
}

function createStageFixture(input: {
  id: string;
  order: number;
  theme?: 'room' | 'office';
  throwLimit?: number;
  requiredSuccesses?: number;
  strengthLabel?: 'weak' | 'medium' | 'strong';
  targetLateralSpeed?: number;
  windResponse?: number;
  gravityScaleInZone?: number;
  fanPosition?: { x: number; y: number; z: number };
  obstacles?: Array<{
    id: string;
    kind: 'static_block' | 'moving_block' | 'narrow_gate';
    position: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
    motion: {
      type: 'none' | 'ping_pong_x' | 'ping_pong_y';
      amplitude: number;
      durationMs: number;
      phaseMs: number;
      timeSource: 'world_time';
    };
  }>;
}) {
  return {
    id: input.id,
    order: input.order,
    theme: input.theme ?? 'office',
    clear: { throwLimit: input.throwLimit ?? 3, requiredSuccesses: input.requiredSuccesses ?? 1 },
    retryPolicy: { resetThrowOnly: true, keepWorldTimeOnRetry: true },
    aim: {
      yawMinDeg: -18,
      yawMaxDeg: 18,
      pitchMinDeg: 18,
      pitchMaxDeg: 54,
      defaultYawDeg: 0,
      defaultPitchDeg: 30,
    },
    power: {
      mode: 'ping_pong',
      minPower: 0.25,
      maxPower: 1,
      gaugeSpeed: 1.5,
      startPower: 0.55,
    },
    paper: { spawn: { x: 0, y: 1.45, z: 0.65 }, radius: 0.11 },
    physics: {
      fixedDtSec: 1 / 60,
      gravityY: -22,
      linearDrag: 1.35,
      maxFallSpeed: -18,
      obstacleRestitution: 0.22,
      rimRestitution: 0.34,
      tangentialDamping: 0.84,
      minSeparationSpeed: 2.4,
      maxFlightTimeMs: 4000,
    },
    fan: {
      enabled: true,
      position: input.fanPosition ?? { x: -1.4, y: 1.35, z: 2.1 },
      directionDeg: 90,
      strength: 1,
      strengthLabel: input.strengthLabel ?? 'weak',
      targetLateralSpeed: input.targetLateralSpeed ?? 1.2,
      windResponse: input.windResponse ?? 6,
      gravityScaleInZone: input.gravityScaleInZone ?? 0.96,
      influenceShape: 'box' as const,
      influenceLength: 4.2,
      influenceWidth: 2.6,
      influenceHeight: 2.2,
      feather: 0.3,
      showParticles: true,
    },
    obstacles: input.obstacles ?? [],
    bin: {
      position: { x: 0.2, y: 0.85, z: 8.8 },
      openingWidth: 0.9,
      openingHeight: 1.05,
      innerDepth: 0.9,
      depthTolerance: 0.35,
      rimThickness: 0.08,
      entryAssistRadius: 0.18,
      entrySpeedMin: 2,
      entrySpeedMax: 11.5,
      settleTimeMs: 120,
    },
    assists: { showGuideArc: true, showFailureReason: true, showAimReticle: true },
    inputMode: 'drag_release' as const,
    artTheme: 'desk-diorama-paper' as const,
    score: { mode: 'binary_success' as const, successValue: 1, failureValue: 0 },
    cameraPreset: 'desk-diorama-low' as const,
    clearConditionText: `${input.throwLimit ?? 3}번 안에 ${input.requiredSuccesses ?? 1}회 성공`,
  };
}

async function loadFixture(input: {
  snapshot: RuntimeSnapshot;
  shellEvent?: ShellEvent | null;
  search?: string;
}) {
  vi.resetModules();

  const search = input.search ?? '';
  window.history.replaceState({}, '', search ? `/${search.startsWith('?') ? search : `?${search}`}` : '/');

  const hudRender = vi.fn();
  const stageRender = vi.fn();
  const retryThrow = vi.fn();
  const restartStage = vi.fn();
  const runtimeCtorStage = vi.fn();
  const dragCtorStage = vi.fn();
  const rendererCtorStage = vi.fn();
  const runtime = {
    tick: vi.fn(),
    getSnapshot: vi.fn(() => input.snapshot),
    releaseDragThrow: vi.fn(),
    retryThrow,
    restartStage,
    consumeShellEvent: vi.fn(() => input.shellEvent ?? null),
  };
  const keyboardOn = vi.fn();
  const canvas = {
    style: {} as Record<string, string>,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 800 }),
  };
  const actions = document.createElement('div');
  actions.hidden = true;
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  actions.appendChild(retryButton);
  const hudRoot = {
    element: document.createElement('div'),
    stageValue: document.createElement('span'),
    throwValue: document.createElement('span'),
    successValue: document.createElement('span'),
    windValue: document.createElement('span'),
    debugStrip: document.createElement('div'),
    aimValue: document.createElement('span'),
    powerValue: document.createElement('span'),
    failureReason: document.createElement('span'),
    resultBanner: document.createElement('div'),
    confirmAimButton: document.createElement('button'),
    confirmPowerButton: document.createElement('button'),
    retryButton,
  };

  vi.doMock('phaser', () => ({
    default: {
      Scene: class {
        game = { canvas };
        input = { keyboard: { on: keyboardOn } };
        events = { once: vi.fn() };
      },
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Math: {
        Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
      },
    },
  }));

  vi.doMock('../../src/game/runtime/StageRuntime', () => ({
    StageRuntime: class {
      constructor(stage: unknown) {
        runtimeCtorStage(stage);
        return runtime;
      }
    },
  }));
  vi.doMock('../../src/game/render/StageRenderer', () => ({
    StageRenderer: class {
      constructor(_scene: unknown, stage: unknown) {
        rendererCtorStage(stage);
        return {
          render: stageRender,
        };
      }
    },
  }));
  vi.doMock('../../src/game/hud/HudPresenter', () => ({
    HudPresenter: class {
      constructor() {
        return {
          render: hudRender,
        };
      }
    },
  }));
  vi.doMock('../../src/game/hud/createHudRoot', () => ({
    createHudRoot: vi.fn(() => hudRoot),
  }));
  vi.doMock('../../src/game/input/DragThrowController', () => ({
    DragThrowController: class {
      constructor(stage: unknown) {
        dragCtorStage(stage);
        return {
          beginDrag: vi.fn(),
          updateDrag: vi.fn(),
          releaseDrag: vi.fn(() => null),
          getPreview: vi.fn(() => ({
            active: false,
            yawDeg: 0,
            pitchDeg: 30,
            power01: 0,
          })),
        };
      }
    },
  }));
  vi.doMock('../../src/game/stages/stageCatalog', () => ({
    stageCatalog: [
      createStageFixture({ id: 'stage-01', order: 1, theme: 'room', strengthLabel: 'weak', targetLateralSpeed: 1.2 }),
      createStageFixture({ id: 'stage-02', order: 2, theme: 'room', strengthLabel: 'weak', targetLateralSpeed: 1.8 }),
      createStageFixture({ id: 'stage-03', order: 3, theme: 'room', strengthLabel: 'medium', targetLateralSpeed: 2.5 }),
      createStageFixture({
        id: 'stage-04',
        order: 4,
        throwLimit: 4,
        strengthLabel: 'strong',
        targetLateralSpeed: 3.4,
        windResponse: 8,
        gravityScaleInZone: 0.88,
        fanPosition: { x: -1.45, y: 1.35, z: 2.05 },
        obstacles: [
          {
            id: 'block-left',
            kind: 'static_block',
            position: { x: -0.55, y: 1.15, z: 5.15 },
            size: { x: 0.6, y: 0.95, z: 0.35 },
            motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' },
          },
          {
            id: 'block-right',
            kind: 'static_block',
            position: { x: 0.75, y: 1.2, z: 6.05 },
            size: { x: 0.7, y: 1, z: 0.35 },
            motion: { type: 'none', amplitude: 0, durationMs: 0, phaseMs: 0, timeSource: 'world_time' },
          },
        ],
      }),
    ],
  }));

  const { StageScene } = await import('../../src/game/scenes/StageScene');
  const scene = new StageScene();
  scene.create();

  return {
    scene,
    hudRender,
    runtime,
    retryButton,
    runtimeCtorStage,
    dragCtorStage,
    rendererCtorStage,
  };
}

describe('StageScene', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
  });

  it('renders quantitative wind text on the first frame', async () => {
    const { hudRender } = await loadFixture({
      snapshot: createSnapshot(),
    });

    expect(hudRender).toHaveBeenCalled();
    expect(hudRender.mock.lastCall?.[0].windText).toContain('1.2');
  });

  it('promotes a final failed shell event into a retryable game over state', async () => {
    const { scene, hudRender, runtime } = await loadFixture({
      snapshot: createSnapshot({
        remainingThrows: 0,
        stageStatus: 'failed',
        failureReason: 'ground_hit',
        resultOverlay: { kind: 'failure', text: 'ground_hit' },
      }),
      shellEvent: { type: 'stage_failed', stageId: 'stage-01' },
    });

    scene.update(0, 16);

    expect(runtime.consumeShellEvent).toHaveBeenCalled();
    expect(hudRender.mock.lastCall?.[0]).toMatchObject({
      resultBannerText: 'Game Over',
      primaryActionText: 'Retry',
      primaryActionVisible: true,
    });
  });

  it('selects stage from query and publishes stage debug state metadata', async () => {
    const { hudRender, runtimeCtorStage, dragCtorStage, rendererCtorStage } = await loadFixture({
      snapshot: createSnapshot(),
      search: '?stage=4',
    });

    expect(hudRender.mock.lastCall?.[0].stageLabel).toBe('Stage 4');
    expect(document.body.dataset.stageId).toBe('stage-04');
    expect(document.body.dataset.stageOrder).toBe('4');
    expect(document.body.dataset.stageSource).toBe('query');
    expect(document.body.dataset.stageObstacles).toBe('block-left,block-right');

    expect(runtimeCtorStage).toHaveBeenCalledWith(expect.objectContaining({ id: 'stage-04', order: 4 }));
    expect(dragCtorStage).toHaveBeenCalledWith(expect.objectContaining({ id: 'stage-04', order: 4 }));
    expect(rendererCtorStage).toHaveBeenCalledWith(expect.objectContaining({ id: 'stage-04', order: 4 }));
    expect(runtimeCtorStage).toHaveBeenCalledTimes(1);
    expect(dragCtorStage).toHaveBeenCalledTimes(1);
    expect(rendererCtorStage).toHaveBeenCalledTimes(1);
  });

  it('binds the retry button to a full stage restart after game over', async () => {
    const { scene, runtime, retryButton } = await loadFixture({
      snapshot: createSnapshot({
        remainingThrows: 0,
        stageStatus: 'failed',
        failureReason: 'ground_hit',
        resultOverlay: { kind: 'failure', text: 'ground_hit' },
      }),
      shellEvent: { type: 'stage_failed', stageId: 'stage-01' },
    });

    scene.update(0, 16);
    retryButton.click();

    expect(runtime.restartStage).toHaveBeenCalled();
  });
});
