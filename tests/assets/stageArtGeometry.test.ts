import { describe, expect, it } from 'vitest';
import { stageArtGeometry } from '../../src/game/assets/stageArtGeometry';

describe('stageArtGeometry', () => {
  it('defines fixed bin geometry contract', () => {
    expect(stageArtGeometry.bin.worldSize).toEqual({ x: 0.9, y: 1.05, z: 0.9 });
    expect(stageArtGeometry.bin.anchor).toBe('bottom-center');
    expect(stageArtGeometry.bin.referenceStage).toBe(1);
    expect(stageArtGeometry.bin.expectedScreenSize).toEqual({ width: 186, height: 228 });
    expect(stageArtGeometry.bin.silhouetteRule).toBe('bin-opening');
    expect(stageArtGeometry.bin.entryWindow.widthRatio).toBe(0.74);
    expect(stageArtGeometry.bin.entryWindow.heightRatio).toBe(0.18);
    expect(stageArtGeometry.bin.entryWindow.offsetYRatio).toBe(-0.32);
  });

  it('defines obstacle geometry sheet contracts', () => {
    expect(stageArtGeometry.obstacles.centerBlock.worldSize).toEqual({ x: 0.8, y: 1.0, z: 0.4 });
    expect(stageArtGeometry.obstacles.centerBlock.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.centerBlock.referenceStage).toBe(3);
    expect(stageArtGeometry.obstacles.centerBlock.expectedScreenSize).toEqual({ width: 142, height: 176 });
    expect(stageArtGeometry.obstacles.centerBlock.silhouetteRule).toBe('tight');

    expect(stageArtGeometry.obstacles.dualBlockLeft.worldSize).toEqual({ x: 0.6, y: 0.95, z: 0.35 });
    expect(stageArtGeometry.obstacles.dualBlockLeft.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.dualBlockLeft.referenceStage).toBe(4);
    expect(stageArtGeometry.obstacles.dualBlockLeft.expectedScreenSize).toEqual({ width: 124, height: 166 });
    expect(stageArtGeometry.obstacles.dualBlockLeft.silhouetteRule).toBe('tight');

    expect(stageArtGeometry.obstacles.dualBlockRight.worldSize).toEqual({ x: 0.7, y: 1.0, z: 0.35 });
    expect(stageArtGeometry.obstacles.dualBlockRight.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.dualBlockRight.referenceStage).toBe(4);
    expect(stageArtGeometry.obstacles.dualBlockRight.expectedScreenSize).toEqual({ width: 130, height: 172 });
    expect(stageArtGeometry.obstacles.dualBlockRight.silhouetteRule).toBe('tight');

    expect(stageArtGeometry.obstacles.movingCart.worldSize).toEqual({ x: 0.9, y: 1.0, z: 0.35 });
    expect(stageArtGeometry.obstacles.movingCart.anchor).toBe('bottom-center');
    expect(stageArtGeometry.obstacles.movingCart.referenceStage).toBe(5);
    expect(stageArtGeometry.obstacles.movingCart.expectedScreenSize).toEqual({ width: 168, height: 168 });
    expect(stageArtGeometry.obstacles.movingCart.silhouetteRule).toBe('tight');

    expect(stageArtGeometry.obstacles.swingPanel.worldSize).toEqual({ x: 0.7, y: 1.0, z: 0.35 });
    expect(stageArtGeometry.obstacles.swingPanel.anchor).toBe('top-center');
    expect(stageArtGeometry.obstacles.swingPanel.referenceStage).toBe(6);
    expect(stageArtGeometry.obstacles.swingPanel.expectedScreenSize).toEqual({ width: 132, height: 176 });
    expect(stageArtGeometry.obstacles.swingPanel.silhouetteRule).toBe('tight');

    expect(stageArtGeometry.obstacles.narrowGate.worldSize).toEqual({ x: 0.55, y: 1.1, z: 0.2 });
    expect(stageArtGeometry.obstacles.narrowGate.anchor).toBe('center');
    expect(stageArtGeometry.obstacles.narrowGate.referenceStage).toBe(6);
    expect(stageArtGeometry.obstacles.narrowGate.expectedScreenSize).toEqual({ width: 110, height: 182 });
    expect(stageArtGeometry.obstacles.narrowGate.silhouetteRule).toBe('gate-opening');
  });
});
