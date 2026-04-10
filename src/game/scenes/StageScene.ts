import Phaser from 'phaser';
import { HudPresenter, type HudViewModel } from '../hud/HudPresenter';
import { createHudRoot, type HudRoot } from '../hud/createHudRoot';
import { StageRenderer } from '../render/StageRenderer';
import { StageRuntime } from '../runtime/StageRuntime';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { stageCatalog } from '../stages/stageCatalog';
import { shouldConfirmFromPointerDown } from './stageInputPolicy';

const FIXED_DT_MS = 1000 / 60;

const keyboardEventMap: Record<string, string> = {
  Space: 'SPACE',
  R: 'R',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  A: 'A',
  D: 'D',
  W: 'W',
  S: 'S',
};

export class StageScene extends Phaser.Scene {
  private readonly runtime = new StageRuntime(stageCatalog[0]);
  private accumulatorMs = 0;

  private stageRenderer!: StageRenderer;
  private hud!: HudPresenter;
  private hudRoot!: HudRoot;

  constructor() {
    super('StageScene');
  }

  create(): void {
    this.stageRenderer = new StageRenderer(this, stageCatalog[0]);
    this.hudRoot = createHudRoot(document);
    this.hud = new HudPresenter(this.hudRoot);

    this.bindPointerInput();
    this.bindKeyboardInput();
    this.bindTouchButtons();
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

  private bindPointerInput(): void {
    this.runtime.bindMouseHandlers({
      onMove: (listener) => {
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
          if (this.runtime.getSnapshot().input.phase !== 'aim') {
            return;
          }

          listener({
            normalizedX: Phaser.Math.Clamp(pointer.x / Math.max(1, this.scale.width), 0, 1),
            normalizedY: Phaser.Math.Clamp(pointer.y / Math.max(1, this.scale.height), 0, 1),
          });
        });
      },
      onLeftClick: (listener) => {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (
            !shouldConfirmFromPointerDown({
              button: pointer.button,
              event: pointer.event,
            })
          ) {
            return;
          }
          listener();
        });
      },
    });
  }

  private bindKeyboardInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    this.runtime.bindKeyboardHandlers({
      onKey: (key, listener) => {
        const mapped = keyboardEventMap[key];
        if (!mapped) {
          return;
        }
        keyboard.on(`keydown-${mapped}`, listener);
      },
    });
  }

  private bindTouchButtons(): void {
    this.hudRoot.confirmAimButton.addEventListener('click', () => this.runtime.confirmAim());
    this.hudRoot.confirmPowerButton.addEventListener('click', () => this.runtime.confirmPower());
    this.hudRoot.retryButton.addEventListener('click', () => this.runtime.retryThrow());
  }

  private renderFrame(): void {
    const snapshot = this.runtime.getSnapshot();
    this.stageRenderer.render(snapshot);
    this.hud.render(this.mapHudView(snapshot));
  }

  private mapHudView(snapshot: RuntimeSnapshot): HudViewModel {
    return {
      stageLabel: `Stage ${stageCatalog[0].order}`,
      throwText: `${snapshot.throwIndex} / ${stageCatalog[0].clear.throwLimit}`,
      successText: `${snapshot.successCount} / ${stageCatalog[0].clear.requiredSuccesses}`,
      windText: `${stageCatalog[0].fan.strengthLabel} wind`,
      aimText: `Yaw ${snapshot.input.yawDeg.toFixed(0)} / Pitch ${snapshot.input.pitchDeg.toFixed(0)}`,
      powerText: `Power ${(snapshot.input.power * 100).toFixed(0)}%`,
      failureReasonText: snapshot.failureReason ?? '',
      resultBannerText: snapshot.resultOverlay.text || (stageCatalog[0].tutorialText ?? ''),
    };
  }
}
