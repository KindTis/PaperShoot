import Phaser from 'phaser';
import { HudPresenter, type HudViewModel } from '../hud/HudPresenter';
import { createHudRoot, type HudRoot } from '../hud/createHudRoot';
import { DragThrowController } from '../input/DragThrowController';
import { StageRenderer } from '../render/StageRenderer';
import { StageRuntime } from '../runtime/StageRuntime';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { shouldBeginLaunchDrag, shouldResetForNewDrag } from './stageInputPolicy';
import { stageCatalog } from '../stages/stageCatalog';

const FIXED_DT_MS = 1000 / 60;

export class StageScene extends Phaser.Scene {
  private readonly stage = stageCatalog[0];
  private readonly runtime = new StageRuntime(this.stage);
  private readonly dragController = new DragThrowController(this.stage);
  private accumulatorMs = 0;

  private stageRenderer!: StageRenderer;
  private hud!: HudPresenter;
  private hudRoot!: HudRoot;

  constructor() {
    super('StageScene');
  }

  create(): void {
    this.stageRenderer = new StageRenderer(this, this.stage);
    this.hudRoot = createHudRoot(document);
    this.hud = new HudPresenter(this.hudRoot);

    this.bindDragInput();
    this.bindKeyboardInput();
    this.hideLegacyTouchButtons();
    this.renderFrame();
  }

  update(_time: number, delta: number): void {
    this.accumulatorMs += delta;
    while (this.accumulatorMs >= FIXED_DT_MS) {
      this.runtime.tick(FIXED_DT_MS);
      this.accumulatorMs -= FIXED_DT_MS;
    }

    this.renderFrame();
  }

  private bindDragInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const normalized = this.normalizePointer(pointer);
      const snapshot = this.runtime.getSnapshot();
      if (pointer.button !== 0 || snapshot.stageStatus !== 'playing') {
        return;
      }

      if (shouldResetForNewDrag({
        stageStatus: snapshot.stageStatus,
        hasActiveBody: snapshot.activeBody !== null,
        failureReason: snapshot.failureReason,
      })) {
        this.runtime.retryThrow();
      }

      if (!shouldBeginLaunchDrag(normalized)) {
        return;
      }

      this.dragController.beginDrag(normalized);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.dragController.updateDrag(this.normalizePointer(pointer));
    });

    this.input.on('pointerup', () => {
      this.runtime.releaseDragThrow(this.dragController.releaseDrag());
    });
    this.input.on('pointerupoutside', () => {
      this.dragController.releaseDrag();
    });
  }

  private bindKeyboardInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.on('keydown-R', () => {
      if (this.runtime.getSnapshot().stageStatus === 'playing') {
        this.runtime.retryThrow();
      }
    });
  }

  private hideLegacyTouchButtons(): void {
    const actions = this.hudRoot.confirmAimButton.parentElement as HTMLElement | null;
    if (actions) {
      actions.hidden = true;
    }
  }

  private renderFrame(): void {
    const snapshot = this.runtime.getSnapshot();
    const preview = this.dragController.getPreview();
    const renderSnapshot = preview.active
      ? {
          ...snapshot,
          input: {
            ...snapshot.input,
            yawDeg: preview.yawDeg,
            pitchDeg: preview.pitchDeg,
            power:
              this.stage.power.minPower + (this.stage.power.maxPower - this.stage.power.minPower) * preview.power01,
          },
        }
      : snapshot;
    this.stageRenderer.render(renderSnapshot);
    this.hud.render(this.mapHudView(renderSnapshot));
  }

  private mapHudView(snapshot: RuntimeSnapshot): HudViewModel {
    const windArrow = this.stage.fan.targetLateralSpeed < 0 ? '←' : this.stage.fan.targetLateralSpeed > 0 ? '→' : '·';
    const tutorialText =
      snapshot.throwIndex === 0 && snapshot.stageStatus === 'playing'
        ? '종이공을 위로 드래그해 던지세요.'
        : '';

    return {
      stageLabel: `Stage ${this.stage.order}`,
      throwText: `${snapshot.remainingThrows} throws left`,
      successText: `${snapshot.successCount}/${this.stage.clear.requiredSuccesses}`,
      windText: this.stage.fan.enabled ? `${windArrow} ${this.stage.fan.strengthLabel} wind` : '무풍',
      aimText: '',
      powerText: '',
      failureReasonText: '',
      resultBannerText: snapshot.resultOverlay.text || tutorialText,
    };
  }

  private normalizePointer(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(pointer.x / Math.max(1, this.scale.width), 0, 1),
      y: Phaser.Math.Clamp(pointer.y / Math.max(1, this.scale.height), 0, 1),
    };
  }
}
