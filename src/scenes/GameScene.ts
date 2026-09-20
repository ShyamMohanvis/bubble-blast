import Phaser from 'phaser';
import { BUBBLE_RADIUS, BUBBLE_DIAMETER, BOARD_WIDTH, BOARD_HEIGHT, SHOOTER_X, SHOOTER_Y, GRID_OFFSET_Y, GRID_OFFSET_X, BOARD_WIDTH_BUBBLES, type BubbleColor } from '../config/constants';
import { Level, type LevelConfig } from '../game/Level';
import { BubbleGrid, type BubbleData } from '../game/BubbleGrid';
import { Shooter } from '../game/Shooter';
import { GridMath } from '../algorithms/GridMath';
import { MatchFinder } from '../algorithms/MatchFinder';
import { FloatingBubbleFinder } from '../algorithms/FloatingBubbleFinder';
import { HUD } from '../ui/HUD';
import { SaveSystem } from '../systems/SaveSystem';

export default class GameScene extends Phaser.Scene {
  private grid!: BubbleGrid;
  private shooter!: Shooter;
  private hud!: HUD;
  
  // Visuals
  private bubbleSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private shooterSprite!: Phaser.GameObjects.Sprite;
  private nextShooterSprite!: Phaser.GameObjects.Sprite;
  private projectileSprite: Phaser.GameObjects.Sprite | null = null;
  private aimingLine!: Phaser.GameObjects.Graphics;
  
  // Shooter UI
  private shooterHalo!: Phaser.GameObjects.Graphics;
  
  private score: number = 0;
  private currentLevel: number = 1;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private deathLineY!: number;

  private colorHexMap: Record<BubbleColor, number> = {
    blue: 0x1e90ff,
    orange: 0xff8c00,
    green: 0x32cd32,
    purple: 0x9370db,
    red: 0xff4500,
    yellow: 0xffd700
  };

  constructor() {
    super('GameScene');
  }

  init(data: { currentLevel?: number, score?: number }) {
    this.currentLevel = data.currentLevel || 1;
    this.score = data.score || 0;
    this.isGameOver = false;
  }

  preload() {
    const base = import.meta.env.BASE_URL;
    
    // Load all 10 level configurations
    for (let i = 1; i <= 10; i++) {
      this.load.json(`level-${i}`, `${base}levels/level-00${i}.json`);
    }

    // Load authentic assets
    const colors = ['blue', 'orange', 'green', 'purple', 'red', 'yellow'];
    for (const color of colors) {
      const fileName = color.charAt(0).toUpperCase() + color.slice(1) + '.png';
      this.load.image(`bubble_${color}`, `${base}assets/${fileName}`);
    }
    
    // Load sounds
    this.load.audio('pop', `${base}assets/audio/destroy.wav`);
    this.load.audio('shoot', `${base}assets/audio/explosion.wav`);
    
    // Load particle texture
    const graphics = this.make.graphics({x: 0, y: 0});
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }

  create() {
    this.drawPremiumBackground();

    // Setup HUD and Sounds
    this.sound.mute = !SaveSystem.getSoundEnabled();
    this.hud = new HUD(this, this.currentLevel);
    this.hud.updateScore(this.score);
    
    // Hook up HUD buttons
    this.hud.onHomeClicked = () => {
      if (!this.isGameOver) this.scene.start('MenuScene');
    };
    
    this.hud.onPauseClicked = () => this.togglePause();
    
    this.hud.onSoundClicked = () => {
      const newState = SaveSystem.toggleSound();
      this.sound.mute = !newState;
      return !newState; // return isMuted
    };
    // 3. Generate better textures (removed - using authentic assets)
    
    // 4. Initialize Core Logic
    const levelConfig: LevelConfig = this.cache.json.get(`level-${this.currentLevel}`);
    const level = new Level();
    this.grid = level.createGrid(levelConfig);
    this.shooter = new Shooter(SHOOTER_X, SHOOTER_Y - 20); // slightly higher to fit bottom bar
    
    // Give more shots for higher levels
    this.shooter.shotsRemaining = 20 + (this.currentLevel * 5);

    // 5. Initial render
    this.renderGrid();
    
    this.aimingLine = this.add.graphics();
    
    // 6. Shooter Visuals
    this.createShooterUI();
    
    // Draw visual death line
    this.deathLineY = SHOOTER_Y - BUBBLE_RADIUS * 3;
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff0000, 0.4); // faint red line
    graphics.beginPath();
    graphics.moveTo(0, this.deathLineY);
    graphics.lineTo(BOARD_WIDTH, this.deathLineY);
    graphics.strokePath();

    // 7. Input
    this.input.on('pointerup', this.handlePointerUp, this);
  }

  private drawPremiumBackground() {
    const bg = this.add.graphics();
    // Deep space purple background
    bg.fillGradientStyle(0x330066, 0x330066, 0x1a0033, 0x1a0033, 1);
    bg.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    const leftWall = GRID_OFFSET_X - BUBBLE_RADIUS;
    const rightWall = GRID_OFFSET_X - BUBBLE_RADIUS + (BOARD_WIDTH_BUBBLES * BUBBLE_DIAMETER);

    // Dark translucent side borders outside the grid
    bg.fillStyle(0x000000, 0.3);
    bg.fillRect(0, 0, leftWall, BOARD_HEIGHT);
    bg.fillRect(rightWall, 0, BOARD_WIDTH - rightWall, BOARD_HEIGHT);
    
    // Cyan glow borders for the playable area
    bg.lineStyle(2, 0x3ae2ce, 0.5);
    bg.beginPath();
    bg.moveTo(leftWall, 60); // below top bar
    bg.lineTo(leftWall, BOARD_HEIGHT);
    bg.moveTo(rightWall, 60);
    bg.lineTo(rightWall, BOARD_HEIGHT);
    bg.strokePath();
  }

  private createShooterUI() {
    // Glowing halo
    this.shooterHalo = this.add.graphics().setDepth(104);
    this.shooterHalo.setPosition(this.shooter.x, this.shooter.y);
    
    this.tweens.add({
      targets: this.shooterHalo,
      alpha: 0.2,
      scaleX: 1.1,
      scaleY: 1.1,
      yoyo: true,
      repeat: -1,
      duration: 800
    });
    this.updateHaloColor();

    this.shooterSprite = this.add.sprite(this.shooter.x, this.shooter.y, `bubble_${this.shooter.activeColor}`)
      .setDisplaySize(BUBBLE_DIAMETER, BUBBLE_DIAMETER)
      .setDepth(105);
    
    // Position Next Bubble and Swap button
    const nextBubbleX = this.shooter.x + 80;
    const nextBubbleY = this.shooter.y + 5;
    
    // Next Bubble Base (Cyan circle)
    this.add.graphics()
      .fillStyle(0x1a0b2e, 1) // match bottom bar
      .lineStyle(2, 0x3ae2ce, 1) // cyan border
      .fillCircle(nextBubbleX, nextBubbleY, BUBBLE_RADIUS * 0.8)
      .strokeCircle(nextBubbleX, nextBubbleY, BUBBLE_RADIUS * 0.8)
      .setDepth(104);
      
    this.nextShooterSprite = this.add.sprite(nextBubbleX, nextBubbleY, `bubble_${this.shooter.nextColor}`)
      .setDisplaySize(BUBBLE_DIAMETER * 0.7, BUBBLE_DIAMETER * 0.7)
      .setDepth(105);
    this.updateNextBubbleDisplay();

    // Swap Button (Far right)
    const swapX = nextBubbleX + 45;
    const swapY = nextBubbleY;

    this.add.graphics()
      .fillStyle(0xff44aa, 1) // Pinkish button like screenshot
      .fillCircle(swapX, swapY, 15)
      .lineStyle(2, 0x1a0b2e, 1)
      .strokeCircle(swapX, swapY, 15)
      .setDepth(104);
      
    // Swap icon
    this.add.text(swapX, swapY, '🔄', { fontSize: '14px' }).setOrigin(0.5).setDepth(105);

    // Invisible hit area for easier clicking on Swap
    this.add.circle(swapX, swapY, 25, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.swapBubbles())
      .setDepth(106);
  }

  private updateHaloColor() {
    this.shooterHalo.clear();
    const hexColor = this.colorHexMap[this.shooter.activeColor];
    this.shooterHalo.lineStyle(6, hexColor, 0.6);
    this.shooterHalo.strokeCircle(0, 0, BUBBLE_RADIUS + 5);
  }

  private swapBubbles() {
    if (this.shooter.isShooting || this.isGameOver) return;
    this.shooter.swap();
    this.shooterSprite.setTexture(`bubble_${this.shooter.activeColor}`);
    this.updateNextBubbleDisplay();
    this.updateHaloColor();
  }

  private updateNextBubbleDisplay() {
    this.nextShooterSprite.setTexture(`bubble_${this.shooter.nextColor}`);
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

  private pauseGroup: Phaser.GameObjects.Group | null = null;

  private showPauseMenu() {
    this.pauseGroup = this.add.group();
    
    const bg = this.add.rectangle(BOARD_WIDTH/2, BOARD_HEIGHT/2, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.8).setDepth(300);
    this.pauseGroup.add(bg);

    const title = this.add.text(BOARD_WIDTH/2, BOARD_HEIGHT/2 - 120, 'PAUSED', { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
    this.pauseGroup.add(title);

    // Resume
    const resumeBtn = this.createMenuButton(BOARD_WIDTH/2, BOARD_HEIGHT/2 - 40, 'Resume', () => this.togglePause());
    this.pauseGroup.addMultiple(resumeBtn);

    // Restart
    const restartBtn = this.createMenuButton(BOARD_WIDTH/2, BOARD_HEIGHT/2 + 20, 'Restart Level', () => {
      this.scene.restart({ currentLevel: this.currentLevel, score: 0 });
    });
    this.pauseGroup.addMultiple(restartBtn);

    // Sound
    const soundState = SaveSystem.getSoundEnabled();
    const soundBtn = this.createMenuButton(BOARD_WIDTH/2, BOARD_HEIGHT/2 + 80, `Sound: ${soundState ? 'ON' : 'OFF'}`, undefined);
    
    // We hack the sound button click
    const soundHit = soundBtn[0] as Phaser.GameObjects.Rectangle;
    const soundText = soundBtn[2] as Phaser.GameObjects.Text;
    soundHit.on('pointerdown', () => {
      const newState = SaveSystem.toggleSound();
      this.sound.mute = !newState;
      soundText.setText(`Sound: ${newState ? 'ON' : 'OFF'}`);
    });
    this.pauseGroup.addMultiple(soundBtn);

    // Home
    const homeBtn = this.createMenuButton(BOARD_WIDTH/2, BOARD_HEIGHT/2 + 140, 'Home', () => {
      this.scene.start('MenuScene');
    });
    this.pauseGroup.addMultiple(homeBtn);
  }

  private hidePauseMenu() {
    if (this.pauseGroup) {
      this.pauseGroup.destroy(true);
      this.pauseGroup = null;
    }
  }

  private createMenuButton(x: number, y: number, text: string, onClick?: () => void): Phaser.GameObjects.GameObject[] {
    const bg = this.add.graphics()
      .fillStyle(0x32cd32, 1)
      .fillRoundedRect(x - 100, y - 20, 200, 40, 10)
      .setDepth(301);
    const txt = this.add.text(x, y, text, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setDepth(302);
    
    const hitArea = this.add.rectangle(x, y, 200, 40, 0, 0).setDepth(303).setInteractive({ useHandCursor: true });
    if (onClick) {
      hitArea.on('pointerdown', onClick);
    }

    return [hitArea, bg, txt];
  }

  update(time: number, delta: number) {
    if (this.isGameOver || this.isPaused) return;

    this.drawTrajectory();

    if (this.shooter.isShooting) {
      const collided = this.shooter.update(delta, this.grid);
      
      if (this.projectileSprite) {
        this.projectileSprite.setPosition(this.shooter.projectileX, this.shooter.projectileY);
      }

      if (collided) {
        this.handleCollision();
      }
    }
  }

  private drawTrajectory() {
    this.aimingLine.clear();
    if (this.shooter.isShooting) return;

    const pointer = this.input.activePointer;
    if (pointer.y >= this.shooter.y) return; // Don't shoot downwards

    const dx = pointer.x - this.shooter.x;
    const dy = pointer.y - this.shooter.y;
    const angle = Math.atan2(dy, dx);
    
    let currX = this.shooter.x;
    let currY = this.shooter.y;
    let vX = Math.cos(angle);
    let vY = Math.sin(angle);
    
    const step = 25; // Spacing between dots
    let maxSteps = 40;
    
    const trajColor = this.colorHexMap[this.shooter.activeColor];
    
    const leftWall = GRID_OFFSET_X - BUBBLE_RADIUS;
    const rightWall = GRID_OFFSET_X - BUBBLE_RADIUS + (BOARD_WIDTH_BUBBLES * BUBBLE_DIAMETER);
    
    while (maxSteps > 0) {
      currX += vX * step;
      currY += vY * step;

      if (currX - BUBBLE_RADIUS <= leftWall) {
        currX = leftWall + BUBBLE_RADIUS;
        vX *= -1;
      } else if (currX + BUBBLE_RADIUS >= rightWall) {
        currX = rightWall - BUBBLE_RADIUS;
        vX *= -1;
      }

      const gridPos = GridMath.getGridCoordinates(currX, currY);
      if (currY <= GRID_OFFSET_Y || this.grid.hasBubble(gridPos.row, gridPos.col)) {
        // Target ring
        this.aimingLine.lineStyle(3, trajColor, 1);
        this.aimingLine.strokeCircle(currX, currY, BUBBLE_RADIUS);
        break;
      }

      // Colored dot with white center
      this.aimingLine.fillStyle(trajColor, 1);
      this.aimingLine.fillCircle(currX, currY, 4);
      this.aimingLine.fillStyle(0xffffff, 1);
      this.aimingLine.fillCircle(currX, currY, 2);
      
      maxSteps--;
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.isGameOver || this.isPaused || this.shooter.isShooting) return;
    if (pointer.y >= this.shooter.y) return; // clicking bottom bar

    if (this.shooter.shotsRemaining <= 0) return;

    this.shooter.shoot(pointer.x, pointer.y);
    
    this.sound.play('shoot', { volume: 0.5 });
    
    this.projectileSprite = this.add.sprite(
      this.shooter.projectileX, 
      this.shooter.projectileY, 
      `bubble_${this.shooter.activeColor}`
    ).setDisplaySize(BUBBLE_DIAMETER, BUBBLE_DIAMETER);
    
    this.shooterSprite.setVisible(false);
    this.shooterHalo.setVisible(false);
  }



  private handleCollision() {
    const snapPos = this.grid.getNearestEmptyCell(this.shooter.projectileX, this.shooter.projectileY);
    
    const newBubble: BubbleData = {
      id: `b_shot_${Date.now()}`,
      color: this.shooter.activeColor,
      row: snapPos.row,
      col: snapPos.col,
      active: true
    };
    this.grid.addBubble(newBubble);

    const pixelPos = GridMath.getPixelCoordinates(snapPos.row, snapPos.col);
    const sprite = this.projectileSprite!;
    sprite.setPosition(pixelPos.x, pixelPos.y);
    this.bubbleSprites.set(newBubble.id, sprite);
    this.projectileSprite = null;

    // Impact Wobble
    const neighbors = GridMath.getNeighbors(snapPos.row, snapPos.col);
    neighbors.forEach(n => {
      const neighborSprite = this.bubbleSprites.get(BubbleGrid.getKeyFromPos(n));
      if (neighborSprite) {
        const origY = neighborSprite.y;
        this.tweens.add({
          targets: neighborSprite,
          y: origY - 4,
          yoyo: true,
          duration: 80,
          ease: 'Sine.easeInOut'
        });
      }
    });

    const matches = MatchFinder.findMatchingCluster(this.grid, snapPos.row, snapPos.col);
    
    if (matches.length >= 3) {
      this.popBubbles(matches);
      // Process floating bubbles
      const floaters = FloatingBubbleFinder.findFloatingBubbles(this.grid);
      if (floaters.length > 0) {
        this.dropBubbles(floaters);
      }
    } else {
      // Sound for hit without match
      // this.sound.play('hit');
    }

    // Check if we reached the death line
    const lowestRow = this.grid.getLowestBubbleRow();
    if (lowestRow !== -1) {
      const lowestY = GridMath.getPixelCoordinates(lowestRow, 0).y;
      if (lowestY + BUBBLE_RADIUS >= this.deathLineY) {
        this.triggerGameOver('GAME OVER', '#ff0000');
        return;
      }
    }

    // Win condition
    if (this.grid.getAllBubbles().length === 0) {
      this.triggerLevelCleared();
      return;
    }

    this.shooter.reload();
    this.shooterSprite.setTexture(`bubble_${this.shooter.activeColor}`);
    this.shooterSprite.setVisible(true);
    this.shooterHalo.setVisible(true);
    this.updateNextBubbleDisplay();
    this.updateHaloColor();

    this.checkGameOver();
  }

  private popBubbles(bubbles: BubbleData[]) {
    if (bubbles.length > 0) {
      this.sound.play('pop', { volume: 0.6 });
    }
    bubbles.forEach(b => {
      this.grid.removeBubble(b.row, b.col);
      const sprite = this.bubbleSprites.get(b.id);
      if (sprite) {
        // Particles
        const hexColor = this.colorHexMap[b.color];
        const emitter = this.add.particles(sprite.x, sprite.y, 'particle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 1, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: hexColor,
          lifespan: 400,
          quantity: 15,
          blendMode: 'ADD',
          emitting: false
        });
        emitter.setDepth(50);
        emitter.explode(15);

        // Clean up emitter after explosion
        this.time.delayedCall(500, () => emitter.destroy());

        this.tweens.add({
          targets: sprite,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0,
          duration: 150,
          onComplete: () => sprite.destroy()
        });
        this.bubbleSprites.delete(b.id);
      }
    });
    this.score += bubbles.length * 10;
    this.hud.updateScore(this.score);
  }

  private dropBubbles(bubbles: BubbleData[]) {
    bubbles.forEach(b => {
      this.grid.removeBubble(b.row, b.col);
      const sprite = this.bubbleSprites.get(b.id);
      if (sprite) {
        this.physics.world.enable(sprite);
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true); 
        body.setBounce(0.5, 0.5);
        body.setGravityY(1000 + Phaser.Math.Between(-100, 100)); 
        body.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-50, 50));
        body.setAngularVelocity(Phaser.Math.Between(-300, 300));

        this.tweens.add({
          targets: sprite,
          alpha: 0,
          duration: 1000,
          delay: 1500,
          onComplete: () => sprite.destroy()
        });
        this.bubbleSprites.delete(b.id);
      }
    });
    this.score += bubbles.length * 20;
    this.hud.updateScore(this.score);
  }

  private checkGameOver() {
    const bubbles = this.grid.getAllBubbles();
    
    // Win Condition
    if (bubbles.length === 0) {
      if (this.currentLevel < 10) {
        this.triggerLevelCleared();
      } else {
        this.triggerGameOver('GAME BEATEN!', '#00ff00');
      }
      return;
    }

    // Out of shots
    if (this.shooter.shotsRemaining <= 0) {
      this.triggerGameOver('OUT OF SHOTS', '#ff4444');
      return;
    }

    // Grid reached bottom
    const lowestThreshold = this.shooter.y - BUBBLE_DIAMETER;
    for (const b of bubbles) {
      const p = GridMath.getPixelCoordinates(b.row, b.col);
      if (p.y >= lowestThreshold) {
        this.triggerGameOver('GAME OVER', '#ff0000');
        return;
      }
    }
  }

  private triggerLevelCleared() {
    this.isGameOver = true;
    
    SaveSystem.unlockLevel(this.currentLevel + 1);

    const bg = this.add.rectangle(BOARD_WIDTH/2, BOARD_HEIGHT/2, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.7).setDepth(200);
    const text = this.add.text(BOARD_WIDTH/2, BOARD_HEIGHT/2, 'LEVEL CLEARED!', { fontSize: '48px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
    
    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.restart({ currentLevel: this.currentLevel + 1, score: this.score });
    });
  }

  private triggerGameOver(msg: string, color: string) {
    this.isGameOver = true;
    
    const bg = this.add.rectangle(BOARD_WIDTH/2, BOARD_HEIGHT/2, BOARD_WIDTH, BOARD_HEIGHT, 0x000000, 0.7).setDepth(200);
    const text = this.add.text(BOARD_WIDTH/2, BOARD_HEIGHT/2 - 50, msg, { fontSize: '48px', color: color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
    const restartBtn = this.add.text(BOARD_WIDTH/2, BOARD_HEIGHT/2 + 50, 'Click to Restart', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setDepth(201);
    
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => {
      this.scene.restart({ currentLevel: this.currentLevel, score: 0 });
    });
  }

  private renderGrid() {
    const bubbles = this.grid.getAllBubbles();
    bubbles.forEach(b => {
      const pos = GridMath.getPixelCoordinates(b.row, b.col);
      const sprite = this.add.sprite(pos.x, pos.y, `bubble_${b.color}`)
        .setDisplaySize(BUBBLE_DIAMETER, BUBBLE_DIAMETER);
      this.bubbleSprites.set(b.id, sprite);
    });
  }

    // Removed: Procedural generation is no longer needed
}
