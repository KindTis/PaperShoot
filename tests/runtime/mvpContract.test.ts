import { describe, expect, it } from 'vitest';
import { stageCatalog } from '../../src/game/stages/stageCatalog';

describe('PaperShoot MVP contract', () => {
  it('keeps six stages with persistent world-time retry and binary scoring', () => {
    expect(stageCatalog).toHaveLength(6);
    expect(stageCatalog.every((stage) => stage.retryPolicy.keepWorldTimeOnRetry)).toBe(true);
    expect(stageCatalog.every((stage) => stage.score.mode === 'binary_success')).toBe(true);
  });
});
