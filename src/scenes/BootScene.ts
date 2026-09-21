import Phaser from 'phaser';
import { ATLAS } from '../assets/keys';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const base = import.meta.env.BASE_URL;
    this.load.atlas(ATLAS.LOADER, `${base}assets/loader/loader.png`, `${base}assets/loader/loader.json`);
    this.load.image('new_bg', `${base}assets/new_bg.jpg`);
  }

  create() {
    const start = () => this.scene.start('PreloadScene');
    if (document.fonts?.ready) {
      document.fonts.ready.then(start).catch(start);
    } else {
      start();
    }
  }
}
