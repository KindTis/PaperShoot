import { describe, expect, it } from 'vitest';
import { createHudRoot } from '../../src/game/hud/createHudRoot';
import { HudPresenter } from '../../src/game/hud/HudPresenter';

describe('HudPresenter', () => {
  it('creates all required hud slots and touch buttons', () => {
    const root = createHudRoot(document);

    expect(root.stageValue).toBeInstanceOf(HTMLElement);
    expect(root.throwValue).toBeInstanceOf(HTMLElement);
    expect(root.successValue).toBeInstanceOf(HTMLElement);
    expect(root.windValue).toBeInstanceOf(HTMLElement);
    expect(root.aimValue).toBeInstanceOf(HTMLElement);
    expect(root.powerValue).toBeInstanceOf(HTMLElement);
    expect(root.failureReason).toBeInstanceOf(HTMLElement);
    expect(root.resultBanner).toBeInstanceOf(HTMLElement);
    expect(root.confirmAimButton).toBeInstanceOf(HTMLButtonElement);
    expect(root.confirmPowerButton).toBeInstanceOf(HTMLButtonElement);
    expect(root.retryButton).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders hud text into the target nodes', () => {
    const root = createHudRoot(document);
    const presenter = new HudPresenter(root);

    presenter.render({
      stageLabel: 'Stage 3',
      throwText: '2 / 4',
      successText: '0 / 1',
      windText: 'Strong wind / right',
      aimText: 'Yaw +6 / Pitch 32',
      powerText: 'Power 74%',
      failureReasonText: 'Blocked by obstacle',
      resultBannerText: '',
    });

    expect(root.stageValue.textContent).toBe('Stage 3');
    expect(root.throwValue.textContent).toBe('2 / 4');
    expect(root.successValue.textContent).toBe('0 / 1');
    expect(root.windValue.textContent).toContain('Strong wind');
    expect(root.aimValue.textContent).toContain('Yaw +6');
    expect(root.powerValue.textContent).toContain('74%');
    expect(root.failureReason.textContent).toContain('obstacle');
    expect(root.resultBanner.textContent).toBe('');

    presenter.render({
      stageLabel: 'Stage 3',
      throwText: '2 / 4',
      successText: '1 / 1',
      windText: 'Strong wind / right',
      aimText: 'Yaw +4 / Pitch 30',
      powerText: 'Power 68%',
      failureReasonText: '',
      resultBannerText: 'Success',
    });

    expect(root.resultBanner.textContent).toBe('Success');
  });

  it('reuses the existing hud root instead of appending duplicates', () => {
    document.body.innerHTML = '<div id="hud-root"></div>';

    const existing = document.getElementById('hud-root');
    const root = createHudRoot(document);

    expect(root.element).toBe(existing);
    expect(document.querySelectorAll('#hud-root')).toHaveLength(1);
    expect(root.element.querySelector('[data-role="confirm-aim"]')).toBeInstanceOf(HTMLButtonElement);
  });
});
