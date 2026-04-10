import type { HudRoot } from './createHudRoot';

export interface HudViewModel {
  stageLabel: string;
  throwText: string;
  successText: string;
  windText: string;
  aimText: string;
  powerText: string;
  failureReasonText: string;
  resultBannerText: string;
}

export class HudPresenter {
  private readonly root: HudRoot;

  constructor(root: HudRoot) {
    this.root = root;
  }

  render(view: HudViewModel): void {
    this.root.stageValue.textContent = view.stageLabel;
    this.root.throwValue.textContent = view.throwText;
    this.root.successValue.textContent = view.successText;
    this.root.windValue.textContent = view.windText;
    this.root.aimValue.textContent = view.aimText;
    this.root.powerValue.textContent = view.powerText;
    this.root.failureReason.textContent = view.failureReasonText;
    this.root.resultBanner.textContent = view.resultBannerText;
  }
}
