import { beforeEach, describe, expect, it, vi } from 'vitest';

const queueStageArt = vi.fn();

vi.mock('phaser', () => ({
  default: {
    Scene: class {
      load = {};
      scene = { start: vi.fn() };
    },
  },
}));

vi.mock('../../src/game/assets/loadStageArt', () => ({
  queueStageArt,
}));

describe('BootScene', () => {
  beforeEach(() => {
    queueStageArt.mockReset();
  });

  it('preloads commercial stage art before entering the stage scene', async () => {
    const { BootScene } = await import('../../src/game/scenes/BootScene');
    const scene = new BootScene();
    const load = { svg: vi.fn() };
    const start = vi.fn();

    Object.assign(scene, {
      load,
      scene: { start },
    });

    scene.preload();
    scene.create();

    expect(queueStageArt).toHaveBeenCalledWith(load);
    expect(start).toHaveBeenCalledWith('StageScene');
  });
});
