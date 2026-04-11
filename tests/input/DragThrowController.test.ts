import { describe, expect, it } from 'vitest';
import { stage01 } from '../../src/game/stages/stage01';
import { DragThrowController } from '../../src/game/input/DragThrowController';

describe('DragThrowController', () => {
  it('returns null when released without meaningful drag', () => {
    const controller = new DragThrowController(stage01);

    controller.beginDrag({ x: 0.5, y: 0.88 });

    expect(controller.getPreview().active).toBe(false);
    expect(controller.releaseDrag()).toBeNull();
    expect(controller.getPreview().active).toBe(false);
  });

  it('activates preview only after meaningful movement and raises power', () => {
    const controller = new DragThrowController(stage01);

    controller.beginDrag({ x: 0.5, y: 0.88 });
    controller.updateDrag({ x: 0.502, y: 0.879 });

    const tinyMovePreview = controller.getPreview();
    expect(tinyMovePreview.active).toBe(false);

    controller.updateDrag({ x: 0.62, y: 0.54 });

    const preview = controller.getPreview();
    expect(preview).toMatchObject({ active: true });
    expect(preview.power01).toBeGreaterThan(0.4);
    expect(preview.yawDeg).not.toBe(stage01.aim.defaultYawDeg);
  });

  it('returns flying launch payload with power01 and resets preview on release', () => {
    const controller = new DragThrowController(stage01);

    controller.beginDrag({ x: 0.5, y: 0.88 });
    controller.updateDrag({ x: 0.62, y: 0.54 });
    const previewBeforeRelease = controller.getPreview();
    const launch = controller.releaseDrag();

    expect(launch).not.toBeNull();
    expect(launch).toMatchObject({
      yawDeg: previewBeforeRelease.yawDeg,
      pitchDeg: previewBeforeRelease.pitchDeg,
      power01: previewBeforeRelease.power01,
      phaseAfterRelease: 'flying',
    });
    expect(controller.getPreview().active).toBe(false);
  });

  it('keeps a full upward drag at max power without turning into an extreme lob', () => {
    const controller = new DragThrowController(stage01);

    controller.beginDrag({ x: 0.5, y: 0.92 });
    controller.updateDrag({ x: 0.5, y: 0.08 });

    const preview = controller.getPreview();

    expect(preview.active).toBe(true);
    expect(preview.power01).toBe(1);
    expect(preview.pitchDeg).toBeGreaterThan(stage01.aim.defaultPitchDeg);
    expect(preview.pitchDeg).toBeLessThanOrEqual(42);
  });
});
