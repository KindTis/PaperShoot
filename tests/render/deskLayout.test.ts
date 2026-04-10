import { describe, expect, it } from 'vitest';
import { createDeskLayout } from '../../src/game/render/deskLayout';

describe('createDeskLayout', () => {
  it('places paper near bottom and bin around mid-screen', () => {
    const viewport = { width: 1280, height: 720 };
    const layout = createDeskLayout(viewport);

    expect(layout.paperAnchor.y).toBeGreaterThan(viewport.height * 0.75);
    expect(layout.binAnchor.y).toBeGreaterThan(viewport.height * 0.4);
    expect(layout.binAnchor.y).toBeLessThan(viewport.height * 0.65);
  });

  it('places fan anchor in a side-lower zone', () => {
    const viewport = { width: 1280, height: 720 };
    const layout = createDeskLayout(viewport);

    expect(layout.fanAnchor.x).toBeLessThan(viewport.width * 0.35);
    expect(layout.fanAnchor.y).toBeGreaterThan(viewport.height * 0.68);
    expect(layout.fanAnchor.y).toBeLessThan(viewport.height * 0.9);
  });
});
