const SAVE_KEY = 'bubble_blast_save_data';

export interface SaveData {
  unlockedLevel: number;
  currentLevel?: number;
  sound: boolean;
  starRatings: Record<number, number>;
}

export class SaveSystem {
  static load(): SaveData {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data) as SaveData;
        if (!parsed.starRatings) {
          parsed.starRatings = {};
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse save data', e);
      }
    }
    
    // Default save data
    return {
      unlockedLevel: 1,
      currentLevel: 1,
      sound: true,
      starRatings: {}
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

  static setCurrentLevel(level: number) {
    const data = this.load();
    const currentLevel = Math.max(1, Math.floor(level));
    if (currentLevel !== data.currentLevel) {
      this.save({ ...data, currentLevel });
    }
  }

  static getStartLevel(): number {
    const data = this.load();
    return Math.min(data.currentLevel || data.unlockedLevel || 1, data.unlockedLevel);
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

  static setStarRating(level: number, stars: number) {
    const data = this.load();
    const currentRating = data.starRatings[level] || 0;
    if (stars > currentRating) {
      data.starRatings[level] = stars;
      this.save(data);
    }
  }

  static getStarRating(level: number): number {
    const data = this.load();
    return data.starRatings[level] || 0;
  }
}
