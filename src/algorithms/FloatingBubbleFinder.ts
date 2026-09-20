import { BubbleGrid, type BubbleData } from '../game/BubbleGrid';
import { GridMath } from './GridMath';

export class FloatingBubbleFinder {
  /**
   * Finds all bubbles that are no longer connected to the ceiling (row 0).
   * It does this by starting a BFS from all bubbles in row 0. 
   * Bubbles not reached by this BFS are considered floating.
   */
  static findFloatingBubbles(grid: BubbleGrid): BubbleData[] {
    const allBubbles = grid.getAllBubbles();
    if (allBubbles.length === 0) return [];

    const connected = new Set<string>();
    const queue: BubbleData[] = [];

    // 1. Find all bubbles attached to the ceiling (row 0)
    for (const bubble of allBubbles) {
      if (bubble.row === 0) {
        const key = BubbleGrid.getKey(bubble.row, bubble.col);
        connected.add(key);
        queue.push(bubble);
      }
    }

    // 2. BFS to find all connected bubbles
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = GridMath.getNeighbors(current.row, current.col);

      for (const n of neighbors) {
        const neighborKey = BubbleGrid.getKey(n.row, n.col);
        if (!connected.has(neighborKey)) {
          const neighborBubble = grid.getBubble(n.row, n.col);
          if (neighborBubble) {
            connected.add(neighborKey);
            queue.push(neighborBubble);
          }
        }
      }
    }

    // 3. Any bubble not in the 'connected' set is floating
    const floatingBubbles: BubbleData[] = [];
    for (const bubble of allBubbles) {
      const key = BubbleGrid.getKey(bubble.row, bubble.col);
      if (!connected.has(key)) {
        floatingBubbles.push(bubble);
      }
    }

    return floatingBubbles;
  }
}
