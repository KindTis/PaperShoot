import { deskLayoutTheme, type RenderViewport, type ScreenAnchor } from './renderTheme';

export interface DeskLayout {
  paperAnchor: ScreenAnchor;
  binAnchor: ScreenAnchor;
  fanAnchor: ScreenAnchor;
}

export function createDeskLayout(viewport: RenderViewport): DeskLayout {
  return {
    paperAnchor: {
      x: viewport.width * deskLayoutTheme.paperAnchor.xRatio,
      y: viewport.height * deskLayoutTheme.paperAnchor.yRatio,
    },
    binAnchor: {
      x: viewport.width * deskLayoutTheme.binAnchor.xRatio,
      y: viewport.height * deskLayoutTheme.binAnchor.yRatio,
    },
    fanAnchor: {
      x: viewport.width * deskLayoutTheme.fanAnchor.xRatio,
      y: viewport.height * deskLayoutTheme.fanAnchor.yRatio,
    },
  };
}
