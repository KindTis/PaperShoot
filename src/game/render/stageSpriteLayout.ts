import { assetManifest } from '../assets/assetManifest';
import { stageArtGeometry, type StageArtAnchor } from '../assets/stageArtGeometry';
import type { Vec3 } from '../contracts';

export type SpriteLayout = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
}>;

export type SpriteRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type BinSpriteLayoutInput = Readonly<{
  screenX: number;
  screenY: number;
  projectedScale: number;
  openingWidth: number;
}>;

type BinEntryWindowRectInput = Readonly<{
  binLayout: SpriteLayout;
  minWidth?: number;
  minHeight?: number;
}>;

type ObstacleSpriteLayoutInput = Readonly<{
  obstacleId: string;
  screenX: number;
  screenY: number;
  projectedScale: number;
  obstacleSize: Vec3;
}>;

type ObstacleSpriteBinding = Readonly<{
  geometryKey: keyof typeof stageArtGeometry.obstacles;
  assetKey: string;
}>;

const obstacleSpriteRegistry = {
  'block-center': {
    geometryKey: 'centerBlock',
    assetKey: assetManifest.obstacles.centerBlock.key,
  },
  'block-left': {
    geometryKey: 'dualBlockLeft',
    assetKey: assetManifest.obstacles.dualBlockLeft.key,
  },
  'block-right': {
    geometryKey: 'dualBlockRight',
    assetKey: assetManifest.obstacles.dualBlockRight.key,
  },
  'moving-slab': {
    geometryKey: 'movingCart',
    assetKey: assetManifest.obstacles.movingCart.key,
  },
  'moving-panel': {
    geometryKey: 'swingPanel',
    assetKey: assetManifest.obstacles.swingPanel.key,
  },
  'gate-final': {
    geometryKey: 'narrowGate',
    assetKey: assetManifest.obstacles.narrowGate.key,
  },
} as const satisfies Record<string, ObstacleSpriteBinding>;

function resolveObstacleSpriteBinding(obstacleId: string): ObstacleSpriteBinding | null {
  return obstacleSpriteRegistry[obstacleId as keyof typeof obstacleSpriteRegistry] ?? null;
}

export function resolveAnchorOrigin(anchor: StageArtAnchor): { originX: number; originY: number } {
  switch (anchor) {
    case 'top-center':
      return { originX: 0.5, originY: 0 };
    case 'bottom-center':
      return { originX: 0.5, originY: 1 };
    case 'center':
    default:
      return { originX: 0.5, originY: 0.5 };
  }
}

export function resolveObstacleAssetKey(obstacleId: string): string | null {
  return resolveObstacleSpriteBinding(obstacleId)?.assetKey ?? null;
}

export function createBinSpriteLayout(input: BinSpriteLayoutInput): SpriteLayout {
  const scale = Math.max(input.projectedScale, 0);
  const sizeScale = input.openingWidth > 0 ? input.openingWidth / stageArtGeometry.bin.worldSize.x : 1;
  const { originX, originY } = resolveAnchorOrigin(stageArtGeometry.bin.anchor);

  return {
    x: input.screenX,
    y: input.screenY,
    width: Math.max(1, stageArtGeometry.bin.expectedScreenSize.width * scale * sizeScale),
    height: Math.max(1, stageArtGeometry.bin.expectedScreenSize.height * scale * sizeScale),
    originX,
    originY,
  };
}

export function createBinEntryWindowRect(input: BinEntryWindowRectInput): SpriteRect {
  const width = Math.max(
    1,
    Math.max(input.binLayout.width * stageArtGeometry.bin.entryWindow.widthRatio, input.minWidth ?? 0),
  );
  const height = Math.max(
    1,
    Math.max(input.binLayout.height * stageArtGeometry.bin.entryWindow.heightRatio, input.minHeight ?? 0),
  );
  const centerX = input.binLayout.x;
  const centerY = input.binLayout.y + input.binLayout.height * stageArtGeometry.bin.entryWindow.offsetYRatio;

  return {
    x: centerX - width * 0.5,
    y: centerY - height * 0.5,
    width,
    height,
  };
}

export function createObstacleSpriteLayout(input: ObstacleSpriteLayoutInput): SpriteLayout | null {
  const binding = resolveObstacleSpriteBinding(input.obstacleId);
  if (!binding) {
    return null;
  }

  const geometry = stageArtGeometry.obstacles[binding.geometryKey];
  const scale = Math.max(input.projectedScale, 0);
  const widthScale = geometry.worldSize.x > 0 ? input.obstacleSize.x / geometry.worldSize.x : 1;
  const heightScale = geometry.worldSize.y > 0 ? input.obstacleSize.y / geometry.worldSize.y : 1;
  const { originX, originY } = resolveAnchorOrigin(geometry.anchor);

  return {
    x: input.screenX,
    y: input.screenY,
    width: Math.max(1, geometry.expectedScreenSize.width * scale * widthScale),
    height: Math.max(1, geometry.expectedScreenSize.height * scale * heightScale),
    originX,
    originY,
  };
}
