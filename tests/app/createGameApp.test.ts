import { describe, expect, it } from 'vitest';
import { createGameApp, getAppConfig } from '../../src/app/createGameApp';

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
}

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
            FIT: 'FIT',
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

  it('uses the desktop landscape scale profile on widescreen viewports', async () => {
    document.body.innerHTML = '';
    setViewport(1280, 720);
    const createdConfigs: Array<Record<string, unknown>> = [];

    class FakeGame {
      constructor(config: Record<string, unknown>) {
        createdConfigs.push(config);
      }

      destroy(): void {}
    }

    class FakeBootScene {}
    class FakeStageScene {}

    await createGameApp(document, {
      loadPhaser: async () =>
        ({
          AUTO: 'AUTO',
          Scale: {
            RESIZE: 'RESIZE',
            FIT: 'FIT',
            CENTER_BOTH: 'CENTER_BOTH',
          },
          Game: FakeGame,
        }) as never,
      loadScenes: async () => ({
        BootScene: FakeBootScene,
        StageScene: FakeStageScene,
      }),
    });

    expect(createdConfigs).toHaveLength(1);
    expect(createdConfigs[0]).toMatchObject({
      width: 1280,
      height: 720,
      scale: {
        mode: 'RESIZE',
        width: 1280,
        height: 720,
      },
    });
  });

  it('keeps the mobile scale profile on small landscape screens', async () => {
    document.body.innerHTML = '';
    setViewport(667, 375);
    const createdConfigs: Array<Record<string, unknown>> = [];

    class FakeGame {
      constructor(config: Record<string, unknown>) {
        createdConfigs.push(config);
      }

      destroy(): void {}
    }

    class FakeBootScene {}
    class FakeStageScene {}

    await createGameApp(document, {
      loadPhaser: async () =>
        ({
          AUTO: 'AUTO',
          Scale: {
            RESIZE: 'RESIZE',
            FIT: 'FIT',
            CENTER_BOTH: 'CENTER_BOTH',
          },
          Game: FakeGame,
        }) as never,
      loadScenes: async () => ({
        BootScene: FakeBootScene,
        StageScene: FakeStageScene,
      }),
    });

    expect(createdConfigs).toHaveLength(1);
    expect(createdConfigs[0]).toMatchObject({
      width: 540,
      height: 960,
      scale: {
        mode: 'FIT',
        width: 540,
        height: 960,
      },
    });
  });
});
