import { describe, expect, it } from 'vitest';
import { StageRuntime } from '../../src/game/runtime/StageRuntime';
import { stage01 } from '../../src/game/stages/stage01';

describe('commercial integration', () => {
  it('keeps the commercial drag-release throw in the play loop without showing a result banner too early', () => {
    const runtime = new StageRuntime(stage01);

    runtime.releaseDragThrow({
      yawDeg: 2,
      pitchDeg: 40,
      power01: 0.68,
      phaseAfterRelease: 'flying',
    });

    const launched = runtime.getSnapshot();
    expect(launched.throwIndex).toBe(1);
    expect(launched.activeBody).not.toBeNull();

    runtime.tick(300);

    const snapshot = runtime.getSnapshot();
    expect(snapshot.activeBody?.position.z).toBeGreaterThan(stage01.paper.spawn.z + 1.2);
    expect(snapshot.resultOverlay.kind).toBeNull();
    expect(snapshot.resultOverlay.text).toBe('');
    expect(snapshot.stageStatus).toBe('playing');
    expect(snapshot.failureReason).toBeNull();
  });
});
