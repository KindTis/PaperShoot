import { HudPresenter, type HudViewModel } from '../hud/HudPresenter';
import { createHudRoot } from '../hud/createHudRoot';
import { StageRenderer } from '../render/StageRenderer';
import { StageRuntime } from '../runtime/StageRuntime';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { stageCatalog } from '../stages/stageCatalog';

const FIXED_DT_MS = 1000 / 60;

export class StageScene {
  private readonly runtime = new StageRuntime(stageCatalog[0]);
  private readonly renderer = new StageRenderer();
  private readonly hud = new HudPresenter(createHudRoot(document));
  private accumulatorMs = 0;

  update(_time: number, delta: number): void {
    this.accumulatorMs += delta;
    while (this.accumulatorMs >= FIXED_DT_MS) {
      this.runtime.tick(FIXED_DT_MS);
      this.accumulatorMs -= FIXED_DT_MS;
    }

    const snapshot = this.runtime.getSnapshot();
    this.renderer.render(snapshot);
    this.hud.render(this.mapHudView(snapshot));
  }

  private mapHudView(snapshot: RuntimeSnapshot): HudViewModel {
    return {
      stageLabel: `Stage ${stageCatalog[0].order}`,
      throwText: `${snapshot.throwIndex} / ${stageCatalog[0].clear.throwLimit}`,
      successText: `${snapshot.successCount} / ${stageCatalog[0].clear.requiredSuccesses}`,
      windText: stageCatalog[0].fan.strengthLabel,
      aimText: `Yaw ${snapshot.input.yawDeg.toFixed(0)} / Pitch ${snapshot.input.pitchDeg.toFixed(0)}`,
      powerText: `Power ${(snapshot.input.power * 100).toFixed(0)}%`,
      failureReasonText: snapshot.failureReason ?? '',
      resultBannerText: snapshot.resultOverlay.text,
    };
  }
}
