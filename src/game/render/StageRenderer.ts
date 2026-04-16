import Phaser from 'phaser';
import { assetManifest } from '../assets/assetManifest';
import type { StageConfig, Vec3 } from '../contracts';
import { getObstacleWorldPose } from '../obstacles/getObstacleWorldPose';
import type { RuntimeSnapshot } from '../runtime/runtimeTypes';
import { createLaunchVector } from '../simulation/createLaunchVector';
import { projectDeskPoint } from './cameraRig';
import { createDeskLayout } from './deskLayout';
import type { RenderViewport } from './renderTheme';
import {
  createBinSpriteLayout,
  createObstacleSpriteLayout,
  resolveObstacleAssetKey,
} from './stageSpriteLayout';

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
  officeBackdrop: {
    backplate: Phaser.GameObjects.Image | null;
    foregroundDeskEdge: Phaser.GameObjects.Image | null;
  };
  obstacles: Array<{
    id: string;
    sprite: Phaser.GameObjects.Image | null;
  }>;
};

const PROP_POSITIONS = {
  cup: { x: -1.65, y: 1.05, z: 4.8 },
  pencilCup: { x: 2.15, y: 1.08, z: 5.7 },
} as const;

const OFFICE_BACKDROP_LAYOUT = [
  {
    key: 'backplate',
    xRatio: 0.5,
    yRatio: 0.5,
    widthRatio: 1.04,
    heightRatio: 1.02,
    originX: 0.5,
    originY: 0.5,
    alpha: 1,
  },
  {
    key: 'foregroundDeskEdge',
    xRatio: 0.5,
    yRatio: 0.86,
    widthRatio: 1.06,
    heightRatio: 0.34,
    originX: 0.5,
    originY: 0.5,
    alpha: 1,
  },
] as const;

type BackdropPalette = {
  background: string;
  wall: number;
  trim: number;
  floor: number;
};

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

    this.scene.cameras.main.setBackgroundColor(this.getBackdropPalette().background);
    this.graphics.clear();

    this.drawBackdrop();
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
        officeBackdrop: {
          backplate: null,
          foregroundDeskEdge: null,
        },
        obstacles: this.stage.obstacles.map((obstacle) => ({
          id: obstacle.id,
          sprite: null,
        })),
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
      officeBackdrop: {
        backplate: this.stage.theme === 'office' ? create(assetManifest.background.backplate.key, 0) : null,
        foregroundDeskEdge: this.stage.theme === 'office' ? create(assetManifest.background.foregroundDeskEdge.key, 3) : null,
      },
      obstacles: this.stage.obstacles.map((obstacle) => {
        const obstacleAssetKey = resolveObstacleAssetKey(obstacle.id);
        return {
          id: obstacle.id,
          sprite: obstacleAssetKey ? create(obstacleAssetKey, 6) : null,
        };
      }),
    };
  }

  private resetSprites(): void {
    const commonSprites = [
      this.sprites.paper,
      this.sprites.bin,
      this.sprites.fan,
      this.sprites.cup,
      this.sprites.pencilCup,
      this.sprites.officeBackdrop.backplate,
      this.sprites.officeBackdrop.foregroundDeskEdge,
    ];
    for (const sprite of commonSprites) {
      sprite?.setVisible(false);
    }
    for (const obstacleSprite of this.sprites.obstacles) {
      obstacleSprite.sprite?.setVisible(false);
    }
  }

  private drawDeskBackdrop(): void {
    const palette = this.getBackdropPalette();
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const horizonY = height * 0.45;
    const deskTopY = height * 0.48;

    this.graphics.fillStyle(palette.wall, 1);
    this.graphics.fillRect(0, 0, width, horizonY);

    this.graphics.fillStyle(palette.trim, 1);
    this.graphics.fillRect(0, horizonY - 32, width, 40);

    const graphicsWithPolygon = this.graphics as Phaser.GameObjects.Graphics & {
      closePath?: () => Phaser.GameObjects.Graphics;
      fillPath?: () => Phaser.GameObjects.Graphics;
    };

    if (typeof graphicsWithPolygon.closePath === 'function' && typeof graphicsWithPolygon.fillPath === 'function') {
      this.graphics.fillStyle(palette.floor, 1);
      this.graphics.beginPath();
      this.graphics.moveTo(width * 0.06, height);
      this.graphics.lineTo(width * 0.94, height);
      this.graphics.lineTo(width * 0.78, deskTopY);
      this.graphics.lineTo(width * 0.22, deskTopY);
      graphicsWithPolygon.closePath();
      graphicsWithPolygon.fillPath();
    } else {
      this.graphics.fillStyle(palette.floor, 1);
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

  private drawBackdrop(): void {
    if (this.stage.theme === 'office') {
      if (!this.drawOfficeBackdropSprites()) {
        this.drawOfficeBackdrop();
      }
      return;
    }

    this.drawDeskBackdrop();
  }

  private drawOfficeBackdropSprites(): boolean {
    const layers = this.sprites.officeBackdrop;
    if (!layers.backplate || !layers.foregroundDeskEdge) {
      return false;
    }

    const layerSprites = {
      backplate: layers.backplate,
      foregroundDeskEdge: layers.foregroundDeskEdge,
    } as const;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    for (const layer of OFFICE_BACKDROP_LAYOUT) {
      const sprite = layerSprites[layer.key];
      sprite.setOrigin(layer.originX, layer.originY);
      this.syncSprite(
        sprite,
        width * layer.xRatio,
        height * layer.yRatio,
        width * layer.widthRatio,
        height * layer.heightRatio,
        0,
        layer.alpha,
      );
    }
    return true;
  }

  private drawProps(): void {
    if (this.stage.theme === 'office') {
      this.drawOfficeProps();
      return;
    }

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

  private drawOfficeBackdrop(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const horizonY = height * 0.44;
    const floorY = height * 0.58;

    this.graphics.fillStyle(0xe6eaef, 1);
    this.graphics.fillRect(0, 0, width, horizonY);

    this.graphics.fillStyle(0xd4dae3, 1);
    this.graphics.fillRect(0, horizonY - 18, width, 26);

    this.graphics.fillStyle(0x6c86a0, 1);
    this.graphics.fillRect(0, floorY, width, height - floorY);

    this.graphics.fillStyle(0xa9b3bf, 1);
    this.graphics.fillRoundedRect(width * 0.02, height * 0.16, width * 0.18, height * 0.46, 20);
    this.graphics.fillRoundedRect(width * 0.8, height * 0.18, width * 0.18, height * 0.44, 20);

    this.graphics.fillStyle(0x596571, 1);
    this.graphics.fillRoundedRect(width * 0.1, height * 0.56, width * 0.18, height * 0.13, 12);
    this.graphics.fillRoundedRect(width * 0.76, height * 0.58, width * 0.18, height * 0.12, 12);

    this.graphics.fillStyle(0xf4fafc, 1);
    this.graphics.fillRoundedRect(width * 0.12, height * 0.2, width * 0.17, height * 0.11, 12);

    this.graphics.lineStyle(5, 0xd97125, 0.95);
    this.graphics.strokeRoundedRect(width * 0.56, height * 0.58, width * 0.11, height * 0.08, 10);
  }

  private drawOfficeProps(): void {
    return; // hotfix: disable drawing dummy props
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    this.graphics.fillStyle(0x55606d, 0.96);
    this.graphics.fillRoundedRect(width * 0.78, height * 0.7, width * 0.08, height * 0.15, 12);
    this.graphics.fillRoundedRect(width * 0.8, height * 0.61, width * 0.05, height * 0.06, 10);

    this.graphics.fillStyle(0xcd7f3e, 0.94);
    this.graphics.fillRoundedRect(width * 0.18, height * 0.66, width * 0.06, height * 0.08, 10);
    this.graphics.fillStyle(0x4f8f4f, 0.96);
    this.graphics.fillCircle(width * 0.21, height * 0.65, 18);
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
      const size = Math.max(120, 140 * originProjected.scale * 8.0);
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
    const binSpriteLayout = createBinSpriteLayout({
      screenX: binX,
      screenY: binY,
      projectedScale: projected.scale,
      openingWidth: this.stage.bin.openingWidth,
    });
    const visualWidth = binSpriteLayout.width;
    const visualHeight = binSpriteLayout.height;
    // const entryWindowRect = createBinEntryWindowRect({
    //   binLayout: binSpriteLayout,
    //   minWidth: 86,
    //   minHeight: 20,
    // });

    // this.graphics.fillStyle(0x3b2b1f, 0.14);
    // this.graphics.fillRoundedRect(binSpriteLayout.x - visualWidth * 0.38, binSpriteLayout.y + visualHeight * 0.06, visualWidth * 0.76, 14, 7);

    if (this.sprites.bin) {
      this.sprites.bin.setOrigin(binSpriteLayout.originX, binSpriteLayout.originY);
      this.syncSprite(this.sprites.bin, binSpriteLayout.x, binSpriteLayout.y, visualWidth * 5.0, visualHeight * 5.0, 0, 1);
    } else {
      this.graphics.fillStyle(0x6a4f38, 0.22);
      this.graphics.fillRoundedRect(binSpriteLayout.x - visualWidth * 0.52, binSpriteLayout.y - visualHeight * 0.78, visualWidth * 1.04, visualHeight, 12);
      this.graphics.lineStyle(4, 0x4b4b4b, 1);
      this.graphics.strokeRoundedRect(binSpriteLayout.x - visualWidth * 0.5, binSpriteLayout.y - visualHeight, visualWidth, visualHeight * 0.66, 10);
    }

    // this.graphics.lineStyle(3, 0xb76b34, 0.34);
    // this.graphics.strokeRoundedRect(entryWindowRect.x, entryWindowRect.y, entryWindowRect.width, entryWindowRect.height, 14);
  }

  private drawObstacles(worldTimeMs: number): void {
    return; // Hotfix: hide default SVG obstacles which look like floating shapes
    this.graphics.fillStyle(0x675c50, 0.88);

    for (const [index, obstacle] of this.stage.obstacles.entries()) {
      const pose = getObstacleWorldPose({
        basePosition: obstacle.position,
        motion: obstacle.motion,
        worldTimeMs,
      });
      const screen = this.toScreen(pose);
      if (screen.depthClamped) {
        continue;
      }

      const obstacleSpriteLayout = createObstacleSpriteLayout({
        obstacleId: obstacle.id,
        screenX: screen.x,
        screenY: screen.y,
        projectedScale: screen.scale,
        obstacleSize: obstacle.size,
      });
      const obstacleSprite = this.sprites.obstacles[index]?.sprite;
      if (obstacleSpriteLayout && obstacleSprite) {
        obstacleSprite!.setOrigin(obstacleSpriteLayout!.originX, obstacleSpriteLayout!.originY);
        this.syncSprite(
          obstacleSprite!,
          obstacleSpriteLayout!.x,
          obstacleSpriteLayout!.y,
          obstacleSpriteLayout!.width,
          obstacleSpriteLayout!.height,
          0,
          1,
        );
        continue;
      }

      const obstacleWidth = Math.max(34, obstacle.size.x * 160 * screen.scale);
      const obstacleHeight = Math.max(22, obstacle.size.y * 132 * screen.scale);
      this.graphics.fillRoundedRect(screen.x - obstacleWidth * 0.5, screen.y - obstacleHeight * 0.45, obstacleWidth, obstacleHeight, 10);
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
    const width = Math.max(16, this.stage.paper.radius * 180 * groundProjected.scale * 5.0);
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

    const diameter = Math.max(22, this.stage.paper.radius * 220 * projected.scale * 5.0);
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

  private getBackdropPalette(): BackdropPalette {
    if (this.stage.theme === 'office') {
      return {
        background: '#d8e0e8',
        wall: 0xe6eaef,
        trim: 0xd4dae3,
        floor: 0x6c86a0,
      };
    }

    return {
      background: '#e8dccd',
      wall: 0xf4ede1,
      trim: 0xe4d2bb,
      floor: 0xc9a578,
    };
  }
}
