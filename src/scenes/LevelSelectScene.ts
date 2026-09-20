import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.drawPremiumBackground();

    // Title
    this.add.text(BOARD_WIDTH / 2, 60, 'SELECT LEVEL', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 4 }
    }).setOrigin(0.5);

    // Back Button
    const backBtn = this.add.text(20, 20, '< Back', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    const unlockedLevel = SaveSystem.load().unlockedLevel;

    // Draw 10 levels in a 2x5 grid
    const startX = BOARD_WIDTH / 2 - 100;
    const startY = 150;
    const spacingX = 100;
    const spacingY = 100;

    for (let i = 0; i < 10; i++) {
      const level = i + 1;
      const col = i % 3;
      const row = Math.floor(i / 3);
      
      const x = (BOARD_WIDTH / 2 - 120) + (col * 120);
      const y = startY + (row * 120);

      const isUnlocked = level <= unlockedLevel;
      const bgColor = isUnlocked ? 0x1e90ff : 0x708090;

      const btnBg = this.add.graphics()
        .fillStyle(bgColor, 1)
        .lineStyle(3, 0xffffff, 1)
        .fillRoundedRect(x - 40, y - 40, 80, 80, 15)
        .strokeRoundedRect(x - 40, y - 40, 80, 80, 15);

      const text = this.add.text(x, y, isUnlocked ? `${level}` : '🔒', {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      if (isUnlocked) {
        const hitArea = this.add.rectangle(x, y, 80, 80, 0, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.scene.start('GameScene', { currentLevel: level, score: 0 });
          });
      }
    }
  }

  private drawPremiumBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xeaf4fc, 0xeaf4fc, 0xd0e8f8, 0xd0e8f8, 1);
    bg.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  }
}
