export interface RenderViewport {
  width: number;
  height: number;
}

export interface ScreenAnchor {
  x: number;
  y: number;
}

export const deskCameraRigTheme = {
  originXRatio: 0.5,
  originYRatio: 0.88,
  nearClipZ: -0.2,
  depthBias: 1.2,
  perspectiveX: 260,
  perspectiveY: 180,
  depthLiftPerZ: 22,
} as const;

export const deskLayoutTheme = {
  paperAnchor: { xRatio: 0.5, yRatio: 0.84 },
  binAnchor: { xRatio: 0.56, yRatio: 0.52 },
  fanAnchor: { xRatio: 0.18, yRatio: 0.78 },
} as const;
