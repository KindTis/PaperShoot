import { describe, expect, it } from 'vitest';
import { StageRuntime } from '../../src/game/runtime/StageRuntime';
import { stageCatalog } from '../../src/game/stages/stageCatalog';

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

function tickRuntime(runtime: StageRuntime, frames: number, deltaMs = 1000 / 60): void {
  for (let index = 0; index < frames; index += 1) {
    runtime.tick(deltaMs);
  }
}

describe('StageRuntime', () => {
  it('delegates pointer and keyboard input through the runtime boundary', () => {
    const runtime = new StageRuntime(stageCatalog[0]);
    const pointer = new PointerInputStub();
    const keyboard = new KeyboardStub();

    runtime.bindMouseHandlers(pointer);
    runtime.bindKeyboardHandlers(keyboard);

    pointer.move({ normalizedX: 1, normalizedY: 0 });
    expect(runtime.getSnapshot().input.yawDeg).toBe(stageCatalog[0].aim.yawMaxDeg);

    pointer.leftClick();
    expect(runtime.getSnapshot().input.phase).toBe('power');

    keyboard.press('Space');
    expect(runtime.getSnapshot().input.phase).toBe('flying');
  });

  it('keeps world time moving across retries and clears resolved UI state', () => {
    const runtime = new StageRuntime(stageCatalog[0]);

    runtime.tick(1000 / 60);
    runtime.confirmAim();
    runtime.confirmPower();
    runtime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });
    runtime.retryThrow();

    expect(runtime.getSnapshot().worldTimeMs).toBeGreaterThan(0);
    expect(runtime.getSnapshot().input.phase).toBe('aim');
    expect(runtime.getSnapshot().activeBody).toBeNull();
    expect(runtime.getSnapshot().failureReason).toBe(null);
    expect(runtime.getSnapshot().resultOverlay.kind).toBe(null);
    expect(runtime.getSnapshot().resultOverlay.text).toBe('');
  });

  it('creates a paper body on confirmPower and clears after success overlay', () => {
    const runtime = new StageRuntime(stageCatalog[0]);

    runtime.confirmAim();
    expect(runtime.getSnapshot().activeBody).toBeNull();

    runtime.confirmPower();
    expect(runtime.getSnapshot().activeBody?.position).toEqual(stageCatalog[0].paper.spawn);

    runtime.applyThrowResolution({ success: true, failureReason: null });
    expect(runtime.getSnapshot().successCount).toBe(1);
    expect(runtime.getSnapshot().stageStatus).toBe('cleared');
    expect(runtime.getSnapshot().resultOverlay.kind).toBe('success');

    runtime.tick(320);
    expect(runtime.getSnapshot().resultOverlay.kind).toBe(null);
    expect(runtime.consumeShellEvent()).toEqual({
      type: 'stage_cleared',
      stageId: stageCatalog[0].id,
    });
  });

  it('decrements remaining throws on failure', () => {
    const runtime = new StageRuntime(stageCatalog[0]);

    runtime.confirmAim();
    runtime.confirmPower();

    const before = runtime.getSnapshot().remainingThrows;
    runtime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });

    expect(runtime.getSnapshot().remainingThrows).toBe(before - 1);
    expect(runtime.getSnapshot().failureReason).toBe('ground_hit');
    expect(runtime.getSnapshot().resultOverlay.kind).toBe('failure');

    runtime.tick(320);
    expect(runtime.getSnapshot().resultOverlay.kind).toBe(null);
  });

  it('keeps a stage 1 throw airborne briefly at around 80 percent power', () => {
    const runtime = new StageRuntime(stageCatalog[0]);

    runtime.confirmAim();
    runtime.tick(170);
    runtime.confirmPower();
    tickRuntime(runtime, 30);

    expect(runtime.getSnapshot().failureReason).not.toBe('ground_hit');
  });

  it('latches a success when the throw enters the bin volume', () => {
    const successStage = {
      ...stageCatalog[0],
      id: 'stage-success',
      fan: {
        ...stageCatalog[0].fan,
        enabled: false,
        targetLateralSpeed: 0,
        strength: 0,
      },
      physics: {
        ...stageCatalog[0].physics,
        gravityY: -12,
        maxFlightTimeMs: 2500,
      },
      bin: {
        ...stageCatalog[0].bin,
        position: { x: 0, y: 2.1, z: 2.8 },
        openingWidth: 6,
        openingHeight: 6,
        innerDepth: 2,
        depthTolerance: 0.05,
        entrySpeedMin: 0,
        entrySpeedMax: 20,
        settleTimeMs: 0,
      },
    };

    const runtime = new StageRuntime(successStage);
    runtime.confirmAim();
    runtime.confirmPower();
    tickRuntime(runtime, 20);

    expect(runtime.getSnapshot().successCount).toBe(1);
    expect(runtime.getSnapshot().stageStatus).toBe('cleared');
  });

  it('fails with a ground hit when the throw lands before success', () => {
    const groundStage = {
      ...stageCatalog[0],
      id: 'stage-ground-fail',
      clear: { throwLimit: 1, requiredSuccesses: 1 },
      fan: {
        ...stageCatalog[0].fan,
        enabled: false,
        targetLateralSpeed: 0,
        strength: 0,
      },
      physics: {
        ...stageCatalog[0].physics,
        gravityY: -24,
        maxFlightTimeMs: 4000,
      },
      bin: {
        ...stageCatalog[0].bin,
        position: { x: 6, y: 1.1, z: 14 },
      },
    };

    const runtime = new StageRuntime(groundStage);
    runtime.confirmAim();
    runtime.confirmPower();
    tickRuntime(runtime, 180);

    expect(runtime.getSnapshot().stageStatus).toBe('failed');
    expect(runtime.getSnapshot().failureReason).toBe('ground_hit');
  });

  it('emits stage_failed after the final miss', () => {
    const singleThrowStage = {
      ...stageCatalog[0],
      id: 'stage-01-single-throw',
      clear: { throwLimit: 1, requiredSuccesses: 1 },
    };

    const runtime = new StageRuntime(singleThrowStage);

    runtime.confirmAim();
    runtime.confirmPower();
    runtime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });

    expect(runtime.getSnapshot().stageStatus).toBe('failed');
    expect(runtime.consumeShellEvent()).toEqual({
      type: 'stage_failed',
      stageId: singleThrowStage.id,
    });
  });

  it('restarts a failed stage back to its initial shell state', () => {
    const singleThrowStage = {
      ...stageCatalog[0],
      id: 'stage-01-restart',
      clear: { throwLimit: 1, requiredSuccesses: 1 },
    };

    const runtime = new StageRuntime(singleThrowStage);

    runtime.confirmAim();
    runtime.confirmPower();
    runtime.applyThrowResolution({ success: false, failureReason: 'ground_hit' });

    expect(runtime.getSnapshot().stageStatus).toBe('failed');

    (runtime as StageRuntime & { restartStage: () => void }).restartStage();

    const snapshot = runtime.getSnapshot();
    expect(snapshot.throwIndex).toBe(0);
    expect(snapshot.remainingThrows).toBe(singleThrowStage.clear.throwLimit);
    expect(snapshot.successCount).toBe(0);
    expect(snapshot.stageStatus).toBe('playing');
    expect(snapshot.failureReason).toBeNull();
    expect(snapshot.resultOverlay).toEqual({ kind: null, text: '' });
    expect(snapshot.activeBody).toBeNull();
    expect(runtime.consumeShellEvent()).toBeNull();
  });
});
