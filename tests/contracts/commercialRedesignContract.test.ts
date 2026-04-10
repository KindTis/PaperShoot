import { describe, expect, it } from 'vitest';
import { stage01 } from '../../src/game/stages/stage01';

describe('commercial redesign contract', () => {
  it('uses desk diorama camera and drag-release input', () => {
    expect(stage01.cameraPreset).toBe('desk-diorama-low');
    expect(stage01.inputMode).toBe('drag_release');
    expect(stage01.artTheme).toBe('desk-diorama-paper');
  });
});
