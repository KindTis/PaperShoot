import type { StageConfig } from '../contracts';

type BaseStageInput = Pick<
  StageConfig,
  'id' | 'order' | 'theme' | 'clear' | 'fan' | 'obstacles' | 'tutorialText' | 'clearConditionText'
>;

export function buildBaseStage(input: BaseStageInput): StageConfig {
  return {
    ...input,
    score: { mode: 'binary_success', successValue: 1, failureValue: 0 },
    retryPolicy: { resetThrowOnly: true, keepWorldTimeOnRetry: true },
    aim: {
      yawMinDeg: -18,
      yawMaxDeg: 18,
      pitchMinDeg: 18,
      pitchMaxDeg: 54,
      defaultYawDeg: 0,
      defaultPitchDeg: 30,
    },
    power: {
      mode: 'ping_pong',
      minPower: 0.25,
      maxPower: 1,
      gaugeSpeed: 1.5,
      startPower: 0.55,
    },
    paper: { spawn: { x: 0, y: 1.45, z: 0.65 }, radius: 0.11 },
    physics: {
      fixedDtSec: 1 / 60,
      gravityY: -22,
      linearDrag: 1.35,
      maxFallSpeed: -18,
      obstacleRestitution: 0.22,
      rimRestitution: 0.34,
      tangentialDamping: 0.84,
      minSeparationSpeed: 2.4,
      maxFlightTimeMs: 4000,
    },
    bin: {
      position: { x: 0.2, y: 0.85, z: 8.8 },
      openingWidth: 0.9,
      openingHeight: 1.05,
      innerDepth: 0.9,
      depthTolerance: 0.35,
      rimThickness: 0.08,
      entryAssistRadius: 0.18,
      entrySpeedMin: 2,
      entrySpeedMax: 11.5,
      settleTimeMs: 120,
    },
    assists: { showGuideArc: true, showFailureReason: true, showAimReticle: true },
    cameraPreset: 'semi-fps-default',
  };
}
