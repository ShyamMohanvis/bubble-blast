import Phaser from 'phaser';

const AUDIO_SAVE_KEY = 'bubbleShooterAudioEnabled';

export class AudioManager {
  private static instance: AudioManager;
  public enabled: boolean = true;
  public musicVolume: number = 0.25;
  public sfxVolume: number = 0.65;
  
  private currentMusic: Phaser.Sound.WebAudioSound | null = null;
  private scene!: Phaser.Scene;

  private constructor() {
    this.loadSetting();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.sound.mute = !this.enabled;
    
    // Handle browser autoplay unlocking
    if ((this.scene.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'suspended') {
      const unlockAudio = () => {
        (this.scene.sound as Phaser.Sound.WebAudioSoundManager).context.resume().then(() => {
          if (this.enabled && this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.play();
          }
        });
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      };
      document.addEventListener('pointerdown', unlockAudio);
      document.addEventListener('keydown', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
    }
  }

  private loadSetting() {
    const saved = localStorage.getItem(AUDIO_SAVE_KEY);
    if (saved !== null) {
      try {
        this.enabled = JSON.parse(saved);
      } catch (e) {
        this.enabled = true;
      }
    } else {
      this.enabled = true;
    }
  }

  private saveSetting() {
    localStorage.setItem(AUDIO_SAVE_KEY, JSON.stringify(this.enabled));
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public setEnabled(value: boolean) {
    this.enabled = value;
    this.saveSetting();
    
    if (this.scene) {
      this.scene.sound.mute = !this.enabled;
    }

    if (!this.enabled) {
      if (this.currentMusic) {
        this.currentMusic.pause();
      }
    } else {
      if (this.currentMusic) {
        if (this.currentMusic.isPaused) {
          this.currentMusic.resume();
        } else if (!this.currentMusic.isPlaying) {
          this.currentMusic.play();
        }
      }
    }
  }

  public playMusic(key: string) {
    if (!this.scene) return;
    
    // Prevent duplicate music
    if (this.currentMusic && this.currentMusic.key === key) {
      if (!this.currentMusic.isPlaying && this.enabled) {
        if ((this.scene.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'running') {
          this.currentMusic.play();
        }
      }
      return;
    }

    this.stopMusic();

    this.currentMusic = this.scene.sound.add(key, { 
      loop: true, 
      volume: 0 
    }) as Phaser.Sound.WebAudioSound;

    if (this.enabled) {
      if ((this.scene.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'running') {
        this.currentMusic.play();
      }
    }

    this.scene.tweens.add({
      targets: this.currentMusic,
      volume: this.musicVolume,
      duration: 2000,
    });
  }

  public stopMusic(fadeOut: boolean = false) {
    if (this.currentMusic) {
      const music = this.currentMusic;
      this.currentMusic = null;

      if (fadeOut && this.scene) {
        this.scene.tweens.add({
          targets: music,
          volume: 0,
          duration: 1000,
          onComplete: () => {
            music.stop();
            music.destroy();
          }
        });
      } else {
        music.stop();
        music.destroy();
      }
    }
  }

  public playSFX(key: string, customVolume?: number) {
    if (!this.enabled || !this.scene) return;
    this.scene.sound.play(key, { volume: customVolume ?? this.sfxVolume });
  }
}

export const audioManager = AudioManager.getInstance();
