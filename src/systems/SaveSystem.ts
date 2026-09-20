const SAVE_KEY = 'bubble_blast_save_data';

export interface SaveData {
  unlockedLevel: number;
  sound: boolean;
}

export class SaveSystem {
  static load(): SaveData {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
      try {
        return JSON.parse(data) as SaveData;
      } catch (e) {
        console.error('Failed to parse save data', e);
      }
    }
    
    // Default save data
    return {
      unlockedLevel: 1,
      sound: true
    };
  }

  static save(data: SaveData) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static unlockLevel(level: number) {
    const data = this.load();
    if (level > data.unlockedLevel) {
      data.unlockedLevel = level;
      this.save(data);
    }
  }

  static isLevelUnlocked(level: number): boolean {
    const data = this.load();
    return level <= data.unlockedLevel;
  }

  static getSoundEnabled(): boolean {
    return this.load().sound;
  }

  static toggleSound(): boolean {
    const data = this.load();
    data.sound = !data.sound;
    this.save(data);
    return data.sound;
  }
}
