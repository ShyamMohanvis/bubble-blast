import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from './constants';
import BootScene from '../scenes/BootScene';
import PreloadScene from '../scenes/PreloadScene';
import MenuScene from '../scenes/MenuScene';
import GameScene from '../scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#050a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    touch: {
      capture: true
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene]
};

export default config;
