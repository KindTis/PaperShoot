import Phaser from 'phaser';
import { HudPresenter, type HudViewModel } from '../hud/HudPresenter';
import { createHudRoot, type HudRoot } from '../hud/createHudRoot';
import { DragThrowController } from '../input/DragThrowController';
import { StageRenderer } from '../render/StageRenderer';
import { StageRuntime } from '../runtime/StageRuntime';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { resolveStageSelection } from '../stages/resolveStageSelection';
import { shouldBeginLaunchDrag, shouldResetForNewDrag } from './stageInputPolicy';
import { stageCatalog } from '../stages/stageCatalog';
import { publishStageDebugState } from './publishStageDebugState';

const FIXED_DT_MS = 1000 / 60;

export class StageScene extends Phaser.Scene {
  private stage!: (typeof stageCatalog)[number];
  private runtime!: StageRuntime;
  private dragController!: DragThrowController;
  private accumulatorMs = 0;
  private shellBannerText = '';
  private primaryActionText = '';
  private primaryActionVisible = false;

  private stageRenderer!: StageRenderer;
  private hud!: HudPresenter;
  private hudRoot!: HudRoot;

  constructor() {
    super('StageScene');
  }

  create(): void {
    const selection = resolveStageSelection(window.location.search, stageCatalog.length);
    this.stage = stageCatalog.find((stage) => stage.order === selection.order) ?? stageCatalog[0];
    this.runtime = new StageRuntime(this.stage);
    this.dragController = new DragThrowController(this.stage);
    publishStageDebugState(document, {
      stageId: this.stage.id,
      stageOrder: this.stage.order,
      stageSource: selection.source,
      obstacleIds: this.stage.obstacles.map((o) => o.id),
    });

    this.stageRenderer = new StageRenderer(this, this.stage);
    this.hudRoot = createHudRoot(document);
    this.hud = new HudPresenter(this.hudRoot);

    this.bindDragInput();
    this.bindKeyboardInput();
    this.bindHudActions();
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
      const snapshot = this.runtime.getSnapshot();
      if (snapshot.stageStatus === 'failed') {
        this.runtime.restartStage();
        this.clearShellUi();
        this.renderFrame();
        return;
      }

      if (snapshot.stageStatus === 'playing') {
        this.runtime.retryThrow();
      }
    });
  }

  private bindHudActions(): void {
    const onRetry = () => {
      this.runtime.restartStage();
      this.clearShellUi();
      this.renderFrame();
    };

    this.hudRoot.retryButton.addEventListener('click', onRetry);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hudRoot.retryButton.removeEventListener('click', onRetry);
    });
  }

  private hideLegacyTouchButtons(): void {
    this.hudRoot.confirmAimButton.hidden = true;
    this.hudRoot.confirmPowerButton.hidden = true;
    this.hudRoot.retryButton.hidden = true;
  }

  private renderFrame(): void {
    const snapshot = this.runtime.getSnapshot();
    this.applyShellEvent(this.runtime.consumeShellEvent());
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
      windText: this.stage.fan.enabled
        ? `${windArrow} ${this.stage.fan.strengthLabel} ${Math.abs(this.stage.fan.targetLateralSpeed).toFixed(1)}`
        : '· calm 0.0',
      aimText: '',
      powerText: '',
      failureReasonText: '',
      resultBannerText: this.shellBannerText || snapshot.resultOverlay.text || tutorialText,
      primaryActionText: this.primaryActionText,
      primaryActionVisible: this.primaryActionVisible,
    };
  }

  private applyShellEvent(shellEvent: ReturnType<StageRuntime['consumeShellEvent']>): void {
    if (!shellEvent) {
      return;
    }

    if (shellEvent.type === 'stage_failed') {
      this.shellBannerText = 'Game Over';
      this.primaryActionText = 'Retry';
      this.primaryActionVisible = true;
      return;
    }

    this.shellBannerText = 'Stage Clear';
    this.primaryActionText = '';
    this.primaryActionVisible = false;
  }

  private clearShellUi(): void {
    this.shellBannerText = '';
    this.primaryActionText = '';
    this.primaryActionVisible = false;
  }

  private normalizeDomPointer(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Phaser.Math.Clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
      y: Phaser.Math.Clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
    };
  }
}
