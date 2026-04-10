import Phaser from 'phaser';
import { assetManifest } from '../assets/assetManifest';
import type { StageConfig, Vec3 } from '../contracts';
import { getObstacleWorldPose } from '../obstacles/getObstacleWorldPose';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { createLaunchVector } from '../simulation/createLaunchVector';
import { projectDeskPoint } from './cameraRig';
import { createDeskLayout } from './deskLayout';
import type { RenderViewport } from './renderTheme';

type ScreenPoint = {
  x: number;
  y: number;
  scale: number;
  depthClamped: boolean;
};

type RenderSprites = {
  paper: Phaser.GameObjects.Image | null;
  bin: Phaser.GameObjects.Image | null;
  fan: Phaser.GameObjects.Image | null;
  cup: Phaser.GameObjects.Image | null;
  pencilCup: Phaser.GameObjects.Image | null;
};

const PROP_POSITIONS = {
  cup: { x: -1.65, y: 1.05, z: 4.8 },
  pencilCup: { x: 2.15, y: 1.08, z: 5.7 },
} as const;

export class StageRenderer {
  private readonly scene: Phaser.Scene;
  private readonly stage: StageConfig;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly sprites: RenderSprites;
  private lastSnapshot: RuntimeSnapshot | null = null;

  constructor(scene: Phaser.Scene, stage: StageConfig) {
    this.scene = scene;
    this.stage = stage;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);
    this.sprites = this.createSprites();
  }

  render(snapshot: RuntimeSnapshot): void {
    this.lastSnapshot = snapshot;
    this.resetSprites();

    this.scene.cameras.main.setBackgroundColor('#e8dccd');
    this.graphics.clear();

    this.drawDeskBackdrop();
    this.drawProps();
    this.drawFan(snapshot.worldTimeMs);
    this.drawBin();
    this.drawObstacles(snapshot.worldTimeMs);
    this.drawAimArc(snapshot);
    this.drawPaperShadow(snapshot);
    this.drawPaper(snapshot);
  }

  getLastSnapshot(): RuntimeSnapshot | null {
    return this.lastSnapshot;
  }

  private createSprites(): RenderSprites {
    const add = this.scene.add as Phaser.Scene['add'] & {
      image?: (x: number, y: number, key: string) => Phaser.GameObjects.Image;
    };
    const textures = this.scene.textures as { exists?: (key: string) => boolean } | undefined;
    if (!textures || typeof textures.exists !== 'function' || typeof add.image !== 'function') {
      return {
        paper: null,
        bin: null,
        fan: null,
        cup: null,
        pencilCup: null,
      };
    }

    const create = (key: string, depth: number): Phaser.GameObjects.Image | null => {
      if (!textures.exists?.(key)) {
        return null;
      }

      const image = add.image(0, 0, key);
      image.setVisible(false);
      image.setDepth(depth);
      return image;
    };

    return {
      paper: create(assetManifest.paper.idle.key, 8),
      bin: create(assetManifest.bin.main.key, 5),
      fan: create(assetManifest.fan.main.key, 4),
      cup: create(assetManifest.props.cup.key, 4),
      pencilCup: create(assetManifest.props.pencilCup.key, 4),
    };
  }

  private resetSprites(): void {
    for (const sprite of Object.values(this.sprites)) {
      sprite?.setVisible(false);
    }
  }

  private drawDeskBackdrop(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const horizonY = height * 0.45;
    const deskTopY = height * 0.48;

    this.graphics.fillStyle(0xf4ede1, 1);
    this.graphics.fillRect(0, 0, width, horizonY);

    this.graphics.fillStyle(0xe4d2bb, 1);
    this.graphics.fillRect(0, horizonY - 32, width, 40);

    const graphicsWithPolygon = this.graphics as Phaser.GameObjects.Graphics & {
      closePath?: () => Phaser.GameObjects.Graphics;
      fillPath?: () => Phaser.GameObjects.Graphics;
    };

    if (typeof graphicsWithPolygon.closePath === 'function' && typeof graphicsWithPolygon.fillPath === 'function') {
      this.graphics.fillStyle(0xc9a578, 1);
      this.graphics.beginPath();
      this.graphics.moveTo(width * 0.06, height);
      this.graphics.lineTo(width * 0.94, height);
      this.graphics.lineTo(width * 0.78, deskTopY);
      this.graphics.lineTo(width * 0.22, deskTopY);
      graphicsWithPolygon.closePath();
      graphicsWithPolygon.fillPath();
    } else {
      this.graphics.fillStyle(0xc9a578, 1);
      this.graphics.fillRoundedRect(width * 0.08, deskTopY, width * 0.84, height - deskTopY + 40, 28);
    }

    this.graphics.lineStyle(2, 0xb48759, 0.24);
    for (let index = 0; index < 7; index += 1) {
      const startRatio = 0.11 + index * 0.12;
      const endOffset = (index - 3) * 36;
      this.graphics.beginPath();
      this.graphics.moveTo(width * startRatio, height);
      this.graphics.lineTo(width * 0.5 + endOffset, deskTopY);
      this.graphics.strokePath();
    }
  }

  private drawProps(): void {
    this.drawPropSprite(this.sprites.cup, PROP_POSITIONS.cup, { width: 72, height: 72 }, 0.98);
    this.drawPropSprite(this.sprites.pencilCup, PROP_POSITIONS.pencilCup, { width: 86, height: 86 }, 0.98);

    if (!this.sprites.cup) {
      const cup = this.toScreen(PROP_POSITIONS.cup);
      if (!cup.depthClamped) {
        this.graphics.fillStyle(0xb88e67, 0.85);
        this.graphics.fillRoundedRect(cup.x - 18, cup.y - 24, 36, 42, 10);
      }
    }

    if (!this.sprites.pencilCup) {
      const pencilCup = this.toScreen(PROP_POSITIONS.pencilCup);
      if (!pencilCup.depthClamped) {
        this.graphics.fillStyle(0x6f6154, 0.88);
        this.graphics.fillRoundedRect(pencilCup.x - 20, pencilCup.y - 26, 40, 46, 10);
      }
    }
  }

  private drawPropSprite(
    sprite: Phaser.GameObjects.Image | null,
    position: Vec3,
    size: { width: number; height: number },
    alpha: number,
  ): void {
    const screen = this.toScreen(position);
    if (screen.depthClamped) {
      return;
    }

    if (sprite) {
      this.syncSprite(sprite, screen.x, screen.y, size.width * screen.scale * 3.1, size.height * screen.scale * 3.1, 0, alpha);
    }
  }

  private drawFan(worldTimeMs: number): void {
    if (!this.stage.fan.enabled) {
      return;
    }

    const layout = this.getLayout();
    const originProjected = this.toScreen(this.stage.fan.position);
    const endProjected = this.toScreen({
      x: this.stage.fan.position.x,
      y: this.stage.fan.position.y,
      z: this.stage.fan.position.z + this.stage.fan.influenceLength,
    });
    if (originProjected.depthClamped || endProjected.depthClamped) {
      return;
    }

    const fanX = layout.fanAnchor.x;
    const fanY = layout.fanAnchor.y;
    const screenOrigin = {
      x: fanX,
      y: fanY,
    };
    const screenEnd = {
      x: fanX + (endProjected.x - originProjected.x),
      y: fanY + (endProjected.y - originProjected.y),
    };

    for (let index = 0; index < 4; index += 1) {
      const phase = (worldTimeMs / 240 + index * 0.22) % 1;
      const startX = Phaser.Math.Linear(screenOrigin.x + 22, screenEnd.x - 28, phase);
      const startY = Phaser.Math.Linear(screenOrigin.y - 6, screenEnd.y - 6, phase);
      const length = 24 + index * 10;

      this.graphics.lineStyle(3, 0x7fb9dd, 0.38 - index * 0.05);
      this.graphics.beginPath();
      this.graphics.moveTo(startX, startY + index * 8);
      this.graphics.lineTo(startX + length, startY + index * 6 - 4);
      this.graphics.strokePath();
    }

    if (this.sprites.fan) {
      const size = Math.max(64, 140 * originProjected.scale * 3.2);
      this.syncSprite(this.sprites.fan, fanX, fanY, size, size, -6, 0.96);
      return;
    }

    this.graphics.fillStyle(0x4c92c7, 0.92);
    this.graphics.fillCircle(fanX, fanY, 16);
  }

  private drawBin(): void {
    const layout = this.getLayout();
    const projected = this.toScreen(this.stage.bin.position);
    if (projected.depthClamped) {
      return;
    }

    const binX = layout.binAnchor.x;
    const binY = layout.binAnchor.y;
    const collisionWidth = Math.max(86, this.stage.bin.openingWidth * 300 * projected.scale);
    const visualWidth = collisionWidth * 1.08;
    const visualHeight = Math.max(92, visualWidth * 1.22);

    this.graphics.fillStyle(0x3b2b1f, 0.14);
    this.graphics.fillRoundedRect(binX - visualWidth * 0.38, binY + visualHeight * 0.28, visualWidth * 0.76, 14, 7);

    if (this.sprites.bin) {
      this.syncSprite(this.sprites.bin, binX, binY + visualHeight * 0.12, visualWidth * 1.24, visualHeight * 1.42, 0, 1);
    } else {
      this.graphics.fillStyle(0x6a4f38, 0.22);
      this.graphics.fillRoundedRect(binX - visualWidth * 0.52, binY - visualHeight * 0.18, visualWidth * 1.04, visualHeight, 12);
      this.graphics.lineStyle(4, 0x4b4b4b, 1);
      this.graphics.strokeRoundedRect(binX - visualWidth * 0.5, binY - visualHeight * 0.44, visualWidth, visualHeight * 0.66, 10);
    }

    this.graphics.lineStyle(3, 0xb76b34, 0.34);
    this.graphics.strokeRoundedRect(binX - collisionWidth * 0.5, binY - visualHeight * 0.32, collisionWidth, visualHeight * 0.38, 14);
  }

  private drawObstacles(worldTimeMs: number): void {
    this.graphics.fillStyle(0x675c50, 0.88);

    for (const obstacle of this.stage.obstacles) {
      const pose = getObstacleWorldPose({
        basePosition: obstacle.position,
        motion: obstacle.motion,
        worldTimeMs,
      });
      const screen = this.toScreen(pose);
      if (screen.depthClamped) {
        continue;
      }

      const obstacleWidth = Math.max(34, obstacle.size.x * 160 * screen.scale);
      const obstacleHeight = Math.max(22, obstacle.size.y * 132 * screen.scale);
      this.graphics.fillRoundedRect(
        screen.x - obstacleWidth * 0.5,
        screen.y - obstacleHeight * 0.45,
        obstacleWidth,
        obstacleHeight,
        10,
      );
    }
  }

  private drawAimArc(snapshot: RuntimeSnapshot): void {
    if (snapshot.activeBody || snapshot.stageStatus !== 'playing') {
      return;
    }

    let position = { ...this.stage.paper.spawn };
    let velocity = createLaunchVector({
      yawDeg: snapshot.input.yawDeg,
      pitchDeg: snapshot.input.pitchDeg,
      power: snapshot.input.power,
      minPower: this.stage.power.minPower,
      maxPower: this.stage.power.maxPower,
    });

    const dtSec = 0.08;
    const guidePoints: ScreenPoint[] = [];
    for (let step = 0; step < 7; step += 1) {
      const screen = this.toScreen(position);
      if (screen.depthClamped) {
        break;
      }
      guidePoints.push(screen);
      velocity = {
        x: velocity.x * 0.992,
        y: Math.max(this.stage.physics.maxFallSpeed, velocity.y + this.stage.physics.gravityY * 0.62 * dtSec),
        z: velocity.z * 0.997,
      };
      position = {
        x: position.x + velocity.x * dtSec,
        y: position.y + velocity.y * dtSec,
        z: position.z + velocity.z * dtSec,
      };
    }

    if (guidePoints.length < 2) {
      return;
    }

    this.graphics.lineStyle(3, 0x9b5f38, 0.45);
    this.graphics.beginPath();
    this.graphics.moveTo(guidePoints[0].x, guidePoints[0].y);
    for (let index = 1; index < guidePoints.length; index += 1) {
      this.graphics.lineTo(guidePoints[index].x, guidePoints[index].y);
    }
    this.graphics.strokePath();

    this.graphics.fillStyle(0xc27c48, 0.48);
    for (let index = 1; index < guidePoints.length; index += 1) {
      this.graphics.fillCircle(guidePoints[index].x, guidePoints[index].y, Math.max(3, 6 - index * 0.55));
    }
  }

  private drawPaperShadow(snapshot: RuntimeSnapshot): void {
    const position = snapshot.activeBody?.position ?? this.stage.paper.spawn;
    const groundProjected = this.toScreen({
      x: position.x,
      y: this.stage.paper.radius,
      z: position.z,
    });
    if (groundProjected.depthClamped) {
      return;
    }

    const heightAboveDesk = Math.max(0, position.y - this.stage.paper.radius);
    const width = Math.max(16, this.stage.paper.radius * 180 * groundProjected.scale * 1.5);
    const alpha = snapshot.activeBody
      ? Phaser.Math.Clamp(0.24 - heightAboveDesk * 0.1, 0.08, 0.22)
      : 0.12;

    this.graphics.fillStyle(0x2b2016, alpha);
    this.graphics.fillRoundedRect(groundProjected.x - width * 0.62, groundProjected.y - 5, width * 1.24, 10, 6);
  }

  private drawPaper(snapshot: RuntimeSnapshot): void {
    const activeBody = snapshot.activeBody;
    const position = activeBody?.position ?? this.stage.paper.spawn;
    const projected = this.toScreen(position);
    if (projected.depthClamped) {
      return;
    }

    const diameter = Math.max(22, this.stage.paper.radius * 220 * projected.scale * 1.08);
    const angle = activeBody ? Phaser.Math.Clamp(activeBody.velocity.x * -3.5, -22, 22) : -8;
    const alpha = activeBody ? 1 : 0.96;

    if (this.sprites.paper) {
      this.syncSprite(this.sprites.paper, projected.x, projected.y, diameter * 1.18, diameter * 1.18, angle, alpha);
      return;
    }

    this.graphics.fillStyle(0xfaf8f2, alpha);
    this.graphics.fillCircle(projected.x, projected.y, diameter * 0.5);
    this.graphics.lineStyle(2, 0xc7bda8, 1);
    this.graphics.strokeCircle(projected.x, projected.y, diameter * 0.5);
  }

  private syncSprite(
    sprite: Phaser.GameObjects.Image,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number,
    alpha: number,
  ): void {
    sprite.setVisible(true);
    sprite.setPosition(x, y);
    sprite.setDisplaySize(width, height);
    sprite.setAngle(angle);
    sprite.setAlpha(alpha);
  }

  private toScreen(position: Vec3): ScreenPoint {
    const viewport = this.getViewport();
    const layout = createDeskLayout(viewport);
    const projected = projectDeskPoint(position, viewport);
    const spawnProjected = projectDeskPoint(this.stage.paper.spawn, viewport);
    const offsetX = layout.paperAnchor.x - spawnProjected.x;
    const offsetY = layout.paperAnchor.y - spawnProjected.y;

    return {
      x: projected.x + offsetX,
      y: projected.y + offsetY,
      scale: projected.scale,
      depthClamped: projected.depthClamped,
    };
  }

  private getViewport(): RenderViewport {
    return {
      width: this.scene.scale.width,
      height: this.scene.scale.height,
    };
  }

  private getLayout() {
    return createDeskLayout(this.getViewport());
  }
}
