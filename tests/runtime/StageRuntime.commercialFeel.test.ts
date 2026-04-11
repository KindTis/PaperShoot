import { describe, expect, it } from 'vitest';
import { DragThrowController } from '../../src/game/input/DragThrowController';
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

  it('lets a full-screen upward drag reach the bin lane before dropping short', () => {
    const runtime = new StageRuntime(stage01);
    const drag = new DragThrowController(stage01);

    drag.beginDrag({ x: 0.5, y: 0.92 });
    drag.updateDrag({ x: 0.5, y: 0.08 });
    runtime.releaseDragThrow(drag.releaseDrag());

    for (let frame = 0; frame < 36; frame += 1) {
      runtime.tick(1000 / 60);
    }

    const snapshot = runtime.getSnapshot();
    expect(snapshot.failureReason).toBeNull();
    expect(snapshot.activeBody).not.toBeNull();
    expect(snapshot.activeBody!.position.z).toBeGreaterThan(stage01.bin.position.z - 1.9);
    expect(snapshot.activeBody!.position.y).toBeGreaterThan(stage01.paper.radius);
  });
});
