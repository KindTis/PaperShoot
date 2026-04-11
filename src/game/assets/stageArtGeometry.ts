import type { Vec3 } from '../contracts';

export type StageArtAnchor = 'center' | 'top-center' | 'bottom-center';
export type StageArtSilhouetteRule = 'tight' | 'bin-opening' | 'gate-opening';

type RatioRect = Readonly<{
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}>;

type StageCollisionShape = Readonly<{
  anchor: StageArtAnchor;
  hitbox: RatioRect;
}>;

type StageArtGeometryEntry = Readonly<{
  worldSize: Vec3;
  anchor: StageArtAnchor;
  referenceStage: number;
  expectedScreenSize: Readonly<{
    width: number;
    height: number;
  }>;
  silhouetteRule: StageArtSilhouetteRule;
}>;

export const stageArtGeometry = {
  bin: {
    worldSize: { x: 0.9, y: 1.05, z: 0.9 },
    anchor: 'bottom-center',
    referenceStage: 1,
    expectedScreenSize: { width: 186, height: 228 },
    silhouetteRule: 'bin-opening',
    entryWindow: {
      widthRatio: 0.74,
      heightRatio: 0.18,
      offsetYRatio: -0.32,
    },
  } satisfies StageArtGeometryEntry & {
    entryWindow: Readonly<{
      widthRatio: number;
      heightRatio: number;
      offsetYRatio: number;
    }>;
  },
  obstacles: {
    centerBlock: {
      worldSize: { x: 0.8, y: 1.0, z: 0.4 },
      anchor: 'center',
      referenceStage: 3,
      expectedScreenSize: { width: 142, height: 176 },
      silhouetteRule: 'tight',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.62, heightRatio: 0.62 },
    } satisfies StageArtGeometryEntry & StageCollisionShape,
    dualBlockLeft: {
      worldSize: { x: 0.6, y: 0.95, z: 0.35 },
      anchor: 'center',
      referenceStage: 4,
      expectedScreenSize: { width: 124, height: 166 },
      silhouetteRule: 'tight',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.54, heightRatio: 0.66 },
    } satisfies StageArtGeometryEntry & StageCollisionShape,
    dualBlockRight: {
      worldSize: { x: 0.7, y: 1.0, z: 0.35 },
      anchor: 'center',
      referenceStage: 4,
      expectedScreenSize: { width: 130, height: 172 },
      silhouetteRule: 'tight',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.54, heightRatio: 0.66 },
    } satisfies StageArtGeometryEntry & StageCollisionShape,
    movingCart: {
      worldSize: { x: 0.9, y: 1.0, z: 0.35 },
      anchor: 'bottom-center',
      referenceStage: 5,
      expectedScreenSize: { width: 168, height: 168 },
      silhouetteRule: 'tight',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.71, heightRatio: 0.44 },
    } satisfies StageArtGeometryEntry & StageCollisionShape,
    swingPanel: {
      worldSize: { x: 0.7, y: 1.0, z: 0.35 },
      anchor: 'top-center',
      referenceStage: 6,
      expectedScreenSize: { width: 132, height: 176 },
      silhouetteRule: 'tight',
      hitbox: { xRatio: 0.5, yRatio: 0.58, widthRatio: 0.28, heightRatio: 0.84 },
    } satisfies StageArtGeometryEntry & StageCollisionShape,
    narrowGate: {
      worldSize: { x: 0.55, y: 1.1, z: 0.2 },
      anchor: 'center',
      referenceStage: 6,
      expectedScreenSize: { width: 110, height: 182 },
      silhouetteRule: 'gate-opening',
      hitbox: { xRatio: 0.5, yRatio: 0.5, widthRatio: 0.29, heightRatio: 0.9 },
    } satisfies StageArtGeometryEntry & StageCollisionShape,
  },
} as const;
