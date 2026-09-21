import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';
import { addNeonButton, addNeonSoundToggle, neonText } from './UiFactory';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private shotsText!: Phaser.GameObjects.Text;
  private level: number;

  public onHomeClicked?: () => void;
  public onPauseClicked?: () => void;

  constructor(scene: Phaser.Scene, level: number = 1) {
    this.scene = scene;
    this.level = level;
    this.create();
  }

  private create() {
    // Top HUD background (dark translucent)
    const topBg = this.scene.add.graphics().setDepth(100);
    topBg.fillStyle(0x050a22, 0.7);
    topBg.fillRoundedRect(10, 10, BOARD_WIDTH - 20, 70, 12);
    topBg.lineStyle(2, 0x00ffff, 0.8);
    topBg.strokeRoundedRect(10, 10, BOARD_WIDTH - 20, 70, 12);

    // MENU button
    addNeonButton(this.scene, 70, 45, 'MENU', () => {
      this.onPauseClicked?.();
    }, 100, 40, 102, 0x00ffff);

    // Score
    this.scene.add.image(150, 45, 'neon_star').setDisplaySize(28, 28).setDepth(102);
    this.scoreText = neonText(this.scene, 210, 45, '0', 24, '#ffffff', 102);

    // Level
    neonText(this.scene, BOARD_WIDTH / 2 + 50, 45, `LVL ${String(this.level).padStart(2, '0')}`, 24, '#00ffff', 102);

    // Sound toggle
    addNeonSoundToggle(this.scene, BOARD_WIDTH - 55, 45, 102);

    // Bottom Shots Counter HUD
    const bottomBg = this.scene.add.graphics().setDepth(100);
    const bottomY = BOARD_HEIGHT - 90;
    const bottomW = 160;
    const bottomH = 70;
    const bottomX = 10;
    
    bottomBg.fillStyle(0x050a22, 0.7);
    bottomBg.fillRoundedRect(bottomX, bottomY, bottomW, bottomH, 12);
    bottomBg.lineStyle(2, 0x00ffff, 0.8);
    bottomBg.strokeRoundedRect(bottomX, bottomY, bottomW, bottomH, 12);
    bottomBg.lineStyle(4, 0x00ffff, 0.3);
    bottomBg.strokeRoundedRect(bottomX - 2, bottomY - 2, bottomW + 4, bottomH + 4, 14);

    this.scene.add.image(bottomX + 35, bottomY + 35, 'neon_blue').setDisplaySize(40, 40).setDepth(102);
    this.shotsText = neonText(this.scene, bottomX + 90, bottomY + 25, '25', 28, '#ffffff', 102);
    neonText(this.scene, bottomX + 90, bottomY + 50, 'SHOTS LEFT', 12, '#00ffff', 102);
  }

  updateScore(score: number) {
    this.scoreText.setText(`${score}`);
  }

  updateShots(shots: number) {
    this.shotsText.setText(`${shots}`);
  }
}

