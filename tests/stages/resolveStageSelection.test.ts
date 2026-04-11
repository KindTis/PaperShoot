import { describe, expect, it } from 'vitest';
import { resolveStageSelection } from '../../src/game/stages/resolveStageSelection';

describe('resolveStageSelection', () => {
  it('returns a fresh object for default and fallback selections', () => {
    const defaultA = resolveStageSelection('', 6);
    const defaultB = resolveStageSelection('', 6);
    expect(defaultA).toEqual({ order: 1, source: 'default' });
    expect(defaultB).toEqual({ order: 1, source: 'default' });
    expect(defaultA).not.toBe(defaultB);

    const fallbackA = resolveStageSelection('?stage=foo', 6);
    const fallbackB = resolveStageSelection('?stage=foo', 6);
    expect(fallbackA).toEqual({ order: 1, source: 'fallback' });
    expect(fallbackB).toEqual({ order: 1, source: 'fallback' });
    expect(fallbackA).not.toBe(fallbackB);
  });

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
    expect(resolveStageSelection('?stage=0x2', 6)).toEqual({ order: 1, source: 'fallback' });
    expect(resolveStageSelection('?stage=1e1', 6)).toEqual({ order: 1, source: 'fallback' });
  });

  it('accepts zero-padded decimal stage query as valid', () => {
    expect(resolveStageSelection('?stage=01', 6)).toEqual({ order: 1, source: 'query' });
  });

  it('returns fallback for any query selection when totalStages is not positive', () => {
    expect(resolveStageSelection('?stage=1', 0)).toEqual({ order: 1, source: 'fallback' });
    expect(resolveStageSelection('?stage=1', -1)).toEqual({ order: 1, source: 'fallback' });
  });

  it('still returns default when query is missing even if totalStages is not positive', () => {
    expect(resolveStageSelection('', 0)).toEqual({ order: 1, source: 'default' });
    expect(resolveStageSelection('?mode=play', -1)).toEqual({ order: 1, source: 'default' });
  });
});
