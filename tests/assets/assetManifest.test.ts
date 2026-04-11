import { describe, expect, it } from 'vitest';
import { assetManifest } from '../../src/game/assets/assetManifest';
import { queueStageArt, resolveAssetUrl } from '../../src/game/assets/loadStageArt';

const rasterPathPattern = /\.(?:png|webp)$/i;

describe('assetManifest', () => {
  it('uses raster stage art paths grouped by category', () => {
    expect(assetManifest.background.backplate.path).toBe('assets/papershoot/background/office-backplate-main.webp');
    expect(assetManifest.bin.main.path).toBe('assets/papershoot/bin/trash-bin-main.png');
    expect(assetManifest.obstacles.movingCart.path).toBe('assets/papershoot/obstacles/obstacle-moving-cart.png');
    expect(assetManifest.fx.successBurst.path).toBe('assets/papershoot/fx/success-burst.png');

    const paths = [
      assetManifest.background.backplate.path,
      assetManifest.paper.idle.path,
      assetManifest.bin.main.path,
      assetManifest.fan.main.path,
      assetManifest.props.cup.path,
      assetManifest.props.pencilCup.path,
      assetManifest.obstacles.centerBlock.path,
      assetManifest.obstacles.dualBlockLeft.path,
      assetManifest.obstacles.dualBlockRight.path,
      assetManifest.obstacles.movingCart.path,
      assetManifest.obstacles.swingPanel.path,
      assetManifest.obstacles.narrowGate.path,
      assetManifest.fx.successBurst.path,
    ];

    expect(paths.every((path) => !path.startsWith('/'))).toBe(true);
    expect(paths.every((path) => rasterPathPattern.test(path))).toBe(true);
  });

  it('resolves raster asset url against base url for subpath deployment', () => {
    expect(resolveAssetUrl('assets/papershoot/bin/trash-bin-main.png', '/PaperShoot/')).toBe(
      '/PaperShoot/assets/papershoot/bin/trash-bin-main.png',
    );
    expect(resolveAssetUrl('assets/papershoot/bin/trash-bin-main.png', '/')).toBe(
      '/assets/papershoot/bin/trash-bin-main.png',
    );
  });

  it('queues all raster stage art via loader.image()', () => {
    const imageCalls: Array<{ key: string; path: string }> = [];
    const svgCalls: Array<{ key: string; path: string }> = [];
    const loader = {
      image(key: string, path: string) {
        imageCalls.push({ key, path });
      },
      svg(key: string, path: string) {
        svgCalls.push({ key, path });
      },
    };

    queueStageArt(loader as never, '/PaperShoot/');

    expect(imageCalls).toEqual([
      {
        key: 'office-backplate-main',
        path: '/PaperShoot/assets/papershoot/background/office-backplate-main.webp',
      },
      {
        key: 'paper-ball',
        path: '/PaperShoot/assets/papershoot/paper/paper-ball-main.png',
      },
      {
        key: 'trash-bin-main',
        path: '/PaperShoot/assets/papershoot/bin/trash-bin-main.png',
      },
      {
        key: 'desk-fan-main',
        path: '/PaperShoot/assets/papershoot/fan/desk-fan-main.png',
      },
      {
        key: 'cup-main',
        path: '/PaperShoot/assets/papershoot/props/cup-main.png',
      },
      {
        key: 'pencil-cup-main',
        path: '/PaperShoot/assets/papershoot/props/pencil-cup-main.png',
      },
      {
        key: 'obstacle-center-block',
        path: '/PaperShoot/assets/papershoot/obstacles/obstacle-center-block.png',
      },
      {
        key: 'obstacle-dual-block-left',
        path: '/PaperShoot/assets/papershoot/obstacles/obstacle-dual-block-left.png',
      },
      {
        key: 'obstacle-dual-block-right',
        path: '/PaperShoot/assets/papershoot/obstacles/obstacle-dual-block-right.png',
      },
      {
        key: 'obstacle-moving-cart',
        path: '/PaperShoot/assets/papershoot/obstacles/obstacle-moving-cart.png',
      },
      {
        key: 'obstacle-swing-panel',
        path: '/PaperShoot/assets/papershoot/obstacles/obstacle-swing-panel.png',
      },
      {
        key: 'obstacle-narrow-gate',
        path: '/PaperShoot/assets/papershoot/obstacles/obstacle-narrow-gate.png',
      },
      {
        key: 'success-burst',
        path: '/PaperShoot/assets/papershoot/fx/success-burst.png',
      },
    ]);
    expect(svgCalls).toEqual([]);
  });
});
