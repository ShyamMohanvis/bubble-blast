import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../config/constants';
import { ATLAS, LOADER } from '../assets/keys';
import { addSky, candyText } from '../ui/UiFactory';
import { getLevelAssetKey } from '../game/LevelManager';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    addSky(this, true);

    this.add.image(BOARD_WIDTH / 2, BOARD_HEIGHT * 0.28, ATLAS.LOADER, LOADER.logo)
      .setDisplaySize(460, 460 * (287 / 552));

    const icon = this.add.image(BOARD_WIDTH / 2, BOARD_HEIGHT * 0.52, ATLAS.LOADER, LOADER.icon)
      .setDisplaySize(150, 150);
    this.tweens.add({
      targets: icon,
      scaleX: icon.scaleX * 1.08,
      scaleY: icon.scaleY * 1.08,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut',
    });

    const barW = 340;
    const barH = 28;
    const barX = BOARD_WIDTH / 2 - barW / 2;
    const barY = BOARD_HEIGHT * 0.72;

    this.add.nineslice(BOARD_WIDTH / 2, barY + barH / 2, ATLAS.LOADER, LOADER.barBack, barW, barH, 20, 20, 18, 18);

    const fill = this.add.nineslice(barX + 8, barY + barH / 2, ATLAS.LOADER, LOADER.barFront, 16, barH - 10, 12, 12, 12, 12)
      .setOrigin(0, 0.5);

    candyText(this, BOARD_WIDTH / 2, barY + 48, 'Loading...', 22, '#ffffff');

    this.load.on('progress', (value: number) => {
      fill.width = Math.max(16, (barW - 16) * value);
    });

    const base = import.meta.env.BASE_URL;
    this.load.atlas(ATLAS.UI, `${base}assets/ui/main.png`, `${base}assets/ui/main.json`);
    this.load.atlas(ATLAS.GAME, `${base}assets/game/game.png`, `${base}assets/game/game.json`);

    this.load.audio('click', `${base}assets/audio/snd_clickBase.mp3`);
    this.load.audio('shoot', `${base}assets/audio/snd_bubbleShot.mp3`);
    this.load.audio('pop1', `${base}assets/audio/snd_gameBubble_1.mp3`);
    this.load.audio('pop2', `${base}assets/audio/snd_gameBubble_2.mp3`);
    this.load.audio('pop3', `${base}assets/audio/snd_gameBubble_3.mp3`);
    this.load.audio('pop4', `${base}assets/audio/snd_gameBubble_4.mp3`);

    for (let i = 1; i <= 10; i++) {
      const levelKey = getLevelAssetKey(i);
      this.load.json(levelKey, `${base}levels/${levelKey}.json`);
    }
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();

    this.scene.start('MenuScene');
  }
}
