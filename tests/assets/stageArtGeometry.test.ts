import { describe, expect, it } from 'vitest';
import { stageArtGeometry } from '../../src/game/assets/stageArtGeometry';

describe('stageArtGeometry', () => {
  it('defines fixed bin geometry contract', () => {
    expect(stageArtGeometry.bin.anchor).toBe('bottom-center');
    expect(stageArtGeometry.bin.entryWindow.widthRatio).toBe(0.74);
    expect(stageArtGeometry.bin.entryWindow.heightRatio).toBe(0.18);
  });

  it('defines obstacle anchor contracts', () => {
    expect(stageArtGeometry.obstacles.centerBlock.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.dualBlockLeft.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.dualBlockRight.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.movingCart.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.narrowGate.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.swingPanel.anchor).toBe('top-center');
  });
});
