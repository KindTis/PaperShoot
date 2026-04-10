import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { assetManifest } from '../../src/game/assets/assetManifest';
import { queueStageArt, resolveAssetUrl } from '../../src/game/assets/loadStageArt';

describe('assetManifest', () => {
  it('maps commercial placeholder art with stable named keys and relative paths', () => {
    expect(assetManifest.paper.idle.path).toBe('assets/papershoot/paper/paper-ball.svg');
    expect(assetManifest.bin.main.path).toBe('assets/papershoot/bin/trash-bin.svg');
    expect(assetManifest.fan.main.path).toBe('assets/papershoot/fan/desk-fan.svg');
    expect(assetManifest.props.cup.path).toBe('assets/papershoot/props/cup.svg');
    expect(assetManifest.props.pencilCup.path).toBe('assets/papershoot/props/pencil-cup.svg');

    const paths = [
      assetManifest.paper.idle.path,
      assetManifest.bin.main.path,
      assetManifest.fan.main.path,
      assetManifest.props.cup.path,
      assetManifest.props.pencilCup.path,
    ];
    expect(paths.every((path) => !path.startsWith('/'))).toBe(true);
  });

  it('resolves asset url against base url for subpath deployment', () => {
    expect(resolveAssetUrl('assets/papershoot/paper/paper-ball.svg', '/PaperShoot/')).toBe(
      '/PaperShoot/assets/papershoot/paper/paper-ball.svg',
    );
    expect(resolveAssetUrl('assets/papershoot/paper/paper-ball.svg', '/')).toBe(
      '/assets/papershoot/paper/paper-ball.svg',
    );
  });

  it('queues all commercial placeholder svg keys', () => {
    const calls: Array<{ key: string; path: string; config: { width: number; height: number } }> = [];
    const loader = {
      svg(key: string, path: string, config: { width: number; height: number }) {
        calls.push({ key, path, config });
      },
    };

    queueStageArt(loader as never, '/PaperShoot/');

    expect(calls).toEqual([
      {
        key: 'paper-ball',
        path: '/PaperShoot/assets/papershoot/paper/paper-ball.svg',
        config: { width: 128, height: 128 },
      },
      {
        key: 'trash-bin',
        path: '/PaperShoot/assets/papershoot/bin/trash-bin.svg',
        config: { width: 160, height: 160 },
      },
      {
        key: 'desk-fan',
        path: '/PaperShoot/assets/papershoot/fan/desk-fan.svg',
        config: { width: 180, height: 180 },
      },
      {
        key: 'cup',
        path: '/PaperShoot/assets/papershoot/props/cup.svg',
        config: { width: 120, height: 120 },
      },
      {
        key: 'pencil-cup',
        path: '/PaperShoot/assets/papershoot/props/pencil-cup.svg',
        config: { width: 140, height: 140 },
      },
    ]);
  });

  it('keeps placeholder svgs on transparent backgrounds', () => {
    const opaqueCanvasRects = [
      '<rect width="128" height="128" fill=',
      '<rect width="160" height="160" fill=',
      '<rect width="180" height="180" fill=',
      '<rect width="120" height="120" fill=',
      '<rect width="140" height="140" fill=',
    ];

    const files = [
      'public/assets/papershoot/paper/paper-ball.svg',
      'public/assets/papershoot/bin/trash-bin.svg',
      'public/assets/papershoot/fan/desk-fan.svg',
      'public/assets/papershoot/props/cup.svg',
      'public/assets/papershoot/props/pencil-cup.svg',
    ];

    for (const file of files) {
      const svg = readFileSync(file, 'utf8');
      for (const marker of opaqueCanvasRects) {
        expect(svg.includes(marker)).toBe(false);
      }
    }
  });
});
