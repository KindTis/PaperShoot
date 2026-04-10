export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type ThrowPhase = 'aim' | 'power' | 'flying' | 'resolved';

export type FailureReason =
  | 'rim_reject'
  | 'obstacle_block'
  | 'wind_push'
  | 'power_low'
  | 'power_high'
  | 'ground_hit'
  | 'out_of_bounds'
  | 'time_expired'
  | null;

export interface StageConfig {
  id: string;
  order: number;
  theme: 'room' | 'office' | 'classroom' | 'cafe';
  clear: {
    throwLimit: number;
    requiredSuccesses: number;
  };
  retryPolicy: {
    resetThrowOnly: true;
    keepWorldTimeOnRetry: true;
  };
  aim: {
    yawMinDeg: number;
    yawMaxDeg: number;
    pitchMinDeg: number;
    pitchMaxDeg: number;
    defaultYawDeg: number;
    defaultPitchDeg: number;
  };
  power: {
    mode: 'ping_pong';
    minPower: number;
    maxPower: number;
    gaugeSpeed: number;
    startPower: number;
  };
  paper: {
    spawn: Vec3;
    radius: number;
  };
  physics: {
    fixedDtSec: number;
    gravityY: number;
    linearDrag: number;
    maxFallSpeed: number;
    obstacleRestitution: number;
    rimRestitution: number;
    tangentialDamping: number;
    minSeparationSpeed: number;
    maxFlightTimeMs: number;
  };
  fan: {
    enabled: boolean;
    position: Vec3;
    directionDeg: number;
    strength: number;
    strengthLabel: 'weak' | 'medium' | 'strong';
    targetLateralSpeed: number;
    windResponse: number;
    gravityScaleInZone: number;
    influenceShape: 'box' | 'cone';
    influenceLength: number;
    influenceWidth: number;
    influenceHeight: number;
    feather: number;
    showParticles: boolean;
  };
  obstacles: Array<{
    id: string;
    kind: 'static_block' | 'moving_block' | 'narrow_gate';
    position: Vec3;
    size: Vec3;
    motion: {
      type: 'none' | 'ping_pong_x' | 'ping_pong_y';
      amplitude: number;
      durationMs: number;
      phaseMs: number;
      timeSource: 'world_time';
    };
  }>;
  bin: {
    position: Vec3;
    openingWidth: number;
    openingHeight: number;
    innerDepth: number;
    depthTolerance: number;
    rimThickness: number;
    entryAssistRadius: number;
    entrySpeedMin: number;
    entrySpeedMax: number;
    settleTimeMs: number;
  };
  assists: {
    showGuideArc: boolean;
    showFailureReason: boolean;
    showAimReticle: boolean;
  };
  score: {
    mode: 'binary_success';
    successValue: 1;
    failureValue: 0;
  };
  cameraPreset: 'semi-fps-default';
  tutorialText?: string;
  clearConditionText: string;
}
