import { describe, expect, it } from 'vitest';
import { ThrowInputController } from '../../src/game/input/ThrowInputController';
import type { StageConfig } from '../../src/game/contracts';

type MoveListener = (input: { normalizedX: number; normalizedY: number }) => void;
type VoidListener = () => void;

class PointerInputStub {
  private moveListeners: MoveListener[] = [];
  private clickListeners: VoidListener[] = [];

  onMove(listener: MoveListener): void {
    this.moveListeners.push(listener);
  }

  onLeftClick(listener: VoidListener): void {
    this.clickListeners.push(listener);
  }

  move(input: { normalizedX: number; normalizedY: number }): void {
    for (const listener of this.moveListeners) {
      listener(input);
    }
  }

  leftClick(): void {
    for (const listener of this.clickListeners) {
      listener();
    }
  }
}

class KeyboardStub {
  private listeners = new Map<string, VoidListener[]>();

  onKey(key: string, listener: VoidListener): void {
    const current = this.listeners.get(key) ?? [];
    current.push(listener);
    this.listeners.set(key, current);
  }

  press(key: string): void {
    const listeners = this.listeners.get(key) ?? [];
    for (const listener of listeners) {
      listener();
    }
  }
}

const createConfig = (): StageConfig => ({
  id: 'stage-01',
  order: 1,
  theme: 'room',
  clear: { throwLimit: 3, requiredSuccesses: 1 },
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
    minPower: 0,
    maxPower: 1,
    gaugeSpeed: 2,
    startPower: 0.35,
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
    position: { x: 0, y: 1.35, z: 2.1 },
    directionDeg: 0,
    strength: 1,
    strengthLabel: 'weak',
    targetLateralSpeed: 1.2,
    windResponse: 6,
    gravityScaleInZone: 0.96,
    influenceShape: 'box',
    influenceLength: 4,
    influenceWidth: 2,
    influenceHeight: 2,
    feather: 0.3,
    showParticles: false,
  },
  obstacles: [],
  bin: {
    position: { x: 0, y: 1.1, z: 8.2 },
    openingWidth: 0.8,
    openingHeight: 0.45,
    innerDepth: 0.7,
    depthTolerance: 0.35,
    rimThickness: 0.06,
    entryAssistRadius: 0.18,
    entrySpeedMin: 2,
    entrySpeedMax: 11.5,
    settleTimeMs: 120,
  },
  assists: {
    showGuideArc: true,
    showFailureReason: true,
    showAimReticle: true,
  },
  inputMode: 'drag_release',
  artTheme: 'desk-diorama-paper',
  score: {
    mode: 'binary_success',
    successValue: 1,
    failureValue: 0,
  },
  cameraPreset: 'desk-diorama-low',
  clearConditionText: '1 success in 3 throws',
});

describe('ThrowInputController', () => {
  it('moves through aim -> power -> flying with direct calls', () => {
    const controller = new ThrowInputController(createConfig());

    controller.updateAimFromNormalizedPoint({ x: 0.75, y: 0.25 });
    controller.confirmAim();
    controller.tick(200);
    controller.confirmPower();

    expect(controller.getSnapshot().phase).toBe('flying');
  });

  it('resets to aim phase and start power on retry', () => {
    const config = createConfig();
    const controller = new ThrowInputController(config);

    controller.confirmAim();
    controller.tick(250);
    controller.confirmPower();
    controller.resetForRetry();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('aim');
    expect(snapshot.power).toBe(config.power.startPower);
  });

  it('binds touch action buttons to the shared state machine', () => {
    const controller = new ThrowInputController(createConfig());
    const confirmAimButton = document.createElement('button');
    const confirmPowerButton = document.createElement('button');
    const retryButton = document.createElement('button');

    controller.bindTouchButtons({
      confirmAimButton,
      confirmPowerButton,
      retryButton,
    });

    confirmAimButton.click();
    expect(controller.getSnapshot().phase).toBe('power');

    confirmPowerButton.click();
    expect(controller.getSnapshot().phase).toBe('flying');

    retryButton.click();
    expect(controller.getSnapshot().phase).toBe('aim');
  });

  it('binds mouse and keyboard to the same transitions', () => {
    const pointerInput = new PointerInputStub();
    const keyboard = new KeyboardStub();
    const controller = new ThrowInputController(createConfig());

    controller.bindMouseHandlers(pointerInput);
    controller.bindKeyboardHandlers(keyboard);

    pointerInput.move({ normalizedX: 0.7, normalizedY: 0.3 });
    pointerInput.leftClick();
    expect(controller.getSnapshot().phase).toBe('power');

    keyboard.press('Space');
    expect(controller.getSnapshot().phase).toBe('flying');

    keyboard.press('R');
    expect(controller.getSnapshot().phase).toBe('aim');
  });
});
