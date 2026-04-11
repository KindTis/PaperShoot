export type StageArtAnchor = 'center' | 'top-center' | 'bottom-center';

type RatioRect = Readonly<{
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}>;

type StageObstacleGeometry = Readonly<{
  anchor: StageArtAnchor;
  hitbox: RatioRect;
}>;

export const stageArtGeometry = {
  bin: {
    anchor: 'bottom-center',
    entryWindow: {
      xRatio: 0.5,
      yRatio: 0.79,
      widthRatio: 0.74,
      heightRatio: 0.18,
    },
  },
  obstacles: {
    centerBlock: {
      anchor: 'center',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.62, heightRatio: 0.62 },
    } satisfies StageObstacleGeometry,
    dualBlockLeft: {
      anchor: 'center',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.54, heightRatio: 0.66 },
    } satisfies StageObstacleGeometry,
    dualBlockRight: {
      anchor: 'center',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.54, heightRatio: 0.66 },
    } satisfies StageObstacleGeometry,
    movingCart: {
      anchor: 'center',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.71, heightRatio: 0.44 },
    } satisfies StageObstacleGeometry,
    swingPanel: {
      anchor: 'top-center',
      hitbox: { xRatio: 0.5, yRatio: 0.58, widthRatio: 0.28, heightRatio: 0.84 },
    } satisfies StageObstacleGeometry,
    narrowGate: {
      anchor: 'center',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.29, heightRatio: 0.9 },
    } satisfies StageObstacleGeometry,
  },
} as const;
