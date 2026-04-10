import { describe, expect, it } from 'vitest';
import { assetManifest } from '../../src/game/assets/assetManifest';
import { queueStageArt } from '../../src/game/assets/loadStageArt';

describe('assetManifest', () => {
  it('maps commercial placeholder art paths', () => {
    expect(assetManifest.paper.idle).toBe('/assets/papershoot/paper/paper-ball.svg');
    expect(assetManifest.bin.main).toBe('/assets/papershoot/bin/trash-bin.svg');
    expect(assetManifest.fan.main).toBe('/assets/papershoot/fan/desk-fan.svg');
    expect(assetManifest.props).toEqual([
      '/assets/papershoot/props/cup.svg',
      '/assets/papershoot/props/pencil-cup.svg',
    ]);
  });

  it('queues all commercial placeholder svg keys', () => {
    const calls: Array<{ key: string; path: string }> = [];
    const loader = {
      svg(key: string, path: string) {
        calls.push({ key, path });
      },
    };

    queueStageArt(loader as never);

    expect(calls).toEqual([
      { key: 'paper-ball', path: '/assets/papershoot/paper/paper-ball.svg' },
      { key: 'trash-bin', path: '/assets/papershoot/bin/trash-bin.svg' },
      { key: 'desk-fan', path: '/assets/papershoot/fan/desk-fan.svg' },
      { key: 'cup', path: '/assets/papershoot/props/cup.svg' },
      { key: 'pencil-cup', path: '/assets/papershoot/props/pencil-cup.svg' },
    ]);
  });
});
