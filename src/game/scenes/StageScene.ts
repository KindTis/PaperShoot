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
    const canvas = this.game.canvas as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const normalized = this.normalizeDomPointer(canvas, event);
      const snapshot = this.runtime.getSnapshot();
      if (event.button !== 0 || snapshot.stageStatus !== 'playing') {
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

      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      this.dragController.beginDrag(normalized);
    };

    const onPointerMove = (event: PointerEvent) => {
      this.dragController.updateDrag(this.normalizeDomPointer(canvas, event));
    };

    const onPointerUp = (event: PointerEvent) => {
      event.preventDefault();
      this.runtime.releaseDragThrow(this.dragController.releaseDrag());
      canvas.releasePointerCapture?.(event.pointerId);
    };

    const onPointerCancel = (event: PointerEvent) => {
      event.preventDefault();
      this.dragController.releaseDrag();
      canvas.releasePointerCapture?.(event.pointerId);
    };

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('pointerleave', onPointerCancel);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerCancel);
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

  private normalizeDomPointer(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Phaser.Math.Clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
      y: Phaser.Math.Clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
    };
  }
}
