import Phaser from 'phaser';
import {
  BUBBLE_RADIUS, BUBBLE_DIAMETER, BOARD_WIDTH, BOARD_HEIGHT,
  SHOOTER_X, SHOOTER_Y, GRID_OFFSET_Y, GRID_OFFSET_X,
  BOARD_WIDTH_BUBBLES, type BubbleColor
} from '../config/constants';
import { Level, type LevelConfig } from '../game/Level';
import { getLevelAssetKey, LevelManager, MAX_LEVEL } from '../game/LevelManager';
import { BubbleGrid, type BubbleData } from '../game/BubbleGrid';
import { Shooter } from '../game/Shooter';
import { GridMath } from '../algorithms/GridMath';
import { MatchFinder } from '../algorithms/MatchFinder';
import { FloatingBubbleFinder } from '../algorithms/FloatingBubbleFinder';
import { HUD } from '../ui/HUD';
import { audioManager } from '../systems/AudioManager';
import { SaveSystem } from '../systems/SaveSystem';
import { ATLAS, GAME, UI } from '../assets/keys';
import { addNeonButton, addNeonPanel, addSky, candyText, playClick } from '../ui/UiFactory';
import { generateNeonBubbleTextures, NEON_HEX } from '../utils/BubbleTextureGenerator';

type GameState = 'PLAYING' | 'PROJECTILE_MOVING' | 'RESOLVING' | 'LEVEL_COMPLETE' | 'LEVEL_INTRO' | 'GAME_OVER';

interface StarThresholds {
  threeStars: number;
  twoStars: number;
}

export default class GameScene extends Phaser.Scene {
  private grid!: BubbleGrid;
  private shooter!: Shooter;
  private hud!: HUD;

  private bubbleSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private shooterSprite!: Phaser.GameObjects.Image;
  private nextShooterSprite!: Phaser.GameObjects.Image;
  private projectileSprite: Phaser.GameObjects.Image | null = null;
  private aimingLine!: Phaser.GameObjects.Graphics;
  private aimDots: Phaser.GameObjects.Arc[] = [];
  private aimCursor!: Phaser.GameObjects.Arc;
  private aimArrow!: Phaser.GameObjects.Triangle;
  private shooterHalo!: Phaser.GameObjects.Arc;
  private projectileTrail: Phaser.GameObjects.Arc[] = [];
  private nextBubbleX = 0;
  private nextBubbleY = 0;

  private score: number = 0;
  private currentLevel: number = 1;
  private maxShots: number = 25;
  private levelManager!: LevelManager;
  private gameState: GameState = 'PLAYING';
  private sceneGeneration = 0;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private deathLineY!: number;
  private pauseGroup: Phaser.GameObjects.Group | null = null;

  private starThresholds: StarThresholds = {
    threeStars: 0.50,
    twoStars: 0.25,
  };

  constructor() {
    super('GameScene');
  }

  init(data: { currentLevel?: number; score?: number }) {
    this.sceneGeneration += 1;
    this.currentLevel = data.currentLevel || 1;
    SaveSystem.setCurrentLevel(this.currentLevel);
    this.levelManager = new LevelManager(this.currentLevel);
    this.score = data.score || 0;
    this.gameState = 'PLAYING';
    this.isGameOver = false;
    this.isPaused = false;
  }

  create() {
    generateNeonBubbleTextures(this);
    this.drawBoard();

    audioManager.init(this);
    audioManager.playMusic('bgm');

    this.hud = new HUD(this, this.currentLevel);
    this.hud.updateScore(this.score);

    this.hud.onHomeClicked = () => {
      if (!this.isGameOver) {
        this.sceneGeneration += 1;
        this.scene.start('MenuScene');
      }
    };
    this.hud.onPauseClicked = () => this.togglePause();

    const levelKey = getLevelAssetKey(this.currentLevel);
    const levelConfig: LevelConfig =
      this.cache.json.get(levelKey) || this.levelManager.generateLevel(this.currentLevel);
    const level = new Level();
    this.grid = level.createGrid(levelConfig);
    this.maxShots = 20 + this.currentLevel * 5;
    this.shooter = new Shooter(SHOOTER_X, SHOOTER_Y - 20, this.colorsInPlay());
    this.shooter.shotsRemaining = this.maxShots;
    this.hud.updateShots(this.shooter.shotsRemaining);

    this.renderGrid();
    this.aimingLine = this.add.graphics().setDepth(40);
    this.createAimFx();
    this.createShooterUI();

    this.deathLineY = SHOOTER_Y - BUBBLE_RADIUS * 3;
    const dlGraphics = this.add.graphics().setDepth(8).setAlpha(0.85);
    dlGraphics.lineStyle(4, 0xff00ff, 0.5);
    dlGraphics.beginPath();
    dlGraphics.moveTo(24, this.deathLineY);
    dlGraphics.lineTo(BOARD_WIDTH - 24, this.deathLineY);
    dlGraphics.strokePath();

    this.input.on('pointerup', this.handlePointerUp, this);
    this.showLevelIntro();
  }

  private neonTexKey(color: BubbleColor): string {
    return `neon_${color}`;
  }

  private neonHex(color: BubbleColor): number {
    return NEON_HEX[color] ?? 0x00bbff;
  }

  private drawBoard() {
    addSky(this);

    const leftWall = GRID_OFFSET_X - BUBBLE_RADIUS;
    const rightWall = GRID_OFFSET_X - BUBBLE_RADIUS + BOARD_WIDTH_BUBBLES * BUBBLE_DIAMETER;
    const fieldW = rightWall - leftWall;
    const fieldH = BOARD_HEIGHT - 196;
    const fieldY = 82 + fieldH / 2;

    const bgGraphics = this.add.graphics().setDepth(1);
    bgGraphics.fillStyle(0x050a1a, 0.55);
    bgGraphics.fillRect(leftWall, fieldY - fieldH / 2, fieldW, fieldH);
    
    bgGraphics.lineStyle(3, 0x00ffff, 1);
    bgGraphics.strokeRect(leftWall, fieldY - fieldH / 2, fieldW, fieldH);
    
    bgGraphics.lineStyle(8, 0x00ffff, 0.3);
    bgGraphics.strokeRect(leftWall - 4, fieldY - fieldH / 2 - 4, fieldW + 8, fieldH + 8);
  }

  private showLevelIntro() {
    this.gameState = 'LEVEL_INTRO';
    const levelText = candyText(
      this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 24,
      `LEVEL ${String(this.currentLevel).padStart(2, '0')}`, 46, '#00ffff', 402,
    );
    const readyText = candyText(
      this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 52, 'GET READY', 22, '#ff00ff', 402,
    ).setAlpha(0);
    const line = this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 28, 10, 2, 0x00ffff).setDepth(402);

    this.tweens.add({ targets: levelText, scale: 1.12, duration: 420, ease: 'Back.Out' });
    this.tweens.add({ targets: line, width: 260, duration: 420, ease: 'Cubic.Out' });
    this.tweens.add({ targets: readyText, alpha: 1, delay: 430, duration: 220 });
    this.time.delayedCall(900, () => {
      levelText.destroy();
      readyText.destroy();
      line.destroy();
      if (!this.isGameOver) this.gameState = 'PLAYING';
    });
  }

  private colorsInPlay(): BubbleColor[] {
    const colors = [...new Set(this.grid.getAllBubbles().map((b) => b.color))];
    return colors.length > 0 ? colors : ['blue', 'orange', 'green'];
  }

  private createShooterUI() {
    this.shooterHalo = this.add
      .circle(this.shooter.x, this.shooter.y, 54, 0x00ffff, 0.2)
      .setDepth(104);

    this.tweens.add({
      targets: this.shooterHalo,
      scaleX: this.shooterHalo.scaleX * 1.06,
      scaleY: this.shooterHalo.scaleY * 1.06,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 900,
    });

    this.shooterSprite = this.add
      .image(this.shooter.x, this.shooter.y, this.neonTexKey(this.shooter.activeColor))
      .setDisplaySize(BUBBLE_DIAMETER, BUBBLE_DIAMETER)
      .setDepth(105)
      .setInteractive({ useHandCursor: true });

    this.nextBubbleX = this.shooter.x + 88;
    this.nextBubbleY = this.shooter.y + 2;

    const nextBg = this.add.graphics().setDepth(103);
    nextBg.fillStyle(0x050a22, 0.85);
    nextBg.fillCircle(this.nextBubbleX, this.nextBubbleY, 36);
    nextBg.lineStyle(2, 0x00ffff, 0.8);
    nextBg.strokeCircle(this.nextBubbleX, this.nextBubbleY, 36);
    nextBg.lineStyle(4, 0x00ffff, 0.3);
    nextBg.strokeCircle(this.nextBubbleX, this.nextBubbleY, 38);

    candyText(this, this.nextBubbleX, this.nextBubbleY + 48, 'NEXT', 12, '#00ffff', 103);

    this.nextShooterSprite = this.add
      .image(this.nextBubbleX, this.nextBubbleY, this.neonTexKey(this.shooter.nextColor))
      .setDisplaySize(BUBBLE_DIAMETER * 0.72, BUBBLE_DIAMETER * 0.72)
      .setDepth(105)
      .setInteractive({ useHandCursor: true });

    const midX = (this.shooter.x + this.nextBubbleX) / 2 + 8;
    const arrow = this.add.graphics().setDepth(105);
    arrow.lineStyle(3, 0xff00ff, 1);
    arrow.beginPath();
    arrow.moveTo(midX + 10, this.nextBubbleY - 28);
    arrow.lineTo(midX - 10, this.nextBubbleY - 28);
    arrow.lineTo(midX - 2, this.nextBubbleY - 36);
    arrow.moveTo(midX - 10, this.nextBubbleY - 28);
    arrow.lineTo(midX - 2, this.nextBubbleY - 20);
    arrow.strokePath();
  }

  private swapBubbles() {
    if (this.gameState !== 'PLAYING' || this.shooter.isShooting || this.isGameOver || this.isPaused) return;
    playClick(this);
    this.shooter.swap();
    this.shooterSprite.setTexture(this.neonTexKey(this.shooter.activeColor));
    this.nextShooterSprite.setTexture(this.neonTexKey(this.shooter.nextColor));
  }

  private togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.showPauseMenu();
    } else {
      this.physics.resume();
      this.hidePauseMenu();
    }
  }

  private createAimFx() {
    for (let i = 0; i < 28; i++) {
      this.aimDots.push(
        this.add.circle(0, 0, 8, 0xffffff, 1).setVisible(false).setDepth(40),
      );
    }
    this.aimCursor = this.add.circle(0, 0, 21, 0xffffff, 0).setStrokeStyle(3, 0xffffff, 1).setVisible(false).setDepth(41);
    this.aimArrow = this.add.triangle(0, 0, 0, 18, 18, 18, 9, 0, 0xffffff, 1).setVisible(false).setDepth(42);
  }

  private showOverlay(title: string) {
    const group = this.add.group();
    const { dim, panel } = addNeonPanel(this, 440, 560, 400);
    const titleText = candyText(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 190, title, 40, '#ffffff', 402);
    group.addMultiple([dim, panel, titleText]);
    return group;
  }

  private showPauseMenu() {
    this.pauseGroup = this.showOverlay('PAUSED');
    const resume = addNeonButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 40, 'RESUME', () => this.togglePause(), 300, 86, 410);
    const restart = addNeonButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 56, 'RESTART', () => {
      this.scene.restart({ currentLevel: this.currentLevel, score: 0 });
    }, 300, 86, 410, 0xff00ff);
    const home = addNeonButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 152, 'HOME', () => {
      this.scene.start('MenuScene');
    }, 300, 86, 410, 0x00ffff);
    this.pauseGroup.addMultiple([resume, restart, home]);
  }

  private hidePauseMenu() {
    if (this.pauseGroup) {
      this.pauseGroup.destroy(true);
      this.pauseGroup = null;
    }
  }

  update(_time: number, delta: number) {
    if (this.isGameOver || this.isPaused) return;
    if (this.gameState === 'PLAYING') this.drawTrajectory();

    if (this.gameState === 'PROJECTILE_MOVING' && this.shooter.isShooting) {
      const collided = this.shooter.update(delta, this.grid);
      if (this.projectileSprite) {
        this.projectileSprite.setPosition(this.shooter.projectileX, this.shooter.projectileY);
        this.updateProjectileTrail();
      }
      if (collided) {
        this.gameState = 'RESOLVING';
        this.doImpactFlash(this.shooter.projectileX, this.shooter.projectileY, this.shooter.activeColor);
        const generation = this.sceneGeneration;
        void this.handleCollision(generation).catch(() => {
          if (generation !== this.sceneGeneration) return;
          this.gameState = 'GAME_OVER';
          this.triggerGameOver('Resolution error');
        });
      }
    }
  }

  private doImpactFlash(x: number, y: number, color: BubbleColor) {
    const hex = this.neonHex(color);
    const flash = this.add.circle(x, y, BUBBLE_RADIUS * 1.5, hex, 0.6).setDepth(51).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 200, onComplete: () => flash.destroy() });
  }

  private drawTrajectory() {
    this.aimingLine.clear();
    this.aimDots.forEach((dot) => dot.setVisible(false));
    this.aimCursor.setVisible(false);
    this.aimArrow.setVisible(false);
    if (this.gameState !== 'PLAYING' || this.shooter.isShooting || this.projectileSprite) return;

    const pointer = this.input.activePointer;
    const hasAimPointer = pointer.x > 0 && pointer.y > 0;
    const pointerX = hasAimPointer ? pointer.x : this.shooter.x;
    const pointerY = hasAimPointer ? pointer.y : this.shooter.y - 160;
    if (pointerY >= this.shooter.y || pointerY < 88) return;
    if (this.isSwapTarget(pointerX, pointerY)) return;

    const dx = pointerX - this.shooter.x;
    const dy = pointerY - this.shooter.y;
    const angle = Math.atan2(dy, dx);
    const tint = this.neonHex(this.shooter.activeColor);

    let currX = this.shooter.x;
    let currY = this.shooter.y;
    let vX = Math.cos(angle);
    let vY = Math.sin(angle);

    const step = 12;
    let maxSteps = 72;
    const leftWall = GRID_OFFSET_X - BUBBLE_RADIUS;
    const rightWall = GRID_OFFSET_X - BUBBLE_RADIUS + BOARD_WIDTH_BUBBLES * BUBBLE_DIAMETER;
    let lastX = currX;
    let lastY = currY;
    let lastAngle = angle;

    while (maxSteps > 0) {
      currX += vX * step;
      currY += vY * step;
      if (currX - BUBBLE_RADIUS <= leftWall) { currX = leftWall + BUBBLE_RADIUS; vX *= -1; }
      else if (currX + BUBBLE_RADIUS >= rightWall) { currX = rightWall - BUBBLE_RADIUS; vX *= -1; }

      lastAngle = Math.atan2(vY, vX);
      const gridPos = GridMath.getGridCoordinates(currX, currY);
      if (currY <= GRID_OFFSET_Y || this.grid.hasBubble(gridPos.row, gridPos.col)) {
        this.placeAimTip(currX, currY, lastAngle, tint);
        break;
      }

      const pathIndex = 72 - maxSteps;
      this.aimingLine.fillStyle(tint, Math.max(0.25, 0.9 - pathIndex / 100));
      this.aimingLine.fillCircle(currX, currY, 3.2);

      const dot = this.aimDots[pathIndex];
      if (dot) {
        const scale = 0.5 + (pathIndex % 4) * 0.08;
        dot.setPosition(currX, currY).setScale(scale).setFillStyle(tint, 1).setVisible(true);
      }
      lastX = currX;
      lastY = currY;
      maxSteps--;
    }

    if (!this.aimArrow.visible) {
      this.placeAimTip(lastX, lastY, lastAngle, tint);
    }
  }

  private placeAimTip(x: number, y: number, angle: number, tint: number) {
    this.aimCursor.setPosition(x, y).setStrokeStyle(3, tint, 1).setVisible(true);
    this.aimArrow
      .setPosition(x + Math.cos(angle) * 18, y + Math.sin(angle) * 18)
      .setRotation(angle + Math.PI/2).setFillStyle(tint, 1).setVisible(true);
  }

  private isSwapTarget(x: number, y: number) {
    return (
      Phaser.Math.Distance.Between(x, y, this.shooter.x, this.shooter.y) <= 52 ||
      Phaser.Math.Distance.Between(x, y, this.nextBubbleX, this.nextBubbleY) <= 44
    );
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.gameState !== 'PLAYING' || this.isGameOver || this.isPaused || this.shooter.isShooting) return;
    if (this.isSwapTarget(pointer.x, pointer.y)) { this.swapBubbles(); return; }
    if (pointer.y >= this.shooter.y || pointer.y < 88) return;
    if (this.shooter.shotsRemaining <= 0) return;

    this.shooter.shoot(pointer.x, pointer.y);
    this.gameState = 'PROJECTILE_MOVING';
    this.hud.updateShots(this.shooter.shotsRemaining);
    audioManager.playSFX('whoosh');
    this.aimDots.forEach((dot) => dot.setVisible(false));
    this.aimingLine.clear();
    this.aimCursor.setVisible(false);
    this.aimArrow.setVisible(false);

    this.projectileSprite = this.add
      .image(this.shooter.projectileX, this.shooter.projectileY, this.neonTexKey(this.shooter.activeColor))
      .setDisplaySize(BUBBLE_DIAMETER, BUBBLE_DIAMETER)
      .setDepth(50);

    this.createProjectileTrail();

    // Launcher recoil
    const recoilAngle = this.shooter.projectileAngle;
    const recoilDist = 6;
    this.tweens.add({
      targets: [this.shooterSprite, this.shooterHalo],
      x: this.shooter.x - Math.cos(recoilAngle) * recoilDist,
      y: this.shooter.y - Math.sin(recoilAngle) * recoilDist,
      duration: 60,
      yoyo: true,
      ease: 'Quad.Out',
    });

    this.shooterSprite.setVisible(false);
    this.shooterHalo.setVisible(false);
  }

  private createProjectileTrail() {
    this.projectileTrail.forEach((trail) => trail.destroy());
    const hex = this.neonHex(this.shooter.activeColor);
    this.projectileTrail = Array.from({ length: 6 }, (_, index) =>
      this.add.circle(
        this.shooter.projectileX, this.shooter.projectileY,
        BUBBLE_RADIUS * (0.38 - index * 0.05), hex, 0.4 - index * 0.06,
      ).setDepth(49).setBlendMode(Phaser.BlendModes.ADD),
    );
  }

  private updateProjectileTrail() {
    this.projectileTrail.forEach((trail, index) => {
      const offset = (index + 1) * 6;
      trail.setPosition(
        this.shooter.projectileX - Math.cos(this.shooter.projectileAngle) * offset,
        this.shooter.projectileY - Math.sin(this.shooter.projectileAngle) * offset,
      );
    });
  }

  private async handleCollision(generation: number) {
    audioManager.playSFX('impact');
    const snapPos = this.grid.getNearestEmptyCell(this.shooter.projectileX, this.shooter.projectileY);

    const newBubble: BubbleData = {
      id: `b_shot_${Date.now()}`,
      color: this.shooter.activeColor,
      row: snapPos.row,
      col: snapPos.col,
      active: true,
    };
    this.grid.addBubble(newBubble);

    const pixelPos = GridMath.getPixelCoordinates(snapPos.row, snapPos.col);
    const sprite = this.projectileSprite!;
    sprite.setPosition(pixelPos.x, pixelPos.y).setDepth(10);
    this.bubbleSprites.set(newBubble.id, sprite);
    this.projectileSprite = null;
    this.projectileTrail.forEach((trail) => trail.destroy());
    this.projectileTrail = [];

    // Neighbor bounce
    const neighbors = GridMath.getNeighbors(snapPos.row, snapPos.col);
    neighbors.forEach((n) => {
      const neighborSprite = this.bubbleSprites.get(BubbleGrid.getKeyFromPos(n));
      if (neighborSprite) {
        const origY = neighborSprite.y;
        this.tweens.add({ targets: neighborSprite, y: origY - 4, yoyo: true, duration: 80, ease: 'Sine.easeInOut' });
      }
    });

    const matches = MatchFinder.findMatchingCluster(this.grid, snapPos.row, snapPos.col);

    if (matches.length >= 3) {
      await this.popBubbles(matches);
      if (generation !== this.sceneGeneration) return;
      const floaters = FloatingBubbleFinder.findFloatingBubbles(this.grid);
      if (floaters.length > 0) {
        await this.dropBubbles(floaters);
        if (generation !== this.sceneGeneration) return;
      }
    }

    const lowestRow = this.grid.getLowestBubbleRow();
    if (lowestRow !== -1) {
      const lowestY = GridMath.getPixelCoordinates(lowestRow, 0).y;
      if (lowestY + BUBBLE_RADIUS >= this.deathLineY) {
        this.triggerGameOver('TOO CLOSE!');
        return;
      }
    }

    if (this.grid.getAllBubbles().length === 0) {
      await this.triggerLevelCleared();
      return;
    }

    this.shooter.setPalette(this.colorsInPlay());
    this.shooter.reload();
    this.shooterSprite.setTexture(this.neonTexKey(this.shooter.activeColor));
    this.shooterSprite.setVisible(true);
    this.shooterHalo.setVisible(true);
    this.nextShooterSprite.setTexture(this.neonTexKey(this.shooter.nextColor));
    this.checkGameOver();
    if (!this.isGameOver) this.gameState = 'PLAYING';
  }

  private async popBubbles(bubbles: BubbleData[]) {
    if (bubbles.length > 0) {
      audioManager.playSFX('pop_neon');
    }

    // Phase 1: pulse & glow (200ms)
    const pulsePromises: Promise<void>[] = [];
    bubbles.forEach((b) => {
      const sprite = this.bubbleSprites.get(b.id);
      if (sprite) {
        pulsePromises.push(new Promise((resolve) => {
          this.tweens.add({
            targets: sprite,
            scaleX: sprite.scaleX * 1.25,
            scaleY: sprite.scaleY * 1.25,
            duration: 200,
            ease: 'Quad.Out',
            onComplete: () => resolve(),
          });
        }));
      }
    });
    await Promise.all(pulsePromises);

    // Phase 2: flash + particles + floating score + disappear
    const popPromises: Promise<void>[] = [];
    const scorePerBubble = 10;
    bubbles.forEach((b, i) => {
      this.grid.removeBubble(b.row, b.col);
      const sprite = this.bubbleSprites.get(b.id);
      if (sprite) {
        const hex = this.neonHex(b.color);

        // Flash
        const flash = this.add.circle(sprite.x, sprite.y, BUBBLE_RADIUS * 1.2, 0xffffff, 0.8)
          .setDepth(51).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 150, onComplete: () => flash.destroy() });

        // Particles
        const emitter = this.add.particles(sprite.x, sprite.y, 'neon_particle', {
          speed: { min: 60, max: 180 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: hex,
          lifespan: 450,
          quantity: 12,
          blendMode: 'ADD',
          emitting: false,
        });
        emitter.setDepth(52);
        emitter.explode(12);
        this.time.delayedCall(500, () => emitter.destroy());

        // Floating score
        if (i === 0) {
          const totalScore = bubbles.length * scorePerBubble;
          const floatText = this.add.text(sprite.x, sprite.y - 10, `+${totalScore}`, {
            fontFamily: '"Orbitron", sans-serif', fontSize: '22px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(55).setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: floatText, y: floatText.y - 50, alpha: 0, duration: 800, delay: 100, onComplete: () => floatText.destroy() });
        }

        // Pop animation
        this.tweens.add({
          targets: sprite,
          scaleX: sprite.scaleX * 1.4,
          scaleY: sprite.scaleY * 1.4,
          alpha: 0,
          duration: 150,
          onComplete: () => sprite.destroy(),
        });
        popPromises.push(new Promise((resolve) => this.time.delayedCall(500, resolve)));
        this.bubbleSprites.delete(b.id);
      }
    });
    this.score += bubbles.length * scorePerBubble;
    this.hud.updateScore(this.score);
    await Promise.all(popPromises);
  }

  private async dropBubbles(bubbles: BubbleData[]) {
    if (bubbles.length > 0) {
      audioManager.playSFX('cascade');
    }
    const animations: Promise<void>[] = [];
    bubbles.forEach((b) => {
      this.grid.removeBubble(b.row, b.col);
      const sprite = this.bubbleSprites.get(b.id);
      if (sprite) {
        const hex = this.neonHex(b.color);

        this.physics.world.enable(sprite);
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setBounce(0.5, 0.5);
        body.setGravityY(1000 + Phaser.Math.Between(-100, 100));
        body.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-50, 50));
        body.setAngularVelocity(Phaser.Math.Between(-300, 300));

        // Glow while falling
        const glow = this.add.circle(sprite.x, sprite.y, BUBBLE_RADIUS * 0.8, hex, 0.3)
          .setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: glow, alpha: 0, duration: 1800, delay: 700,
          onUpdate: () => glow.setPosition(sprite.x, sprite.y),
          onComplete: () => {
            // Small particle burst on disappear
            const emitter = this.add.particles(sprite.x, sprite.y, 'neon_particle', {
              speed: { min: 30, max: 80 }, angle: { min: 0, max: 360 },
              scale: { start: 0.8, end: 0 }, alpha: { start: 0.8, end: 0 },
              tint: hex, lifespan: 300, quantity: 6, blendMode: 'ADD', emitting: false,
            });
            emitter.setDepth(50); emitter.explode(6);
            this.time.delayedCall(400, () => emitter.destroy());
            glow.destroy();
          },
        });

        this.tweens.add({
          targets: sprite, alpha: 0, duration: 1000, delay: 1500,
          onComplete: () => sprite.destroy(),
        });
        animations.push(new Promise((resolve) => this.time.delayedCall(2500, resolve)));
        this.bubbleSprites.delete(b.id);
      }
    });
    this.score += bubbles.length * 20;
    this.hud.updateScore(this.score);
    await Promise.all(animations);
  }

  private checkGameOver() {
    const bubbles = this.grid.getAllBubbles();
    if (bubbles.length === 0) {
      this.triggerLevelCleared();
      return;
    }
    if (this.shooter.shotsRemaining <= 0) {
      this.triggerGameOver('OUT OF SHOTS');
      return;
    }
    const lowestThreshold = this.shooter.y - BUBBLE_DIAMETER;
    for (const b of bubbles) {
      const p = GridMath.getPixelCoordinates(b.row, b.col);
      if (p.y >= lowestThreshold) {
        this.triggerGameOver('TOO CLOSE!');
        return;
      }
    }
  }

  private calculateStars(): number {
    const pct = this.shooter.shotsRemaining / this.maxShots;
    if (pct >= this.starThresholds.threeStars) return 3;
    if (pct >= this.starThresholds.twoStars) return 2;
    return 1;
  }

  private async triggerLevelCleared() {
    if (this.gameState === 'LEVEL_COMPLETE') return;
    this.gameState = 'LEVEL_COMPLETE';
    this.isGameOver = true;

    const nextLevel = this.levelManager.completeLevel();
    const hasNextLevel = this.currentLevel < MAX_LEVEL;
    if (hasNextLevel) {
      SaveSystem.unlockLevel(nextLevel);
      SaveSystem.setCurrentLevel(nextLevel);
    } else {
      SaveSystem.setCurrentLevel(MAX_LEVEL);
    }

    const stars = this.calculateStars();
    SaveSystem.setStarRating(this.currentLevel, stars);

    // Neon particle burst
    const burstEmitter = this.add.particles(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 'neon_particle', {
      speed: { min: 100, max: 350 }, angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 },
      tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00],
      lifespan: 800, quantity: 40, blendMode: 'ADD', emitting: false,
    });
    burstEmitter.setDepth(450);
    burstEmitter.explode(40);
    this.time.delayedCall(900, () => burstEmitter.destroy());

    // Screen flash and shake
    const screenFlash = this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, BOARD_WIDTH, BOARD_HEIGHT, 0xffffff, 0.3)
      .setDepth(449).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: screenFlash, alpha: 0, duration: 400, onComplete: () => screenFlash.destroy() });
    this.cameras.main.shake(300, 0.01);
    audioManager.playSFX('burst');

    await new Promise<void>((resolve) => this.time.delayedCall(500, resolve));

    // LEVEL COMPLETE text
    audioManager.playSFX('victory');
    const title = candyText(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 130, 'LEVEL COMPLETE', 36, '#00ffff', 452);
    this.tweens.add({ targets: title, scale: 1.1, duration: 300, ease: 'Back.Out' });

    // Fireworks around the UI
    const fwColors = [0x00ffff, 0x0088ff, 0xaa44ff, 0xff00ff, 0xffdd44];
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(200 + i * 350, () => {
        const fx = BOARD_WIDTH / 2 + Phaser.Math.Between(-150, 150);
        const fy = BOARD_HEIGHT / 2 + Phaser.Math.Between(-200, 100);
        const fwEmit = this.add.particles(fx, fy, 'neon_particle', {
          speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
          scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
          tint: fwColors[Phaser.Math.Between(0, fwColors.length - 1)],
          lifespan: 600, quantity: 20, blendMode: 'ADD', emitting: false,
        }).setDepth(451);
        fwEmit.explode(20);
        audioManager.playSFX('impact');
        this.time.delayedCall(800, () => fwEmit.destroy());
      });
    }

    await new Promise<void>((resolve) => this.time.delayedCall(400, resolve));

    // Score
    const bonus = this.currentLevel * 100;
    const scoreText = candyText(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 60, `SCORE ${this.score + bonus}`, 26, '#ff00ff', 452);
    this.score += bonus;
    this.hud.updateScore(this.score);

    await new Promise<void>((resolve) => this.time.delayedCall(300, resolve));

    // Star animation
    const starY = BOARD_HEIGHT / 2 + 20;
    const starSpacing = 70;
    const starStartX = BOARD_WIDTH / 2 - starSpacing;

    for (let i = 0; i < 3; i++) {
      const sx = starStartX + i * starSpacing;
      const emptyKey = 'neon_star_empty';
      const filledKey = 'neon_star';
      const isEarned = i < stars;

      const starImg = this.add.image(sx, starY, emptyKey).setDisplaySize(48, 48).setDepth(453).setScale(0);
      this.tweens.add({
        targets: starImg, scale: 1, angle: 360, duration: 400, delay: i * 250,
        ease: 'Back.Out',
        onComplete: () => {
          if (isEarned) {
            starImg.setTexture(filledKey);
            audioManager.playSFX('victory');
            this.tweens.add({
              targets: starImg, scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true, ease: 'Quad.Out',
            });
            
            // Expanding energy ring
            const ring = this.add.circle(sx, starY, 20, 0xffdd44, 0).setDepth(452);
            ring.setStrokeStyle(4, 0xffdd44, 1);
            this.tweens.add({
              targets: ring, radius: 60, alpha: 0, duration: 400, ease: 'Cubic.Out',
              onComplete: () => ring.destroy()
            });

            // Star particle burst
            const sEmitter = this.add.particles(sx, starY, 'neon_particle', {
              speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
              scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 },
              tint: 0xffdd44, lifespan: 500, quantity: 12, blendMode: 'ADD', emitting: false,
            });
            sEmitter.setDepth(454);
            sEmitter.explode(12);
            this.time.delayedCall(600, () => sEmitter.destroy());
          }
        },
      });
    }

    // Wait for star animation to finish
    await new Promise<void>((resolve) => this.time.delayedCall(3 * 250 + 500, resolve));

    // Fade out everything
    this.bubbleSprites.forEach((s) => {
      this.tweens.add({ targets: s, alpha: 0, scale: 0.7, duration: 500 });
    });
    await new Promise<void>((resolve) => this.time.delayedCall(600, resolve));

    // Destroy texts
    title.destroy();
    scoreText.destroy();

    // Auto-transition to next level
    if (hasNextLevel) {
      this.scene.restart({ currentLevel: nextLevel, score: this.score });
    } else {
      this.triggerGameOver('YOU WON!');
    }
  }

  private triggerGameOver(msg: string) {
    this.isGameOver = true;
    this.showOverlay(msg);
    const restart = addNeonButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 36, 'TRY AGAIN', () => {
      this.scene.restart({ currentLevel: this.currentLevel, score: 0 });
    }, 300, 86, 410, 0x00ffff);
    const home = addNeonButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 132, 'HOME', () => {
      this.scene.start('MenuScene');
    }, 300, 86, 410, 0xff00ff);
  }

  private renderGrid() {
    const bubbles = this.grid.getAllBubbles();
    bubbles.forEach((b) => {
      const pos = GridMath.getPixelCoordinates(b.row, b.col);
      const sprite = this.add
        .image(pos.x, pos.y, this.neonTexKey(b.color))
        .setDisplaySize(BUBBLE_DIAMETER, BUBBLE_DIAMETER)
        .setDepth(10);
      this.bubbleSprites.set(b.id, sprite);

      // Subtle Idle pulse
      this.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.02,
        scaleY: sprite.scaleY * 1.02,
        alpha: 0.9,
        yoyo: true,
        repeat: -1,
        duration: 1500 + Phaser.Math.Between(-300, 300),
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 800),
      });
    });
  }
}
