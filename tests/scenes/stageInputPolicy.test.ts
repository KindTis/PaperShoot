import { describe, expect, it } from 'vitest';
import { shouldConfirmFromPointerDown } from '../../src/game/scenes/stageInputPolicy';

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
