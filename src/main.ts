import Phaser from 'phaser';
import config from './config/gameConfig';
import MenuScene from './scenes/MenuScene';
import LevelSelectScene from './scenes/LevelSelectScene';
import './style.css';

// Prepend the new scenes before GameScene
config.scene = [MenuScene, LevelSelectScene, ...(config.scene as any[])];

const game = new Phaser.Game(config);

// iOS Audio Unlock: Safari suspends AudioContext until a user gesture.
// This one-time listener resumes it on the first touch/click.
const unlockAudio = () => {
  const snd = game.sound as any;
  if (snd && snd.context && snd.context.state === 'suspended') {
    snd.context.resume();
  }
  document.removeEventListener('touchstart', unlockAudio, true);
  document.removeEventListener('touchend', unlockAudio, true);
  document.removeEventListener('click', unlockAudio, true);
};
document.addEventListener('touchstart', unlockAudio, true);
document.addEventListener('touchend', unlockAudio, true);
document.addEventListener('click', unlockAudio, true);

// Prevent iOS pull-to-refresh and bounce on the document level
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });
