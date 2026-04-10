import type { FailureReason, StageConfig, Vec3 } from '../contracts';
import { ThrowInputController } from '../input/ThrowInputController';
import { advanceThrowStep } from '../simulation/advanceThrowStep';
import { applyWindZone } from '../simulation/applyWindZone';
import { createLaunchVector } from '../simulation/createLaunchVector';
import type { ResultOverlay, RuntimeSnapshot, ShellEvent, ThrowBody } from './runtimeTypes';

const OVERLAY_DURATION_MS = 300;

function cloneVec3(vec: Vec3): Vec3 {
  return { x: vec.x, y: vec.y, z: vec.z };
}

export class StageRuntime {
  private readonly stage: StageConfig;
  private readonly input: ThrowInputController;

  private worldTimeMs = 0;
  private throwIndex = 0;
  private remainingThrows: number;
  private successCount = 0;
  private stageStatus: 'playing' | 'cleared' | 'failed' = 'playing';
  private resultOverlay: ResultOverlay = { kind: null, text: '' };
  private failureReason: FailureReason = null;
  private activeBody: ThrowBody | null = null;
  private overlayRemainingMs = 0;
  private pendingShellEvent: ShellEvent | null = null;
  private emitClearEventAfterOverlay = false;

  constructor(stage: StageConfig) {
    this.stage = stage;
    this.input = new ThrowInputController(stage);
    this.remainingThrows = stage.clear.throwLimit;
  }

  tick(deltaMs: number): void {
    this.worldTimeMs += deltaMs;
    this.input.tick(deltaMs);

    if (this.activeBody) {
      const dtSec = Math.max(0, deltaMs) / 1000;
      const wind = applyWindZone({
        bodyPosition: this.activeBody.position,
        fan: this.stage.fan,
      });
      const stepped = advanceThrowStep({
        velocity: this.activeBody.velocity,
        dtSec,
        gravityY: this.stage.physics.gravityY,
        gravityScale: wind.gravityScale,
        windTargetX: wind.windTargetX,
        windResponse: this.stage.fan.windResponse,
        linearDrag: this.stage.physics.linearDrag,
        maxFallSpeed: this.stage.physics.maxFallSpeed,
      });

      this.activeBody = {
        ...this.activeBody,
        velocity: stepped.velocity,
        position: {
          x: this.activeBody.position.x + stepped.velocity.x * dtSec,
          y: this.activeBody.position.y + stepped.velocity.y * dtSec,
          z: this.activeBody.position.z + stepped.velocity.z * dtSec,
        },
        elapsedMs: this.activeBody.elapsedMs + deltaMs,
      };

      if (this.activeBody.elapsedMs >= this.stage.physics.maxFlightTimeMs && this.stageStatus === 'playing') {
        this.applyThrowResolution({ success: false, failureReason: 'time_expired' });
      }
    }

    if (this.overlayRemainingMs > 0) {
      this.overlayRemainingMs = Math.max(0, this.overlayRemainingMs - deltaMs);
      if (this.overlayRemainingMs === 0) {
        this.resultOverlay = { kind: null, text: '' };
        if (this.emitClearEventAfterOverlay) {
          this.pendingShellEvent = {
            type: 'stage_cleared',
            stageId: this.stage.id,
          };
          this.emitClearEventAfterOverlay = false;
        }
      }
    }
  }

  confirmAim(): void {
    this.input.confirmAim();
  }

  bindMouseHandlers(input: {
    onMove: (listener: (input: { normalizedX: number; normalizedY: number }) => void) => void;
    onLeftClick: (listener: () => void) => void;
  }): void {
    this.input.bindMouseHandlers(input);
  }

  bindKeyboardHandlers(keyboard: {
    onKey: (key: string, listener: () => void) => void;
  }): void {
    this.input.bindKeyboardHandlers(keyboard);
  }

  confirmPower(): void {
    const inputSnapshot = this.input.getSnapshot();
    if (inputSnapshot.phase !== 'power' || this.stageStatus !== 'playing') {
      return;
    }

    const launchVector = createLaunchVector({
      yawDeg: inputSnapshot.yawDeg,
      pitchDeg: inputSnapshot.pitchDeg,
      power: inputSnapshot.power,
      minPower: this.stage.power.minPower,
      maxPower: this.stage.power.maxPower,
    });

    this.input.confirmPower();
    this.throwIndex += 1;
    this.activeBody = {
      position: cloneVec3(this.stage.paper.spawn),
      velocity: launchVector,
      elapsedMs: 0,
      binState: 'Outside',
    };
  }

  applyThrowResolution(result: { success: boolean; failureReason: FailureReason }): void {
    if (this.stageStatus !== 'playing' && !result.success) {
      return;
    }

    this.activeBody = null;
    this.failureReason = result.failureReason;
    this.overlayRemainingMs = OVERLAY_DURATION_MS;

    if (result.success) {
      this.successCount += 1;
      this.resultOverlay = { kind: 'success', text: 'Success' };
      if (this.successCount >= this.stage.clear.requiredSuccesses) {
        this.stageStatus = 'cleared';
        this.emitClearEventAfterOverlay = true;
      }
      return;
    }

    this.remainingThrows = Math.max(0, this.remainingThrows - 1);
    this.resultOverlay = { kind: 'failure', text: result.failureReason ?? '' };

    if (this.remainingThrows === 0) {
      this.stageStatus = 'failed';
      this.pendingShellEvent = {
        type: 'stage_failed',
        stageId: this.stage.id,
      };
    }
  }

  retryThrow(): void {
    this.activeBody = null;
    this.failureReason = null;
    this.resultOverlay = { kind: null, text: '' };
    this.overlayRemainingMs = 0;
    this.input.resetForRetry();
  }

  consumeShellEvent(): ShellEvent | null {
    const event = this.pendingShellEvent;
    this.pendingShellEvent = null;
    return event;
  }

  getSnapshot(): RuntimeSnapshot {
    return {
      worldTimeMs: this.worldTimeMs,
      throwIndex: this.throwIndex,
      remainingThrows: this.remainingThrows,
      successCount: this.successCount,
      stageStatus: this.stageStatus,
      resultOverlay: this.resultOverlay,
      failureReason: this.failureReason,
      input: this.input.getSnapshot(),
      activeBody: this.activeBody,
    };
  }
}
