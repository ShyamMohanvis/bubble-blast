import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, type BubbleColor } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';
import { addNeonButton, addNeonPanel, addSky, addNeonSoundToggle, neonText } from '../ui/UiFactory';
import { generateNeonBubbleTextures } from '../utils/BubbleTextureGenerator';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    generateNeonBubbleTextures(this);
    addSky(this);
    this.spawnDecorBubbles();

    // Fade out and stop background music if it was playing from GameScene
    const bgm = this.sound.get('bgm') as Phaser.Sound.WebAudioSound;
    if (bgm && bgm.isPlaying) {
      this.tweens.add({
        targets: bgm,
        volume: 0,
        duration: 1000,
        onComplete: () => { bgm.stop(); bgm.destroy(); }
      });
    }
    this.sound.mute = !SaveSystem.getSoundEnabled();

    // Futuristic Title
    neonText(this, BOARD_WIDTH / 2, 220, 'BUBBLE\nSHOOTER', 56, '#00ffff', 10);
    neonText(this, BOARD_WIDTH / 2, 330, 'CLASSIC', 32, '#ff00ff', 10);

    // Play Button
    addNeonButton(this, BOARD_WIDTH / 2, 540, 'PLAY', () => {
      this.startGame();
    }, 280, 80, 20, 0x00ffff);

    // How to Play Button
    addNeonButton(this, BOARD_WIDTH / 2, 650, 'HOW TO PLAY', () => {
      this.showHelp();
    }, 280, 70, 20, 0xff00ff);

    // Sound toggle
    addNeonSoundToggle(this, BOARD_WIDTH / 2, 760);
  }

  private startGame() {
    const level = SaveSystem.getStartLevel();
    SaveSystem.setCurrentLevel(level);
    this.scene.start('GameScene', { currentLevel: level, score: 0 });
  }

  private showHelp() {
    const { dim, panel } = addNeonPanel(this, 400, 500, 400, 0xff00ff);
    
    const title = neonText(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 180, 'HOW TO PLAY', 32, '#00ffff', 401);
    
    const copy = this.add.text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 30, 'Aim and tap to shoot.\n\nMatch 3+ of the same color.\n\nClear the board before\nshots run out!', {
      fontFamily: '"Orbitron", "Trebuchet MS", sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5).setDepth(401);

    const closeBtn = addNeonButton(this, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 150, 'GOT IT', () => {
      dim.destroy();
      panel.destroy();
      title.destroy();
      copy.destroy();
      closeBtn.destroy();
    }, 240, 70, 402, 0x00ffff);
  }

  private spawnDecorBubbles() {
    const colors: BubbleColor[] = ['blue', 'green', 'red', 'purple', 'orange'];
    for (let i = 0; i < 16; i++) {
      const color = colors[i % colors.length];
      const r = Phaser.Math.Between(16, 32);
      const x = Phaser.Math.Between(28, BOARD_WIDTH - 28);
      const y = Phaser.Math.Between(50, BOARD_HEIGHT - 50);
      const bubble = this.add.image(x, y, `neon_${color}`)
        .setDisplaySize(r * 2, r * 2)
        .setAlpha(0.42)
        .setDepth(1);

      this.tweens.add({
        targets: bubble,
        y: y - Phaser.Math.Between(20, 80),
        x: x + Phaser.Math.Between(-18, 18),
        angle: Phaser.Math.Between(-14, 14),
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(2600, 5000),
        ease: 'Sine.easeInOut',
      });
    }
  }
}

