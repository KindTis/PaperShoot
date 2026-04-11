import { describe, expect, it } from 'vitest';
import { createHudRoot } from '../../src/game/hud/createHudRoot';
import { HudPresenter } from '../../src/game/hud/HudPresenter';
import type { HudViewModel } from '../../src/game/hud/HudPresenter';

describe('HudPresenter commercial mode', () => {
  it('creates a hidden debug strip and renders only compact stage data by default', () => {
    const root = createHudRoot(document);
    const presenter = new HudPresenter(root);

    presenter.render({
      stageLabel: 'Stage 1',
      throwText: '1 / 3',
      successText: '0 / 1',
      windText: 'weak wind',
      aimText: '',
      powerText: '',
      failureReasonText: '',
      resultBannerText: '약한 바람에서 기본 투척 감각을 익힌다.',
    });

    expect(root.debugStrip.hidden).toBe(true);
    expect(root.stageValue.textContent).toBe('Stage 1');
    expect(root.throwValue.textContent).toBe('1 / 3');
    expect(root.successValue.textContent).toBe('0 / 1');
    expect(root.windValue.textContent).toBe('weak wind');
    expect(root.aimValue.textContent).toBe('');
    expect(root.powerValue.textContent).toBe('');
    expect(root.failureReason.textContent).toBe('');
    expect(root.resultBanner.textContent).toContain('약한 바람');
  });

  it('shows a retry action when the result banner enters a game over state', () => {
    const root = createHudRoot(document);
    const presenter = new HudPresenter(root);

    presenter.render({
      stageLabel: 'Stage 1',
      throwText: '0 throws left',
      successText: '0 / 1',
      windText: '→ weak 1.2',
      aimText: '',
      powerText: '',
      failureReasonText: 'ground_hit',
      resultBannerText: 'Game Over',
      primaryActionText: 'Retry',
      primaryActionVisible: true,
    } as HudViewModel & { primaryActionText: string; primaryActionVisible: boolean });

    expect(root.resultBanner.textContent).toBe('Game Over');
    expect(root.retryButton.parentElement?.hidden).toBe(false);
  });
});
