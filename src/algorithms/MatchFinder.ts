import { BubbleGrid, type BubbleData } from '../game/BubbleGrid';
import { GridMath, type GridPosition } from './GridMath';

export class MatchFinder {
  /**
   * Finds a cluster of matching colored bubbles starting from a specific bubble.
   * Returns an array of matching BubbleData.
   */
  static findMatchingCluster(grid: BubbleGrid, startRow: number, startCol: number): BubbleData[] {
    const startBubble = grid.getBubble(startRow, startCol);
    if (!startBubble) {
      return [];
    }

    const targetColor = startBubble.color;
    const cluster: BubbleData[] = [];
    const visited = new Set<string>();
    
    // Queue for BFS
    const queue: BubbleData[] = [startBubble];
    visited.add(BubbleGrid.getKey(startRow, startCol));

    while (queue.length > 0) {
      const current = queue.shift()!;
      cluster.push(current);

      const neighbors = GridMath.getNeighbors(current.row, current.col);
      
      for (const n of neighbors) {
        const neighborKey = BubbleGrid.getKey(n.row, n.col);
        
        if (!visited.has(neighborKey)) {
          const neighborBubble = grid.getBubble(n.row, n.col);
          
          if (neighborBubble && neighborBubble.color === targetColor) {
            visited.add(neighborKey);
            queue.push(neighborBubble);
          }
        }
      }
    }

    return cluster;
  }
}
