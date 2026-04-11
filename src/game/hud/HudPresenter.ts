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
  primaryActionText?: string;
  primaryActionVisible?: boolean;
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
    this.root.confirmAimButton.hidden = true;
    this.root.confirmPowerButton.hidden = true;
    this.root.retryButton.textContent = view.primaryActionText?.trim() || 'Retry';
    this.root.retryButton.hidden = !view.primaryActionVisible;
    this.root.actionGroup.hidden = !view.primaryActionVisible;
    this.root.debugStrip.hidden =
      view.aimText.trim().length === 0 &&
      view.powerText.trim().length === 0 &&
      view.failureReasonText.trim().length === 0;
    this.root.resultBanner.hidden = view.resultBannerText.trim().length === 0;
  }
}
