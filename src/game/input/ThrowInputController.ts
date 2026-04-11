import type { StageConfig, ThrowPhase } from '../contracts';

export interface ThrowInputSnapshot {
  phase: ThrowPhase;
  yawDeg: number;
  pitchDeg: number;
  power: number;
}

type NormalizedPoint = { x: number; y: number };

type PointerInputBinding = {
  onMove: (listener: (input: { normalizedX: number; normalizedY: number }) => void) => void;
  onLeftClick: (listener: () => void) => void;
};

type KeyboardBinding = {
  onKey: (key: string, listener: () => void) => void;
};

type TouchButtons = {
  confirmAimButton: HTMLButtonElement;
  confirmPowerButton: HTMLButtonElement;
  retryButton: HTMLButtonElement;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export class ThrowInputController {
  private readonly config: StageConfig;

  private phase: ThrowPhase = 'aim';
  private yawDeg: number;
  private pitchDeg: number;
  private power: number;
  private powerDirection = 1;

  constructor(config: StageConfig) {
    this.config = config;
    this.yawDeg = config.aim.defaultYawDeg;
    this.pitchDeg = config.aim.defaultPitchDeg;
    this.power = config.power.startPower;
  }

  updateAimFromNormalizedPoint(point: NormalizedPoint): void {
    const normalizedX = clamp(point.x, 0, 1);
    const normalizedY = clamp(point.y, 0, 1);
    this.yawDeg = this.mapRange(normalizedX, this.config.aim.yawMinDeg, this.config.aim.yawMaxDeg);
    this.pitchDeg = this.mapRange(1 - normalizedY, this.config.aim.pitchMinDeg, this.config.aim.pitchMaxDeg);
  }

  tick(deltaMs: number): void {
    if (this.phase !== 'power') {
      return;
    }

    const deltaSeconds = Math.max(0, deltaMs) / 1000;
    const span = this.config.power.maxPower - this.config.power.minPower;
    if (span <= 0) {
      this.power = this.config.power.minPower;
      return;
    }

    this.power += this.powerDirection * this.config.power.gaugeSpeed * deltaSeconds;

    if (this.power >= this.config.power.maxPower) {
      this.power = this.config.power.maxPower;
      this.powerDirection = -1;
    } else if (this.power <= this.config.power.minPower) {
      this.power = this.config.power.minPower;
      this.powerDirection = 1;
    }
  }

  confirmAim(): void {
    if (this.phase === 'aim') {
      this.phase = 'power';
    }
  }

  confirmPower(): void {
    if (this.phase === 'power') {
      this.phase = 'flying';
    }
  }

  resetForRetry(): void {
    this.phase = 'aim';
    this.power = this.config.power.startPower;
    this.powerDirection = 1;
  }

  resetForStageRestart(): void {
    this.resetForRetry();
    this.yawDeg = this.config.aim.defaultYawDeg;
    this.pitchDeg = this.config.aim.defaultPitchDeg;
  }

  getSnapshot(): ThrowInputSnapshot {
    return {
      phase: this.phase,
      yawDeg: this.yawDeg,
      pitchDeg: this.pitchDeg,
      power: this.power,
    };
  }

  bindMouseHandlers(input: PointerInputBinding): void {
    input.onMove(({ normalizedX, normalizedY }) => {
      this.updateAimFromNormalizedPoint({ x: normalizedX, y: normalizedY });
    });
    input.onLeftClick(() => this.confirmByPhase());
  }

  bindKeyboardHandlers(keyboard: KeyboardBinding): void {
    const keyBindings: Array<[string, () => void]> = [
      ['Space', () => this.confirmByPhase()],
      ['R', () => this.resetForRetry()],
      ['ArrowLeft', () => this.nudgeAim(-1, 0)],
      ['ArrowRight', () => this.nudgeAim(1, 0)],
      ['ArrowUp', () => this.nudgeAim(0, 1)],
      ['ArrowDown', () => this.nudgeAim(0, -1)],
      ['A', () => this.nudgeAim(-1, 0)],
      ['D', () => this.nudgeAim(1, 0)],
      ['W', () => this.nudgeAim(0, 1)],
      ['S', () => this.nudgeAim(0, -1)],
    ];

    for (const [key, handler] of keyBindings) {
      keyboard.onKey(key, handler);
    }
  }

  bindTouchButtons(buttons: TouchButtons): void {
    buttons.confirmAimButton.addEventListener('click', () => this.confirmAim());
    buttons.confirmPowerButton.addEventListener('click', () => this.confirmPower());
    buttons.retryButton.addEventListener('click', () => this.resetForRetry());
  }

  private mapRange(value: number, min: number, max: number): number {
    return min + (max - min) * value;
  }

  private confirmByPhase(): void {
    if (this.phase === 'aim') {
      this.confirmAim();
      return;
    }
    if (this.phase === 'power') {
      this.confirmPower();
    }
  }

  private nudgeAim(yawDirection: number, pitchDirection: number): void {
    if (this.phase !== 'aim') {
      return;
    }

    const step = 1;
    this.yawDeg = clamp(this.yawDeg + yawDirection * step, this.config.aim.yawMinDeg, this.config.aim.yawMaxDeg);
    this.pitchDeg = clamp(
      this.pitchDeg + pitchDirection * step,
      this.config.aim.pitchMinDeg,
      this.config.aim.pitchMaxDeg,
    );
  }
}
