import type { Vec3 } from '../contracts';
import { deskCameraRigTheme, type RenderViewport } from './renderTheme';

export interface DeskProjection {
  x: number;
  y: number;
  scale: number;
  depthClamped: boolean;
}

export function projectDeskPoint(position: Vec3, viewport: RenderViewport): DeskProjection {
  if (position.z <= deskCameraRigTheme.nearClipZ) {
    return {
      x: viewport.width * deskCameraRigTheme.originXRatio,
      y: viewport.height * deskCameraRigTheme.originYRatio,
      scale: 0,
      depthClamped: true,
    };
  }

  const depth = Math.max(1, position.z + deskCameraRigTheme.depthBias);
  const scale = 1 / depth;

  return {
    x: viewport.width * deskCameraRigTheme.originXRatio + position.x * deskCameraRigTheme.perspectiveX * scale,
    y:
      viewport.height * deskCameraRigTheme.originYRatio -
      position.y * deskCameraRigTheme.perspectiveY * scale -
      position.z * deskCameraRigTheme.depthLiftPerZ,
    scale,
    depthClamped: false,
  };
}
