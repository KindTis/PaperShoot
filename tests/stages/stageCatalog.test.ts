import { describe, expect, it } from 'vitest';
import { stageCatalog } from '../../src/game/stages/stageCatalog';
import { validateStageCatalog } from '../../src/game/stages/stageValidator';

describe('stageCatalog (stage 01-03)', () => {
  it('contains expected tutorial stage ids in order', () => {
    expect(stageCatalog.slice(0, 3).map((stage) => stage.id)).toEqual([
      'stage-01',
      'stage-02',
      'stage-03',
    ]);
  });

  it('uses expected fan strengths and obstacle counts', () => {
    expect(stageCatalog[0].fan.strengthLabel).toBe('weak');
    expect(stageCatalog[1].fan.strengthLabel).toBe('strong');
    expect(stageCatalog[2].obstacles).toHaveLength(1);
  });

  it('passes stage catalog validation for stage 01-03', () => {
    expect(() => validateStageCatalog(stageCatalog.slice(0, 3))).not.toThrow();
  });
});
