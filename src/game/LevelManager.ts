import type { BubbleColor } from '../config/constants';
import type { LevelConfig } from './Level';

export interface LevelDifficulty {
  colors: BubbleColor[];
  rows: number;
  patternComplexity: number;
  missesBeforeAdvance: number;
  specialBubbleChance: number;
}

const COLOR_CODES: Record<BubbleColor, string> = {
  blue: 'B',
  orange: 'O',
  green: 'G',
  purple: 'P',
  red: 'R',
  yellow: 'Y',
};

export const MAX_LEVEL = 30;

const DIFFICULTY_TIERS: LevelDifficulty[] = [
  { colors: ['blue', 'orange'], rows: 4, patternComplexity: 0, missesBeforeAdvance: 7, specialBubbleChance: 0 },
  { colors: ['blue', 'orange', 'green'], rows: 6, patternComplexity: 1, missesBeforeAdvance: 6, specialBubbleChance: 0.02 },
  { colors: ['blue', 'orange', 'green', 'purple'], rows: 8, patternComplexity: 2, missesBeforeAdvance: 5, specialBubbleChance: 0.04 },
  { colors: ['blue', 'orange', 'green', 'purple'], rows: 10, patternComplexity: 3, missesBeforeAdvance: 5, specialBubbleChance: 0.06 },
  { colors: ['blue', 'orange', 'green', 'purple', 'red'], rows: 12, patternComplexity: 4, missesBeforeAdvance: 4, specialBubbleChance: 0.08 },
  { colors: ['blue', 'orange', 'green', 'purple', 'red', 'yellow'], rows: 14, patternComplexity: 5, missesBeforeAdvance: 4, specialBubbleChance: 0.1 },
];

export function getLevelAssetKey(levelNumber: number): string {
  return `level-${levelNumber === 10 ? '0010' : String(levelNumber).padStart(3, '0')}`;
}

export class LevelManager {
  private currentLevel: number;
  private transitionClaimed = false;

  constructor(startLevel = 1) {
    this.currentLevel = Math.max(1, Math.floor(startLevel));
  }

  get level(): number {
    return this.currentLevel;
  }

  completeLevel(): number {
    if (this.transitionClaimed) return this.currentLevel;
    this.transitionClaimed = true;
    this.currentLevel = Math.min(MAX_LEVEL, this.currentLevel + 1);
    return this.currentLevel;
  }

  resetLevel(levelNumber = this.currentLevel): void {
    this.currentLevel = Math.max(1, Math.floor(levelNumber));
    this.transitionClaimed = false;
  }

  getDifficulty(levelNumber = this.currentLevel): LevelDifficulty {
    const tier = DIFFICULTY_TIERS[Math.min(DIFFICULTY_TIERS.length - 1, Math.max(0, levelNumber - 1))];
    const extraRows = Math.max(0, levelNumber - DIFFICULTY_TIERS.length) * 2;
    return {
      ...tier,
      colors: [...tier.colors],
      rows: tier.rows + extraRows,
      missesBeforeAdvance: Math.max(2, tier.missesBeforeAdvance - Math.floor(Math.max(0, levelNumber - 6) / 2)),
      patternComplexity: tier.patternComplexity + Math.max(0, levelNumber - DIFFICULTY_TIERS.length),
    };
  }

  generateLevel(levelNumber = this.currentLevel): LevelConfig {
    const difficulty = this.getDifficulty(levelNumber);
    const grid: string[][] = [];

    for (let row = 0; row < difficulty.rows; row += 1) {
      const columnCount = row % 2 === 0 ? 11 : 10;
      const pattern = this.patternValue(row, difficulty.patternComplexity, levelNumber);
      grid.push(Array.from({ length: columnCount }, (_, column) => {
        const colorIndex = (column + row * 2 + pattern) % difficulty.colors.length;
        return COLOR_CODES[difficulty.colors[colorIndex]];
      }));
    }

    return { id: levelNumber, grid };
  }

  private patternValue(row: number, complexity: number, levelNumber: number): number {
    if (complexity === 0) return row % 2;
    const wave = (row + levelNumber) % (complexity + 2);
    return wave === complexity + 1 ? 1 : 0;
  }
}