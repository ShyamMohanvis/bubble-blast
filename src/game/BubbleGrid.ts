import type { BubbleColor } from '../config/constants';
import { GridMath, type GridPosition } from '../algorithms/GridMath';

export interface BubbleData {
  id: string;
  color: BubbleColor;
  row: number;
  col: number;
  active: boolean; // if false, it's popping/falling
}

export class BubbleGrid {
  private grid: Map<string, BubbleData>; // Keyed by "row,col"

  constructor() {
    this.grid = new Map();
  }

  static getKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  static getKeyFromPos(pos: GridPosition): string {
    return `${pos.row},${pos.col}`;
  }

  addBubble(bubble: BubbleData): void {
    this.grid.set(BubbleGrid.getKey(bubble.row, bubble.col), bubble);
  }

  removeBubble(row: number, col: number): void {
    this.grid.delete(BubbleGrid.getKey(row, col));
  }

  getBubble(row: number, col: number): BubbleData | undefined {
    return this.grid.get(BubbleGrid.getKey(row, col));
  }

  hasBubble(row: number, col: number): boolean {
    return this.grid.has(BubbleGrid.getKey(row, col));
  }

  getAllBubbles(): BubbleData[] {
    return Array.from(this.grid.values());
  }

  clear(): void {
    this.grid.clear();
  }

  /**
   * Snaps a moving bubble to the nearest available grid cell.
   * We find the closest valid cell that is NOT occupied.
   */
  getNearestEmptyCell(x: number, y: number): GridPosition {
    const rawPos = GridMath.getGridCoordinates(x, y);
    
    // If the exact raw cell is empty, return it.
    if (!this.hasBubble(rawPos.row, rawPos.col)) {
      return rawPos;
    }

    // Otherwise, we need to find the closest empty neighbor.
    // We can do this by checking all valid cells and picking the one with minimal Euclidean distance.
    // A simple heuristic is to check the immediate neighbors of the calculated cell.
    const neighbors = GridMath.getNeighbors(rawPos.row, rawPos.col);
    
    let closestPos: GridPosition | null = null;
    let minDistance = Infinity;

    for (const n of neighbors) {
      if (!this.hasBubble(n.row, n.col)) {
        const p = GridMath.getPixelCoordinates(n.row, n.col);
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closestPos = n;
        }
      }
    }

    if (closestPos) {
      return closestPos;
    }

    // Fallback: If for some reason all neighbors are full (should be rare/impossible 
    // depending on collision), just return rawPos or find the first empty spot.
    return rawPos; 
  }

  getLowestBubbleRow(): number {
    let maxRow = -1;
    for (const [key, bubble] of this.grid.entries()) {
      if (bubble.active && bubble.row > maxRow) {
        maxRow = bubble.row;
      }
    }
    return maxRow;
  }
}
