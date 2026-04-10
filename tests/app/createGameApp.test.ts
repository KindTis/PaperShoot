import { describe, expect, it } from 'vitest';
import { getAppConfig } from '../../src/app/createGameApp';

describe('getAppConfig', () => {
  it('uses app and hud roots together', () => {
    expect(getAppConfig()).toEqual({
      parentId: 'app',
      hudRootId: 'hud-root',
      sceneKeys: ['BootScene', 'StageScene'],
    });
  });
});
