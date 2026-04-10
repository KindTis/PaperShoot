import { describe, expect, it } from 'vitest';
import type { FailureReason, ThrowPhase } from '../../src/game/contracts';

describe('contracts', () => {
  it('defines the planned throw phases and failure reasons', () => {
    const phases: ThrowPhase[] = ['aim', 'power', 'flying', 'resolved'];
    const reasons: FailureReason[] = [
      'rim_reject',
      'obstacle_block',
      'wind_push',
      'power_low',
      'power_high',
      'ground_hit',
      'out_of_bounds',
      'time_expired',
      null,
    ];

    expect(phases).toHaveLength(4);
    expect(reasons).toContain(null);
    expect(reasons).toContain('rim_reject');
  });
});
