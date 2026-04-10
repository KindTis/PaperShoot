import Phaser from 'phaser';
import { queueStageArt } from '../assets/loadStageArt';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    queueStageArt(this.load);
  }

  create(): void {
    this.scene.start('StageScene');
  }
}
