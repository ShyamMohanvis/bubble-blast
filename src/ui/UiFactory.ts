import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../config/constants';
import { SaveSystem } from '../systems/SaveSystem';
import { audioManager } from '../systems/AudioManager';

export function playClick(scene: Phaser.Scene) {
  audioManager.playSFX('click');
}

export function addSky(scene: Phaser.Scene, _fromLoader = false, depth = -2) {
  const bg = scene.add.image(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 'new_bg').setDepth(depth);
  
  const scaleX = BOARD_WIDTH / bg.width;
  const scaleY = BOARD_HEIGHT / bg.height;
  const scale = Math.max(scaleX, scaleY);
  bg.setScale(scale);
  
  return bg;
}

export function neonText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  size = 28,
  color = '#ffffff',
  depth = 10,
) {
  return scene.add.text(x, y, content, {
    fontFamily: '"Orbitron", "Trebuchet MS", sans-serif',
    fontSize: size + "px",
    color,
    fontStyle: '700',
    align: 'center',
    stroke: '#00ffff',
    strokeThickness: 1,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: '#00ffff',
      blur: 10,
      fill: true,
      stroke: true
    }
  }).setOrigin(0.5).setDepth(depth);
}

export function addNeonButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 300,
  height = 70,
  depth = 20,
  colorHex = 0x00ffff,
) {
  const container = scene.add.container(x, y).setDepth(depth);
  
  const bg = scene.add.graphics();
  bg.fillStyle(0x050a22, 0.85);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
  
  // Inner stroke
  bg.lineStyle(2, colorHex, 1);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
  
  // Outer glow
  bg.lineStyle(4, colorHex, 0.4);
  bg.strokeRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 18);
  
  const textObj = scene.add.text(0, 0, label, {
    fontFamily: '"Orbitron", "Trebuchet MS", sans-serif',
    fontSize: width >= 280 ? '28px' : '22px',
    color: '#ffffff',
    fontStyle: '700',
  }).setOrigin(0.5).setShadow(0, 0, "#" + colorHex.toString(16).padStart(6, '0'), 8, true, false);

  container.add([bg, textObj]);

  const hit = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
    .setInteractive({ useHandCursor: true });
  container.add(hit);

  const press = (scale: number) => {
    scene.tweens.add({
      targets: container,
      scale: scale,
      duration: 100,
      ease: 'Sine.easeOut'
    });
  };

  hit.on('pointerover', () => {
    press(1.05);
    bg.clear();
    bg.fillStyle(0x0a1544, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(3, colorHex, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(6, colorHex, 0.6);
    bg.strokeRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, 19);
  });
  
  hit.on('pointerout', () => {
    press(1);
    bg.clear();
    bg.fillStyle(0x050a22, 0.85);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(2, colorHex, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(4, colorHex, 0.4);
    bg.strokeRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 18);
  });
  
  hit.on('pointerdown', () => press(0.95));
  hit.on('pointerup', () => {
    press(1.05);
    playClick(scene);
    onClick();
  });

  return container;
}

export function addNeonSoundToggle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  depth = 20,
) {
  const container = scene.add.container(x, y).setDepth(depth);
  const size = 64;
  
  const bg = scene.add.graphics();
  const updateVisuals = () => {
    const enabled = audioManager.enabled;
    bg.clear();
    
    // Background
    bg.fillStyle(0x050a22, 0.85);
    bg.fillCircle(0, 0, size/2);
    
    if (enabled) {
      bg.lineStyle(2, 0x00ffff, 1);
      bg.strokeCircle(0, 0, size/2);
      bg.lineStyle(4, 0x00ffff, 0.4);
      bg.strokeCircle(0, 0, size/2 + 2);
      
      // Draw speaker waves
      bg.lineStyle(2, 0x00ffff, 1);
      bg.beginPath();
      bg.moveTo(-10, -5); bg.lineTo(-10, 5); bg.lineTo(-2, 10); bg.lineTo(-2, -10); bg.closePath();
      bg.fillPath();
      bg.strokePath();
      
      bg.beginPath(); bg.arc(-2, 0, 8, -Math.PI/4, Math.PI/4); bg.strokePath();
      bg.beginPath(); bg.arc(-2, 0, 14, -Math.PI/3, Math.PI/3); bg.strokePath();
    } else {
      bg.lineStyle(2, 0xff00ff, 0.6);
      bg.strokeCircle(0, 0, size/2);
      
      // Draw muted speaker
      bg.lineStyle(2, 0xff00ff, 0.8);
      bg.beginPath();
      bg.moveTo(-10, -5); bg.lineTo(-10, 5); bg.lineTo(-2, 10); bg.lineTo(-2, -10); bg.closePath();
      bg.fillPath();
      bg.strokePath();
      
      // Draw X
      bg.lineStyle(3, 0xff00ff, 1);
      bg.beginPath(); bg.moveTo(6, -6); bg.lineTo(16, 4); bg.strokePath();
      bg.beginPath(); bg.moveTo(16, -6); bg.lineTo(6, 4); bg.strokePath();
    }
  };
  
  updateVisuals();
  
  const hit = scene.add.circle(0, 0, size/2 + 10, 0x000000, 0)
    .setInteractive({ useHandCursor: true });
    
  const press = (scale: number) => {
    scene.tweens.add({
      targets: container,
      scale: scale,
      duration: 100,
      ease: 'Sine.easeOut'
    });
  };

  hit.on('pointerdown', () => press(0.95));
  
  hit.on('pointerup', () => {
    press(1.05);
    const next = audioManager.toggle();
    updateVisuals();
    
    // Animation visual feedback
    const originalScale = container.scale;
    scene.tweens.add({
      targets: container,
      scale: originalScale * 1.15,
      duration: 120,
      yoyo: true,
      ease: 'Quad.Out'
    });
    
    if (next) playClick(scene);
  });
  
  hit.on('pointerout', () => press(1));
  
  container.add([bg, hit]);
  return container;
}

export function addNeonPanel(scene: Phaser.Scene, width = 440, height = 560, depth = 301, colorHex = 0x00ffff) {
  const dim = scene.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, BOARD_WIDTH, BOARD_HEIGHT, 0x020512, 0.75)
    .setDepth(depth - 1);
    
  const container = scene.add.container(BOARD_WIDTH / 2, BOARD_HEIGHT / 2).setDepth(depth);
  const bg = scene.add.graphics();
  
  bg.fillStyle(0x050a22, 0.9);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
  
  bg.lineStyle(2, colorHex, 1);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);
  
  bg.lineStyle(6, colorHex, 0.4);
  bg.strokeRoundedRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, 27);
  
  container.add(bg);
  return { dim, panel: container };
}

export const candyText = neonText;
