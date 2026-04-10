import { updateBinState } from '../collision/binStateMachine';
import { selectFailureReason } from '../scoring/selectFailureReason';
import type { FailureReason, StageConfig, Vec3 } from '../contracts';
import type { DragLaunchPayload } from '../input/DragThrowController';
import { ThrowInputController } from '../input/ThrowInputController';
import { getObstacleWorldPose } from '../obstacles/getObstacleWorldPose';
import { advanceThrowStep } from '../simulation/advanceThrowStep';
import { applyWindZone } from '../simulation/applyWindZone';
import { createLaunchVector } from '../simulation/createLaunchVector';
import type { ResultOverlay, RuntimeSnapshot, ShellEvent, ThrowBody } from './runtimeTypes';

const OVERLAY_DURATION_MS = 300;
const LATERAL_BOUNDS_X = 6;
const FAR_BOUNDS_Z = 18;

function cloneVec3(vec: Vec3): Vec3 {
  return { x: vec.x, y: vec.y, z: vec.z };
}

function magnitude(vec: Vec3): number {
  return Math.hypot(vec.x, vec.y, vec.z);
}

function overlapsObstacle(position: Vec3, radius: number, center: Vec3, size: Vec3): boolean {
  const halfX = size.x * 0.5;
  const halfY = size.y * 0.5;
  const halfZ = size.z * 0.5;
  const closestX = Math.max(center.x - halfX, Math.min(position.x, center.x + halfX));
  const closestY = Math.max(center.y - halfY, Math.min(position.y, center.y + halfY));
  const closestZ = Math.max(center.z - halfZ, Math.min(position.z, center.z + halfZ));
  const dx = position.x - closestX;
  const dy = position.y - closestY;
  const dz = position.z - closestZ;
  return dx * dx + dy * dy + dz * dz <= radius * radius;
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
      const previousPosition = cloneVec3(this.activeBody.position);
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

      const nextBody: ThrowBody = {
        ...this.activeBody,
        velocity: stepped.velocity,
        position: {
          x: this.activeBody.position.x + stepped.velocity.x * dtSec,
          y: this.activeBody.position.y + stepped.velocity.y * dtSec,
          z: this.activeBody.position.z + stepped.velocity.z * dtSec,
        },
        elapsedMs: this.activeBody.elapsedMs + deltaMs,
      };

      this.activeBody = nextBody;
      this.evaluateThrowState(previousPosition, deltaMs);

      if (
        this.activeBody &&
        this.activeBody.elapsedMs >= this.stage.physics.maxFlightTimeMs &&
        this.stageStatus === 'playing'
      ) {
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
      insideBinMs: 0,
    };
  }

  releaseDragThrow(launch: DragLaunchPayload | null): void {
    if (!launch || this.stageStatus !== 'playing') {
      return;
    }

    const actualPower =
      this.stage.power.minPower + (this.stage.power.maxPower - this.stage.power.minPower) * launch.power01;
    const launchVector = createLaunchVector({
      yawDeg: launch.yawDeg,
      pitchDeg: launch.pitchDeg,
      power: actualPower,
      minPower: this.stage.power.minPower,
      maxPower: this.stage.power.maxPower,
    });

    this.throwIndex += 1;
    this.activeBody = {
      position: cloneVec3(this.stage.paper.spawn),
      velocity: launchVector,
      elapsedMs: 0,
      binState: 'Outside',
      insideBinMs: 0,
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

  private evaluateThrowState(previousPosition: Vec3, deltaMs: number): void {
    if (!this.activeBody || this.stageStatus !== 'playing') {
      return;
    }

    const currentBody = this.activeBody;
    const currentPosition = currentBody.position;
    const speed = magnitude(currentBody.velocity);
    const verticalOffset = Math.abs(currentPosition.y - this.stage.bin.position.y);
    const horizontalOffset = Math.abs(currentPosition.x - this.stage.bin.position.x);
    const withinOpeningHeight = verticalOffset <= this.stage.bin.openingHeight * 0.5;
    const crossedOpeningPlaneDownward =
      previousPosition.z < this.stage.bin.position.z && currentPosition.z >= this.stage.bin.position.z;
    const enteredInnerVolume =
      currentPosition.z >= this.stage.bin.position.z &&
      currentPosition.z <= this.stage.bin.position.z + this.stage.bin.innerDepth &&
      horizontalOffset <= this.stage.bin.openingWidth * 0.5 &&
      withinOpeningHeight;
    const insideBinMs = enteredInnerVolume ? currentBody.insideBinMs + deltaMs : 0;

    const binResult = updateBinState({
      currentState: currentBody.binState,
      crossedOpeningPlaneDownward: crossedOpeningPlaneDownward && withinOpeningHeight,
      horizontalOffset,
      openingWidth: this.stage.bin.openingWidth,
      speed,
      entrySpeedMin: this.stage.bin.entrySpeedMin,
      entrySpeedMax: this.stage.bin.entrySpeedMax,
      desiredInwardOffset: Math.max(0, horizontalOffset - this.stage.bin.openingWidth * 0.5),
      entryAssistRadius: this.stage.bin.entryAssistRadius,
      enteredInnerVolume,
      insideTimeMs: insideBinMs,
      settleTimeMs: this.stage.bin.settleTimeMs,
      depthBelowOpening: Math.max(0, currentPosition.z - this.stage.bin.position.z),
      depthTolerance: this.stage.bin.depthTolerance,
      insideFloor: enteredInnerVolume && currentPosition.y <= this.stage.paper.radius,
    });

    this.activeBody = {
      ...currentBody,
      binState: binResult.state,
      insideBinMs,
    };

    if (binResult.state === 'SuccessLatched') {
      this.applyThrowResolution({ success: true, failureReason: null });
      return;
    }

    if (this.hitObstacle(currentPosition)) {
      this.applyThrowResolution({
        success: false,
        failureReason: selectFailureReason({
          rimRejected: false,
          hitObstacle: true,
          leftByWind: false,
          launchWasTooWeak: false,
          launchWasTooStrong: false,
          hitGround: false,
        }),
      });
      return;
    }

    if (crossedOpeningPlaneDownward && (!withinOpeningHeight || binResult.state === 'RimContact')) {
      this.applyThrowResolution({
        success: false,
        failureReason: selectFailureReason({
          rimRejected: withinOpeningHeight,
          hitObstacle: false,
          leftByWind: false,
          launchWasTooWeak: speed < this.stage.bin.entrySpeedMin,
          launchWasTooStrong: speed > this.stage.bin.entrySpeedMax,
          hitGround: false,
        }),
      });
      return;
    }

    if (!binResult.suppressWorldFloorFailure && currentPosition.y <= this.stage.paper.radius) {
      this.applyThrowResolution({
        success: false,
        failureReason: selectFailureReason({
          rimRejected: false,
          hitObstacle: false,
          leftByWind: false,
          launchWasTooWeak: false,
          launchWasTooStrong: false,
          hitGround: true,
        }),
      });
      return;
    }

    if (Math.abs(currentPosition.x) > LATERAL_BOUNDS_X) {
      this.applyThrowResolution({
        success: false,
        failureReason: selectFailureReason({
          rimRejected: false,
          hitObstacle: false,
          leftByWind: this.stage.fan.enabled,
          launchWasTooWeak: false,
          launchWasTooStrong: false,
          hitGround: false,
        }) ?? 'out_of_bounds',
      });
      return;
    }

    if (currentPosition.z > FAR_BOUNDS_Z) {
      this.applyThrowResolution({
        success: false,
        failureReason: this.stage.fan.enabled ? 'wind_push' : 'out_of_bounds',
      });
    }
  }

  private hitObstacle(position: Vec3): boolean {
    return this.stage.obstacles.some((obstacle) => {
      const obstaclePosition = getObstacleWorldPose({
        basePosition: obstacle.position,
        motion: obstacle.motion,
        worldTimeMs: this.worldTimeMs,
      });
      return overlapsObstacle(position, this.stage.paper.radius, obstaclePosition, obstacle.size);
    });
  }
}
