import { describe, expect, it } from 'vitest';
import { createDeskLayout } from '../../src/game/render/deskLayout';

describe('createDeskLayout', () => {
  it('places paper near bottom and bin around mid-screen', () => {
    const viewport = { width: 1280, height: 720 };
    const layout = createDeskLayout(viewport);

    expect(layout.paperAnchor.x).toBeCloseTo(viewport.width * 0.5, 6);
    expect(layout.paperAnchor.y).toBeGreaterThan(viewport.height * 0.75);
    expect(layout.binAnchor.x).toBeCloseTo(viewport.width * 0.5, 6);
    expect(layout.binAnchor.y).toBeGreaterThan(viewport.height * 0.4);
    expect(layout.binAnchor.y).toBeLessThan(viewport.height * 0.65);
  });

  it('places fan anchor in a side-lower zone', () => {
    const viewport = { width: 1280, height: 720 };
    const layout = createDeskLayout(viewport);

    expect(layout.fanAnchor.x).toBeCloseTo(viewport.width * 0.82, 6);
    expect(layout.fanAnchor.y).toBeGreaterThan(viewport.height * 0.68);
    expect(layout.fanAnchor.y).toBeLessThan(viewport.height * 0.9);
  });
});
