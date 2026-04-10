import { describe, expect, it } from 'vitest';
import { stageCatalog } from '../../src/game/stages/stageCatalog';

describe('full stage catalog', () => {
  it('includes six stages with late-game obstacle variants', () => {
    expect(stageCatalog).toHaveLength(6);
    expect(stageCatalog[4].obstacles[0]?.motion.type).toBe('ping_pong_x');
    expect(stageCatalog[5].obstacles.some((obstacle) => obstacle.kind === 'narrow_gate')).toBe(true);
  });
});
