import Phaser from 'phaser';
import config from './config/gameConfig';
import './style.css';

const game = new Phaser.Game(config);

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

document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });
