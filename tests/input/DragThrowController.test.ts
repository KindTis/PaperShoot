import { describe, expect, it } from 'vitest';
import { stage01 } from '../../src/game/stages/stage01';
import { DragThrowController } from '../../src/game/input/DragThrowController';

describe('DragThrowController', () => {
  it('builds active preview from drag vector and returns flying launch payload on release', () => {
    const controller = new DragThrowController(stage01);

    controller.beginDrag({ x: 0.5, y: 0.88 });
    controller.updateDrag({ x: 0.62, y: 0.54 });

    const preview = controller.getPreview();
    expect(preview).toMatchObject({ active: true });
    expect(preview.power01).toBeGreaterThan(0.4);
    expect(preview.yawDeg).not.toBe(stage01.aim.defaultYawDeg);

    const launch = controller.releaseDrag();
    expect(launch).not.toBeNull();
    expect(launch?.phaseAfterRelease).toBe('flying');
  });
});