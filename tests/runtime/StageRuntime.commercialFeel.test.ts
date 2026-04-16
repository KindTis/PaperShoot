import { describe, expect, it } from 'vitest';
import { StageRuntime } from '../../src/game/runtime/StageRuntime';
import { stage01 } from '../../src/game/stages/stage01';

describe('StageRuntime commercial feel', () => {
  it('keeps a drag-release throw moving forward before it drops', () => {
    const runtime = new StageRuntime(stage01);

    runtime.releaseDragThrow({
      yawDeg: 4,
      pitchDeg: 38,
      power01: 0.72,
      phaseAfterRelease: 'flying',
    });

    const before = runtime.getSnapshot().activeBody?.position;
    runtime.tick(150);
    const after = runtime.getSnapshot().activeBody?.position;

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after!.z).toBeGreaterThan(before!.z + 0.8);
    expect(after!.y).toBeGreaterThan(stage01.paper.radius);
    expect(runtime.getSnapshot().failureReason).toBeNull();
  });

});
