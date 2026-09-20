import Phaser from 'phaser';
import config from './config/gameConfig';
import MenuScene from './scenes/MenuScene';
import LevelSelectScene from './scenes/LevelSelectScene';
import './style.css';

// Prepend the new scenes before GameScene
config.scene = [MenuScene, LevelSelectScene, ...(config.scene as any[])];

new Phaser.Game(config);
