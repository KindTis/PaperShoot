export interface HudRoot {
  element: HTMLDivElement;
  stageValue: HTMLElement;
  throwValue: HTMLElement;
  successValue: HTMLElement;
  windValue: HTMLElement;
  debugStrip: HTMLDivElement;
  actionGroup: HTMLDivElement;
  aimValue: HTMLElement;
  powerValue: HTMLElement;
  failureReason: HTMLElement;
  resultBanner: HTMLElement;
  confirmAimButton: HTMLButtonElement;
  confirmPowerButton: HTMLButtonElement;
  retryButton: HTMLButtonElement;
}

function mustQuery<T extends Element>(root: ParentNode, selector: string): T {
  const node = root.querySelector(selector);
  if (!node) {
    throw new Error(`Missing HUD node: ${selector}`);
  }
  return node as T;
}

export function createHudRoot(doc: Document): HudRoot {
  let root = doc.getElementById('hud-root') as HTMLDivElement | null;
  if (!root) {
    root = doc.createElement('div');
    root.id = 'hud-root';
    doc.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="hud-top">
      <span data-role="stage"></span>
      <span data-role="throws"></span>
      <span data-role="success"></span>
    </div>
    <div class="hud-side">
      <span data-role="wind"></span>
    </div>
    <div class="hud-bottom" data-role="debug-strip" hidden>
      <span data-role="aim"></span>
      <span data-role="power"></span>
      <span data-role="failure"></span>
    </div>
    <div class="hud-actions" data-role="actions" hidden>
      <button type="button" data-role="confirm-aim">Confirm</button>
      <button type="button" data-role="confirm-power">Throw</button>
      <button type="button" data-role="retry">Retry</button>
    </div>
    <div class="hud-result" data-role="result"></div>
  `;

  return {
    element: root,
    stageValue: mustQuery(root, '[data-role="stage"]'),
    throwValue: mustQuery(root, '[data-role="throws"]'),
    successValue: mustQuery(root, '[data-role="success"]'),
    windValue: mustQuery(root, '[data-role="wind"]'),
    debugStrip: mustQuery(root, '[data-role="debug-strip"]'),
    actionGroup: mustQuery(root, '[data-role="actions"]'),
    aimValue: mustQuery(root, '[data-role="aim"]'),
    powerValue: mustQuery(root, '[data-role="power"]'),
    failureReason: mustQuery(root, '[data-role="failure"]'),
    resultBanner: mustQuery(root, '[data-role="result"]'),
    confirmAimButton: mustQuery(root, '[data-role="confirm-aim"]'),
    confirmPowerButton: mustQuery(root, '[data-role="confirm-power"]'),
    retryButton: mustQuery(root, '[data-role="retry"]'),
  };
}
