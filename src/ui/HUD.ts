import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/constants';

export class HUD {
  private scene: Phaser.Scene;
  private topBar!: Phaser.GameObjects.Graphics;
  private bottomBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  
  public onSettingsClicked?: () => void;
  public onHomeClicked?: () => void;
  public onSoundClicked?: () => boolean; // returns isMuted
  public onPauseClicked?: () => void;
  
  private level: number;
  
  constructor(scene: Phaser.Scene, level: number = 1) {
    this.scene = scene;
    this.level = level;
    this.create();
  }

  private create() {
    // --- TOP BAR ---
    this.topBar = this.scene.add.graphics();
    this.topBar.fillStyle(0x1a0b2e, 1); // Dark purple
    this.topBar.fillRect(0, 0, BOARD_WIDTH, 60);
    
    // Cyan bottom border
    this.topBar.lineStyle(2, 0x3ae2ce, 1);
    this.topBar.beginPath();
    this.topBar.moveTo(0, 60);
    this.topBar.lineTo(BOARD_WIDTH, 60);
    this.topBar.strokePath();
    this.topBar.setDepth(100);

    // Left: Home Button (white square)
    this.scene.add.graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(15, 10, 40, 40, 8)
      .setDepth(101);
    this.scene.add.text(35, 30, '⌂', { fontSize: '28px', color: '#1a0b2e', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
    
    this.scene.add.rectangle(35, 30, 40, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onHomeClicked && this.onHomeClicked())
      .setDepth(103);

    // Center: Level Indicator
    this.scene.add.text(BOARD_WIDTH / 2, 30, `Level ${this.level}`, { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5).setDepth(101);

    // Right: Sound and Pause Buttons
    this.scene.add.graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(BOARD_WIDTH - 105, 10, 40, 40, 8)
      .setDepth(101);
    const soundText = this.scene.add.text(BOARD_WIDTH - 85, 30, '🔊', { fontSize: '20px', color: '#1a0b2e' }).setOrigin(0.5).setDepth(102);
    
    this.scene.add.rectangle(BOARD_WIDTH - 85, 30, 40, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.onSoundClicked) {
          const isMuted = this.onSoundClicked();
          soundText.setText(isMuted ? '🔇' : '🔊');
        }
      })
      .setDepth(103);

    this.scene.add.graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(BOARD_WIDTH - 55, 10, 40, 40, 8)
      .setDepth(101);
    this.scene.add.text(BOARD_WIDTH - 35, 30, '⏸', { fontSize: '20px', color: '#1a0b2e' }).setOrigin(0.5).setDepth(102);

    this.scene.add.rectangle(BOARD_WIDTH - 35, 30, 40, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onPauseClicked && this.onPauseClicked())
      .setDepth(103);

    // --- BOTTOM BAR ---
    this.bottomBar = this.scene.add.graphics();
    this.bottomBar.fillStyle(0x1a0b2e, 1);
    this.bottomBar.fillRect(0, BOARD_HEIGHT - 100, BOARD_WIDTH, 100);
    this.bottomBar.setDepth(100);

    // Cyan glowing top border with "U" dip in the middle
    // Dip radius is 45px.
    const centerY = BOARD_HEIGHT - 100;
    const centerX = BOARD_WIDTH / 2;
    const radius = 45;

    this.bottomBar.lineStyle(3, 0x3ae2ce, 1);
    this.bottomBar.beginPath();
    this.bottomBar.moveTo(0, centerY);
    this.bottomBar.lineTo(centerX - radius, centerY);
    this.bottomBar.arc(centerX, centerY, radius, Math.PI, 0, true);
    this.bottomBar.lineTo(BOARD_WIDTH, centerY);
    this.bottomBar.strokePath();

    // Inner glow
    this.bottomBar.lineStyle(8, 0x3ae2ce, 0.3);
    this.bottomBar.beginPath();
    this.bottomBar.moveTo(0, centerY);
    this.bottomBar.lineTo(centerX - radius, centerY);
    this.bottomBar.arc(centerX, centerY, radius, Math.PI, 0, true);
    this.bottomBar.lineTo(BOARD_WIDTH, centerY);
    this.bottomBar.strokePath();

    // Score Text (Left)
    this.scoreText = this.scene.add.text(20, BOARD_HEIGHT - 50, 'Score: 0', { 
      fontSize: '20px', 
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(101);
  }

  updateScore(score: number) {
    this.scoreText.setText(`Score: ${score}`);
  }
}
