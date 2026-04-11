import { describe, expect, it } from 'vitest';
import { resolveStageSelection } from '../../src/game/stages/resolveStageSelection';

describe('resolveStageSelection', () => {
  it('returns default when query is missing', () => {
    expect(resolveStageSelection('', 6)).toEqual({ order: 1, source: 'default' });
    expect(resolveStageSelection('?', 6)).toEqual({ order: 1, source: 'default' });
    expect(resolveStageSelection('?mode=play', 6)).toEqual({ order: 1, source: 'default' });
  });

  it('returns query when stage is valid', () => {
    expect(resolveStageSelection('?stage=1', 6)).toEqual({ order: 1, source: 'query' });
    expect(resolveStageSelection('?stage=6', 6)).toEqual({ order: 6, source: 'query' });
  });

  it('returns fallback when stage is invalid or out of range', () => {
    expect(resolveStageSelection('?stage=0', 6)).toEqual({ order: 1, source: 'fallback' });
    expect(resolveStageSelection('?stage=7', 6)).toEqual({ order: 1, source: 'fallback' });
    expect(resolveStageSelection('?stage=foo', 6)).toEqual({ order: 1, source: 'fallback' });
    expect(resolveStageSelection('?stage=1.5', 6)).toEqual({ order: 1, source: 'fallback' });
    expect(resolveStageSelection('?stage=', 6)).toEqual({ order: 1, source: 'fallback' });
  });
});
