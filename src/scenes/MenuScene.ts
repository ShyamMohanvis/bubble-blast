import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.drawPremiumBackground();

    // Logo / Title
    this.add.text(BOARD_WIDTH / 2, BOARD_HEIGHT * 0.3, 'BUBBLE BLAST', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#1a5090',
      strokeThickness: 8,
      shadow: { color: '#000000', fill: true, offsetX: 4, offsetY: 4, blur: 8 }
    }).setOrigin(0.5);

    // Play Button
    const playBtnBg = this.add.graphics()
      .fillStyle(0x32cd32, 1) // Green
      .lineStyle(4, 0xffffff, 1)
      .fillRoundedRect(BOARD_WIDTH / 2 - 100, BOARD_HEIGHT * 0.55, 200, 60, 30)
      .strokeRoundedRect(BOARD_WIDTH / 2 - 100, BOARD_HEIGHT * 0.55, 200, 60, 30);
      
    const playText = this.add.text(BOARD_WIDTH / 2, BOARD_HEIGHT * 0.55 + 30, 'PLAY', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const playBtnHit = this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT * 0.55 + 30, 200, 60, 0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playBtnBg.setScale(1.05))
      .on('pointerout', () => playBtnBg.setScale(1))
      .on('pointerdown', () => {
        this.scene.start('LevelSelectScene');
      });

    // Sound Toggle
    this.createSoundToggle();
  }

  private createSoundToggle() {
    const isSoundOn = SaveSystem.getSoundEnabled();
    const soundText = this.add.text(BOARD_WIDTH / 2, BOARD_HEIGHT * 0.8, isSoundOn ? '🔊 Sound: ON' : '🔇 Sound: OFF', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    soundText.on('pointerdown', () => {
      const newState = SaveSystem.toggleSound();
      soundText.setText(newState ? '🔊 Sound: ON' : '🔇 Sound: OFF');
      this.sound.mute = !newState;
    });
    
    this.sound.mute = !isSoundOn;
  }

  private drawPremiumBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x60c0ff, 0x60c0ff, 0x1e90ff, 0x1e90ff, 1);
    bg.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    
    // Some floating decorative bubbles
    const colors = [0x32cd32, 0xff8c00, 0x1e90ff, 0x9370db, 0xff4500, 0xffd700];
    for (let i = 0; i < 20; i++) {
      const r = Phaser.Math.Between(10, 40);
      const x = Phaser.Math.Between(0, BOARD_WIDTH);
      const y = Phaser.Math.Between(0, BOARD_HEIGHT);
      const c = colors[Phaser.Math.Between(0, colors.length - 1)];
      
      const b = this.add.circle(x, y, r, c, 0.4);
      
      this.tweens.add({
        targets: b,
        y: y - Phaser.Math.Between(50, 150),
        x: x + Phaser.Math.Between(-30, 30),
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.easeInOut'
      });
    }
  }
}
