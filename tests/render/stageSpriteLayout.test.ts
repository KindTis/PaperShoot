import { describe, expect, it } from 'vitest';
import { stageArtGeometry } from '../../src/game/assets/stageArtGeometry';
import {
  createBinEntryWindowRect,
  createBinSpriteLayout,
  createObstacleSpriteLayout,
  resolveAnchorOrigin,
  resolveObstacleAssetKey,
} from '../../src/game/render/stageSpriteLayout';

describe('stageSpriteLayout', () => {
  it('maps geometry anchors to sprite origins', () => {
    expect(resolveAnchorOrigin('center')).toEqual({ originX: 0.5, originY: 0.5 });
    expect(resolveAnchorOrigin('top-center')).toEqual({ originX: 0.5, originY: 0 });
    expect(resolveAnchorOrigin('bottom-center')).toEqual({ originX: 0.5, originY: 1 });
  });

  it('maps authored obstacle ids to authored obstacle raster keys', () => {
    expect(resolveObstacleAssetKey('block-center')).toBe('obstacle-center-block');
    expect(resolveObstacleAssetKey('block-left')).toBe('obstacle-dual-block-left');
    expect(resolveObstacleAssetKey('block-right')).toBe('obstacle-dual-block-right');
    expect(resolveObstacleAssetKey('moving-slab')).toBe('obstacle-moving-cart');
    expect(resolveObstacleAssetKey('moving-panel')).toBe('obstacle-swing-panel');
    expect(resolveObstacleAssetKey('gate-final')).toBe('obstacle-narrow-gate');
    expect(resolveObstacleAssetKey('unknown')).toBeNull();
  });

  it('calculates bin sprite size using stageArtGeometry and preserves anchor origin', () => {
    const layout = createBinSpriteLayout({
      screenX: 460,
      screenY: 530,
      projectedScale: 0.8,
      openingWidth: stageArtGeometry.bin.worldSize.x,
    });

    expect(layout.x).toBe(460);
    expect(layout.y).toBe(530);
    expect(layout.width).toBeCloseTo(stageArtGeometry.bin.expectedScreenSize.width * 0.8, 6);
    expect(layout.height).toBeCloseTo(stageArtGeometry.bin.expectedScreenSize.height * 0.8, 6);
    expect(layout.originX).toBe(0.5);
    expect(layout.originY).toBe(1);
  });

  it('calculates obstacle sprite layout from obstacle geometry and stage obstacle size', () => {
    const layout = createObstacleSpriteLayout({
      obstacleId: 'moving-panel',
      screenX: 640,
      screenY: 320,
      projectedScale: 1,
      obstacleSize: { x: 0.7, y: 1.0, z: 0.35 },
    });

    expect(layout).not.toBeNull();
    expect(layout?.width).toBeCloseTo(stageArtGeometry.obstacles.swingPanel.expectedScreenSize.width, 6);
    expect(layout?.height).toBeCloseTo(stageArtGeometry.obstacles.swingPanel.expectedScreenSize.height, 6);
    expect(layout?.originX).toBe(0.5);
    expect(layout?.originY).toBe(0);
  });

  it('computes bin entry window center Y from anchor Y plus geometry offset ratio', () => {
    const binLayout = createBinSpriteLayout({
      screenX: 500,
      screenY: 420,
      projectedScale: 1,
      openingWidth: stageArtGeometry.bin.worldSize.x,
    });
    const entry = createBinEntryWindowRect({
      binLayout,
      minHeight: 0,
    });
    const entryCenterY = entry.y + entry.height * 0.5;

    expect(entryCenterY).toBeCloseTo(binLayout.y + binLayout.height * stageArtGeometry.bin.entryWindow.offsetYRatio, 6);
  });
});
