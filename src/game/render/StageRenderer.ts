import Phaser from 'phaser';
import type { StageConfig, Vec3 } from '../contracts';
import { getObstacleWorldPose } from '../obstacles/getObstacleWorldPose';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { projectWorldToScreen } from './projectWorldToScreen';

type ScreenPoint = {
  x: number;
  y: number;
  scale: number;
};

export class StageRenderer {
  private readonly scene: Phaser.Scene;
  private readonly stage: StageConfig;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private lastSnapshot: RuntimeSnapshot | null = null;

  constructor(scene: Phaser.Scene, stage: StageConfig) {
    this.scene = scene;
    this.stage = stage;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);
  }

  render(snapshot: RuntimeSnapshot): void {
    this.lastSnapshot = snapshot;

    const graphics = this.graphics;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const floorY = height * 0.82;

    this.scene.cameras.main.setBackgroundColor('#ede4d6');
    graphics.clear();

    graphics.fillStyle(0xf5efe5, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(0xd8c8b0, 1);
    graphics.fillRect(0, floorY, width, height - floorY);

    this.drawFanZone();
    this.drawBin();
    this.drawObstacles(snapshot.worldTimeMs);
    this.drawSpawnMarker();
    this.drawAimGuide(snapshot);
    this.drawPaper(snapshot);
  }

  getLastSnapshot(): RuntimeSnapshot | null {
    return this.lastSnapshot;
  }

  private drawFanZone(): void {
    if (!this.stage.fan.enabled) {
      return;
    }

    const fanOrigin = this.toScreen(this.stage.fan.position);
    const fanEnd = this.toScreen({
      x: this.stage.fan.position.x,
      y: this.stage.fan.position.y,
      z: this.stage.fan.position.z + this.stage.fan.influenceLength,
    });
    const zoneWidth = Math.max(36, this.stage.fan.influenceWidth * 90 * fanOrigin.scale);

    this.graphics.fillStyle(0x77bde6, 0.18);
    this.graphics.fillRect(
      Math.min(fanOrigin.x, fanEnd.x) - zoneWidth * 0.5,
      Math.min(fanOrigin.y, fanEnd.y) - 24,
      Math.abs(fanEnd.x - fanOrigin.x) + zoneWidth,
      Math.abs(fanEnd.y - fanOrigin.y) + 48,
    );

    this.graphics.fillStyle(0x4c92c7, 0.9);
    this.graphics.fillCircle(fanOrigin.x, fanOrigin.y, 12);
  }

  private drawBin(): void {
    const binCenter = this.toScreen(this.stage.bin.position);
    const collisionWidth = Math.max(68, this.stage.bin.openingWidth * 260 * binCenter.scale);
    const visualWidth = collisionWidth * 1.08;
    const binHeight = Math.max(46, this.stage.bin.openingHeight * 220 * binCenter.scale);
    const bucketHeight = binHeight * 1.2;

    this.graphics.fillStyle(0x6a4f38, 0.22);
    this.graphics.fillRoundedRect(
      binCenter.x - visualWidth * 0.52,
      binCenter.y - binHeight * 0.15,
      visualWidth * 1.04,
      bucketHeight,
      12,
    );

    this.graphics.lineStyle(4, 0x4b4b4b, 1);
    this.graphics.strokeRoundedRect(
      binCenter.x - visualWidth * 0.5,
      binCenter.y - binHeight * 0.5,
      visualWidth,
      binHeight,
      10,
    );

    this.graphics.lineStyle(2, 0xb15f2a, 0.65);
    this.graphics.strokeRoundedRect(
      binCenter.x - collisionWidth * 0.5,
      binCenter.y - binHeight * 0.5,
      collisionWidth,
      binHeight,
      10,
    );
  }

  private drawObstacles(worldTimeMs: number): void {
    this.graphics.fillStyle(0x6f655a, 0.9);

    for (const obstacle of this.stage.obstacles) {
      const pose = getObstacleWorldPose({
        basePosition: obstacle.position,
        motion: obstacle.motion,
        worldTimeMs,
      });
      const screen = this.toScreen(pose);
      const obstacleWidth = Math.max(24, obstacle.size.x * 140 * screen.scale);
      const obstacleHeight = Math.max(18, obstacle.size.y * 120 * screen.scale);
      this.graphics.fillRoundedRect(
        screen.x - obstacleWidth * 0.5,
        screen.y - obstacleHeight * 0.5,
        obstacleWidth,
        obstacleHeight,
        8,
      );
    }
  }

  private drawSpawnMarker(): void {
    const spawn = this.toScreen(this.stage.paper.spawn);
    this.graphics.lineStyle(2, 0x6e6254, 0.75);
    this.graphics.strokeCircle(spawn.x, spawn.y, Math.max(8, this.stage.paper.radius * 90));
  }

  private drawAimGuide(snapshot: RuntimeSnapshot): void {
    const start = this.toScreen(this.stage.paper.spawn);
    const yawRatio = Phaser.Math.Clamp(
      (snapshot.input.yawDeg - this.stage.aim.yawMinDeg) /
        (this.stage.aim.yawMaxDeg - this.stage.aim.yawMinDeg),
      0,
      1,
    );
    const pitchRatio = Phaser.Math.Clamp(
      (snapshot.input.pitchDeg - this.stage.aim.pitchMinDeg) /
        (this.stage.aim.pitchMaxDeg - this.stage.aim.pitchMinDeg),
      0,
      1,
    );
    const guideX = widthLerp(this.scene.scale.width * 0.3, this.scene.scale.width * 0.7, yawRatio);
    const guideY = widthLerp(this.scene.scale.height * 0.7, this.scene.scale.height * 0.35, pitchRatio);

    this.graphics.lineStyle(2, 0x8c4c28, 0.6);
    this.graphics.beginPath();
    this.graphics.moveTo(start.x, start.y);
    this.graphics.lineTo(guideX, guideY);
    this.graphics.strokePath();
    this.graphics.fillStyle(0x8c4c28, 1);
    this.graphics.fillCircle(guideX, guideY, 5);
  }

  private drawPaper(snapshot: RuntimeSnapshot): void {
    const activeBody = snapshot.activeBody;
    const position = activeBody?.position ?? this.stage.paper.spawn;
    const projected = this.toScreen(position);
    const radius = Math.max(12, this.stage.paper.radius * 150 * projected.scale * 1.08);

    this.graphics.fillStyle(activeBody ? 0xfaf8f2 : 0xfaf8f2, activeBody ? 1 : 0.45);
    this.graphics.fillCircle(projected.x, projected.y, radius);
    this.graphics.lineStyle(2, 0xc7bda8, 1);
    this.graphics.strokeCircle(projected.x, projected.y, radius);
  }

  private toScreen(position: Vec3): ScreenPoint {
    const projected = projectWorldToScreen(position);
    return {
      x: this.scene.scale.width * 0.5 + projected.x,
      y: this.scene.scale.height * 0.8 + projected.y,
      scale: projected.scale,
    };
  }
}

function widthLerp(min: number, max: number, ratio: number): number {
  return min + (max - min) * ratio;
}
