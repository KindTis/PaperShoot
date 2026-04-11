import Phaser from 'phaser';
import { assetManifest } from './assetManifest';

function normalizeBaseUrl(baseUrl: string): string {
  if (baseUrl === '/') {
    return '/';
  }

  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) {
    return '/';
  }

  return `${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}/`;
}

export function resolveAssetUrl(path: string, baseUrl: string = import.meta.env.BASE_URL): string {
  return `${normalizeBaseUrl(baseUrl)}${path.replace(/^\/+/, '')}`;
}

export function queueStageArt(loader: Phaser.Loader.LoaderPlugin, baseUrl: string = import.meta.env.BASE_URL): void {
  const assets = [
    assetManifest.background.backplate,
    assetManifest.paper.idle,
    assetManifest.bin.main,
    assetManifest.fan.main,
    assetManifest.props.cup,
    assetManifest.props.pencilCup,
    assetManifest.obstacles.centerBlock,
    assetManifest.obstacles.dualBlockLeft,
    assetManifest.obstacles.dualBlockRight,
    assetManifest.obstacles.movingCart,
    assetManifest.obstacles.swingPanel,
    assetManifest.obstacles.narrowGate,
    assetManifest.fx.successBurst,
  ] as const;

  for (const asset of assets) {
    loader.image(asset.key, resolveAssetUrl(asset.path, baseUrl));
  }
}
