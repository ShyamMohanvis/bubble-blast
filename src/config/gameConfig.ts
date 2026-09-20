import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from './constants';
import GameScene from '../scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#111122',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

export default config;
