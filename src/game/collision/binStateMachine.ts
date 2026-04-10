export type BinState = 'Outside' | 'RimContact' | 'EntryCandidate' | 'SuccessLatched';

export interface BinStateInput {
  currentState: BinState;
  crossedOpeningPlaneDownward: boolean;
  horizontalOffset: number;
  openingWidth: number;
  speed: number;
  entrySpeedMin: number;
  entrySpeedMax: number;
  desiredInwardOffset: number;
  entryAssistRadius: number;
  enteredInnerVolume: boolean;
  insideTimeMs: number;
  settleTimeMs: number;
  depthBelowOpening: number;
  depthTolerance: number;
  insideFloor: boolean;
}

export interface BinStateResult {
  state: BinState;
  suppressWorldFloorFailure: boolean;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const updateBinState = (input: BinStateInput): BinStateResult => {
  if (
    input.enteredInnerVolume &&
    (input.insideTimeMs >= input.settleTimeMs || input.depthBelowOpening >= input.depthTolerance)
  ) {
    return { state: 'SuccessLatched', suppressWorldFloorFailure: true };
  }

  const allowAssist = input.currentState === 'RimContact' || input.currentState === 'EntryCandidate';
  const inwardAssistOffset = allowAssist ? clamp(input.desiredInwardOffset, 0, input.entryAssistRadius) : 0;

  const assistedHorizontalOffset = Math.max(0, input.horizontalOffset - inwardAssistOffset);
  const withinOpening = assistedHorizontalOffset <= input.openingWidth / 2;
  const withinSpeed = input.speed >= input.entrySpeedMin && input.speed <= input.entrySpeedMax;

  if (input.crossedOpeningPlaneDownward && withinOpening && withinSpeed) {
    return { state: 'EntryCandidate', suppressWorldFloorFailure: false };
  }

  if (input.crossedOpeningPlaneDownward && (!withinOpening || !withinSpeed)) {
    return { state: 'RimContact', suppressWorldFloorFailure: false };
  }

  const insideState =
    input.currentState === 'SuccessLatched' || input.currentState === 'EntryCandidate' || input.enteredInnerVolume;

  if (input.insideFloor && insideState) {
    return { state: input.currentState, suppressWorldFloorFailure: true };
  }

  return {
    state: input.currentState,
    suppressWorldFloorFailure: input.currentState === 'SuccessLatched',
  };
};
