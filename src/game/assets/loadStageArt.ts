import Phaser from 'phaser';
import { assetManifest } from './assetManifest';

export function queueStageArt(loader: Phaser.Loader.LoaderPlugin): void {
  loader.svg('paper-ball', assetManifest.paper.idle);
  loader.svg('trash-bin', assetManifest.bin.main);
  loader.svg('desk-fan', assetManifest.fan.main);
  loader.svg('cup', assetManifest.props[0]);
  loader.svg('pencil-cup', assetManifest.props[1]);
}
