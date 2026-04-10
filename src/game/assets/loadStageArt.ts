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
    assetManifest.paper.idle,
    assetManifest.bin.main,
    assetManifest.fan.main,
    assetManifest.props.cup,
    assetManifest.props.pencilCup,
  ] as const;

  for (const asset of assets) {
    loader.svg(asset.key, resolveAssetUrl(asset.path, baseUrl), { width: asset.width, height: asset.height });
  }
}
