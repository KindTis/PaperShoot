import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assetManifest, stageArtAssets } from '../../src/game/assets/assetManifest';
import { queueStageArt, resolveAssetUrl } from '../../src/game/assets/loadStageArt';

const rasterPathPattern = /\.(?:png|webp)$/i;
const projectRootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function getManifestRasterPaths(): string[] {
  return stageArtAssets.map((asset) => asset.path);
}

describe('assetManifest', () => {
  it('uses raster stage art paths grouped by category', () => {
    expect(assetManifest.background.backplate.path).toBe('assets/papershoot/background/office-backplate-main.webp');

    expect(assetManifest.background.foregroundDeskEdge.path).toBe(
      'assets/papershoot/background/office-foreground-desk-edge.png',
    );

    expect(assetManifest.paper.idle.path).toBe('assets/papershoot/paper/paper-ball-main.png');
    expect(assetManifest.bin.main.path).toBe('assets/papershoot/bin/trash-bin-main.png');
    expect(assetManifest.fan.main.path).toBe('assets/papershoot/fan/desk-fan-main.png');
    expect(assetManifest.props.cup.path).toBe('assets/papershoot/props/coffee-cup.png');
    expect(assetManifest.props.pencilCup.path).toBe('assets/papershoot/props/pencil-holder.png');

    expect(assetManifest.obstacles.movingCart.path).toBe('assets/papershoot/obstacles/obstacle-moving-cart.png');
    expect(assetManifest.fx.windStreak.path).toBe('assets/papershoot/fx/wind-streak.png');
    expect(assetManifest.fx.rimHitFlash.path).toBe('assets/papershoot/fx/rim-hit-flash.png');
    expect(assetManifest.fx.successBurst.path).toBe('assets/papershoot/fx/success-burst.png');

    const paths = getManifestRasterPaths();

    expect(paths.every((path) => !path.startsWith('/'))).toBe(true);
    expect(paths.every((path) => rasterPathPattern.test(path))).toBe(true);
  });

  it('references raster files that exist under public/assets', () => {
    const missingFiles = getManifestRasterPaths().filter(
      (assetPath) => !existsSync(path.resolve(projectRootPath, 'public', assetPath)),
    );

    expect(missingFiles).toEqual([]);
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

    expect(imageCalls).toEqual(
      stageArtAssets.map((asset) => ({
        key: asset.key,
        path: resolveAssetUrl(asset.path, '/PaperShoot/'),
      })),
    );
    expect(svgCalls).toEqual([]);
  });

  it('keeps trash bin entry-window generation constants aligned with geometry contract', () => {
    const scriptPath = path.resolve(projectRootPath, 'scripts/generate_office_raster_assets.py');
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('BIN_ENTRY_WINDOW_WIDTH_RATIO = 0.74');
    expect(script).toContain('BIN_ENTRY_WINDOW_HEIGHT_RATIO = 0.18');
    expect(script).toContain('BIN_ENTRY_WINDOW_OFFSET_Y_RATIO = -0.32');
    expect(script).toContain('BIN_ENTRY_WINDOW_CENTER_X_RATIO = 0.5');
  });
});
