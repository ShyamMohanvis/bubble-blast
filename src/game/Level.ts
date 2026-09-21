import { BubbleGrid, type BubbleData } from './BubbleGrid';
import type { BubbleColor } from '../config/constants';

export interface LevelConfig {
  id?: number;
  colors?: BubbleColor[];
  grid: string[][];
}

export class Level {
  private nextId = 1;

  constructor() {}

  /**
   * Generates a unique ID for each bubble
   */
  private generateBubbleId(): string {
    return `b_${Date.now()}_${this.nextId++}`;
  }

  /**
   * Maps a character code to a color.
   */
  private charToColor(char: string): BubbleColor | null {
    switch (char.toUpperCase()) {
      case 'B': return 'blue';
      case 'O': return 'orange';
      case 'G': return 'green';
      case 'P': return 'purple';
      case 'R': return 'red';
      case 'Y': return 'yellow';
      default: return null;
    }
  }

  /**
   * Parses level configuration and returns an initialized BubbleGrid
   */
  createGrid(config: LevelConfig): BubbleGrid {
    const grid = new BubbleGrid();

    for (let row = 0; row < config.grid.length; row++) {
      for (let col = 0; col < config.grid[row].length; col++) {
        const cell = config.grid[row][col];
        const color = typeof cell === 'string' ? this.charToColor(cell) : null;
        
        if (color) {
          const bubble: BubbleData = {
            id: this.generateBubbleId(),
            color: color,
            row: row,
            col: col,
            active: true
          };
          grid.addBubble(bubble);
        }
      }
    }

    return grid;
  }
}
