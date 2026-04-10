import { describe, expect, it } from 'vitest';
import { updateBinState } from '../../src/game/collision/binStateMachine';

const baseInput = {
  currentState: 'Outside' as const,
  crossedOpeningPlaneDownward: false,
  horizontalOffset: 0,
  openingWidth: 1,
  speed: 6,
  entrySpeedMin: 2,
  entrySpeedMax: 10,
  desiredInwardOffset: 0,
  entryAssistRadius: 0.18,
  enteredInnerVolume: false,
  insideTimeMs: 0,
  settleTimeMs: 120,
  depthBelowOpening: 0,
  depthTolerance: 0.35,
  insideFloor: false,
};

describe('updateBinState', () => {
  it('returns RimContact for tooSlow, tooFast, outsideOpening', () => {
    const tooSlow = updateBinState({
      ...baseInput,
      crossedOpeningPlaneDownward: true,
      speed: 1.5,
      horizontalOffset: 0.1,
    });
    const tooFast = updateBinState({
      ...baseInput,
      crossedOpeningPlaneDownward: true,
      speed: 11,
      horizontalOffset: 0.1,
    });
    const outsideOpening = updateBinState({
      ...baseInput,
      crossedOpeningPlaneDownward: true,
      speed: 6,
      horizontalOffset: 0.7,
    });

    expect(tooSlow.state).toBe('RimContact');
    expect(tooFast.state).toBe('RimContact');
    expect(outsideOpening.state).toBe('RimContact');
  });

  it('returns EntryCandidate on valid entry crossing', () => {
    const validEntry = updateBinState({
      ...baseInput,
      crossedOpeningPlaneDownward: true,
      horizontalOffset: 0.49,
      speed: 6,
    });

    expect(validEntry.state).toBe('EntryCandidate');
  });

  it('does not widen opening width with assist and does not use assist to correct speed', () => {
    const assistButOutsideOpening = updateBinState({
      ...baseInput,
      currentState: 'Outside',
      crossedOpeningPlaneDownward: true,
      horizontalOffset: 0.55,
      openingWidth: 1,
      desiredInwardOffset: 0.2,
      entryAssistRadius: 0.2,
      speed: 6,
    });

    const assistCannotFixSlowSpeed = updateBinState({
      ...baseInput,
      currentState: 'RimContact',
      crossedOpeningPlaneDownward: true,
      horizontalOffset: 0.55,
      openingWidth: 1,
      desiredInwardOffset: 0.1,
      entryAssistRadius: 0.2,
      speed: 1.2,
    });

    expect(assistButOutsideOpening.state).not.toBe('EntryCandidate');
    expect(assistCannotFixSlowSpeed.state).toBe('RimContact');
  });

  it('applies x-only assist for RimContact/EntryCandidate and allows valid candidate', () => {
    const assistedEntry = updateBinState({
      ...baseInput,
      currentState: 'RimContact',
      crossedOpeningPlaneDownward: true,
      horizontalOffset: 0.58,
      openingWidth: 1,
      desiredInwardOffset: 0.08,
      entryAssistRadius: 0.2,
      speed: 6,
    });

    expect(assistedEntry.state).toBe('EntryCandidate');
  });

  it('latches success on insideDepth and suppresses world floor failure on insideFloor', () => {
    const insideDepth = updateBinState({
      ...baseInput,
      currentState: 'EntryCandidate',
      enteredInnerVolume: true,
      depthBelowOpening: 0.4,
      depthTolerance: 0.35,
    });

    const insideFloor = updateBinState({
      ...baseInput,
      currentState: 'SuccessLatched',
      insideFloor: true,
    });

    expect(insideDepth.state).toBe('SuccessLatched');
    expect(insideFloor.suppressWorldFloorFailure).toBe(true);
  });
});
