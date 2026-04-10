import { describe, expect, it } from 'vitest';
import { createGameApp, getAppConfig } from '../../src/app/createGameApp';

describe('getAppConfig', () => {
  it('uses app and hud roots together', () => {
    expect(getAppConfig()).toEqual({
      parentId: 'app',
      hudRootId: 'hud-root',
      sceneKeys: ['BootScene', 'StageScene'],
    });
  });
});

describe('createGameApp', () => {
  it('creates app roots and starts the configured Phaser scenes', async () => {
    document.body.innerHTML = '';
    const createdConfigs: Array<Record<string, unknown>> = [];

    class FakeGame {
      constructor(config: Record<string, unknown>) {
        createdConfigs.push(config);
      }

      destroy(): void {}
    }

    class FakeBootScene {}
    class FakeStageScene {}

    const result = await createGameApp(document, {
      loadPhaser: async () =>
        ({
          AUTO: 'AUTO',
          Scale: {
            RESIZE: 'RESIZE',
            CENTER_BOTH: 'CENTER_BOTH',
          },
          Game: FakeGame,
        }) as never,
      loadScenes: async () => ({
        BootScene: FakeBootScene,
        StageScene: FakeStageScene,
      }),
    });

    expect(document.getElementById('app')).toBe(result.appRoot);
    expect(document.getElementById('hud-root')).toBe(result.hudRoot);
    expect(createdConfigs).toHaveLength(1);
    expect(createdConfigs[0]).toMatchObject({
      type: 'AUTO',
      parent: 'app',
      scene: [FakeBootScene, FakeStageScene],
    });
  });
});
