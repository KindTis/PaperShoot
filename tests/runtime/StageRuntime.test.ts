import { describe, expect, it } from 'vitest';
import { StageRuntime } from '../../src/game/runtime/StageRuntime';
import { stageCatalog } from '../../src/game/stages/stageCatalog';

describe('StageRuntime', () => {
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
});
