import Phaser from 'phaser';
import { stageArtAssets } from './assetManifest';

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
  for (const asset of stageArtAssets) {
    loader.image(asset.key, resolveAssetUrl(asset.path, baseUrl));
  }
}
