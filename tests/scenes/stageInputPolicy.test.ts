import { describe, expect, it } from 'vitest';
import {
  shouldBeginLaunchDrag,
  shouldConfirmFromPointerDown,
  shouldResetForNewDrag,
} from '../../src/game/scenes/stageInputPolicy';

describe('shouldConfirmFromPointerDown', () => {
  it('allows primary mouse clicks', () => {
    expect(
      shouldConfirmFromPointerDown({
        button: 0,
        event: { pointerType: 'mouse', type: 'pointerdown' } as PointerEvent,
      }),
    ).toBe(true);
  });

  it('blocks touch pointer confirmation so mobile uses explicit buttons', () => {
    expect(
      shouldConfirmFromPointerDown({
        button: 0,
        event: { pointerType: 'touch', type: 'pointerdown' } as PointerEvent,
      }),
    ).toBe(false);
  });

  it('blocks non-primary clicks', () => {
    expect(
      shouldConfirmFromPointerDown({
        button: 2,
        event: { pointerType: 'mouse', type: 'pointerdown' } as PointerEvent,
      }),
    ).toBe(false);
  });
});

describe('shouldBeginLaunchDrag', () => {
  it('allows drags that start near the launch anchor', () => {
    expect(shouldBeginLaunchDrag({ x: 0.52, y: 0.82 })).toBe(true);
  });

  it('rejects drags that start far from the launch anchor', () => {
    expect(shouldBeginLaunchDrag({ x: 0.22, y: 0.36 })).toBe(false);
  });
});

describe('shouldResetForNewDrag', () => {
  it('resets after a failed throw when the stage is still playing', () => {
    expect(
      shouldResetForNewDrag({
        stageStatus: 'playing',
        hasActiveBody: false,
        failureReason: 'ground_hit',
      }),
    ).toBe(true);
  });

  it('does not reset while a throw is still active or the stage is over', () => {
    expect(
      shouldResetForNewDrag({
        stageStatus: 'playing',
        hasActiveBody: true,
        failureReason: 'ground_hit',
      }),
    ).toBe(false);
    expect(
      shouldResetForNewDrag({
        stageStatus: 'failed',
        hasActiveBody: false,
        failureReason: 'ground_hit',
      }),
    ).toBe(false);
  });
});
