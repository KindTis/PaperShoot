import type { StageConfig } from '../contracts';

export interface DragPreview {
  active: boolean;
  yawDeg: number;
  pitchDeg: number;
  power01: number;
}

export interface DragLaunchPayload {
  yawDeg: number;
  pitchDeg: number;
  power01: number;
  phaseAfterRelease: 'flying';
}

type Point = { x: number; y: number };

const DRAG_DISTANCE_FOR_MAX_POWER = 0.6;
const MIN_MEANINGFUL_DRAG_DISTANCE = 0.03;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizePoint(point: Point): Point {
  return {
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1),
  };
}

export class DragThrowController {
  private readonly stage: StageConfig;
  private dragStart: Point | null = null;
  private preview: DragPreview;

  constructor(stage: StageConfig) {
    this.stage = stage;
    this.preview = this.createInactivePreview();
  }

  beginDrag(point: Point): void {
    this.dragStart = normalizePoint(point);
    this.preview = this.createInactivePreview();
  }

  updateDrag(point: Point): void {
    if (!this.dragStart) {
      return;
    }

    const current = normalizePoint(point);
    const dragX = current.x - this.dragStart.x;
    const dragY = this.dragStart.y - current.y;
    const dragDistance = Math.hypot(dragX, dragY);
    if (dragDistance < MIN_MEANINGFUL_DRAG_DISTANCE) {
      this.preview = this.createInactivePreview();
      return;
    }

    const yawSpan = this.stage.aim.yawMaxDeg - this.stage.aim.yawMinDeg;
    const pitchSpan = this.stage.aim.pitchMaxDeg - this.stage.aim.pitchMinDeg;

    this.preview = {
      active: true,
      yawDeg: clamp(this.stage.aim.defaultYawDeg + dragX * yawSpan, this.stage.aim.yawMinDeg, this.stage.aim.yawMaxDeg),
      pitchDeg: clamp(
        this.stage.aim.defaultPitchDeg + dragY * pitchSpan,
        this.stage.aim.pitchMinDeg,
        this.stage.aim.pitchMaxDeg,
      ),
      power01: clamp(dragDistance / DRAG_DISTANCE_FOR_MAX_POWER, 0, 1),
    };
  }

  releaseDrag(): DragLaunchPayload | null {
    if (!this.dragStart || !this.preview.active) {
      this.dragStart = null;
      this.preview = this.createInactivePreview();
      return null;
    }

    const launch: DragLaunchPayload = {
      yawDeg: this.preview.yawDeg,
      pitchDeg: this.preview.pitchDeg,
      power01: this.preview.power01,
      phaseAfterRelease: 'flying',
    };

    this.dragStart = null;
    this.preview = this.createInactivePreview();

    return launch;
  }

  getPreview(): DragPreview {
    return { ...this.preview };
  }

  private createInactivePreview(): DragPreview {
    return {
      active: false,
      yawDeg: this.stage.aim.defaultYawDeg,
      pitchDeg: this.stage.aim.defaultPitchDeg,
      power01: 0,
    };
  }
}
