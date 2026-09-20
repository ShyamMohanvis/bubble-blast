import { BUBBLE_RADIUS, BUBBLE_DIAMETER, ROW_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, BOARD_WIDTH_BUBBLES } from '../config/constants';

export interface GridPosition {
  row: number;
  col: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

export class GridMath {
  /**
   * Returns true if the row is "even" in our offset coordinate system.
   */
  static isEvenRow(row: number): boolean {
    return row % 2 === 0;
  }

  /**
   * Gets the maximum number of columns for a given row.
   */
  static getColsInRow(row: number): number {
    return this.isEvenRow(row) ? BOARD_WIDTH_BUBBLES : BOARD_WIDTH_BUBBLES - 1;
  }

  /**
   * Converts grid coordinates (row, col) to screen pixel coordinates (x, y).
   */
  static getPixelCoordinates(row: number, col: number): PixelPosition {
    const isEven = this.isEvenRow(row);
    // Odd rows are shifted right by one radius
    const rowOffsetX = isEven ? 0 : BUBBLE_RADIUS;
    
    const x = GRID_OFFSET_X + rowOffsetX + (col * BUBBLE_DIAMETER);
    const y = GRID_OFFSET_Y + (row * ROW_HEIGHT);
    
    return { x, y };
  }

  /**
   * Estimates the closest grid cell for a given pixel coordinate.
   * This is used when a bubble hits the ceiling or another bubble.
   */
  static getGridCoordinates(x: number, y: number): GridPosition {
    // Determine the closest row based on Y
    let row = Math.round((y - GRID_OFFSET_Y) / ROW_HEIGHT);
    // Clamp row to 0+
    row = Math.max(0, row);

    // Determine the X offset for this row
    const isEven = this.isEvenRow(row);
    const rowOffsetX = isEven ? 0 : BUBBLE_RADIUS;
    
    // Determine the closest col based on X
    let col = Math.round((x - GRID_OFFSET_X - rowOffsetX) / BUBBLE_DIAMETER);
    
    // Clamp col
    const maxCols = this.getColsInRow(row);
    col = Math.max(0, Math.min(col, maxCols - 1));

    return { row, col };
  }

  /**
   * Returns the grid positions of up to 6 neighbors of a given cell.
   * Does not check if the positions are actually occupied.
   */
  static getNeighbors(row: number, col: number): GridPosition[] {
    const isEven = this.isEvenRow(row);
    
    const neighbors: GridPosition[] = [];
    
    // Left and Right neighbors (same row)
    neighbors.push({ row, col: col - 1 });
    neighbors.push({ row, col: col + 1 });

    if (isEven) {
      // For even rows, the neighbors above/below are at col-1 and col
      neighbors.push({ row: row - 1, col: col - 1 });
      neighbors.push({ row: row - 1, col: col });
      neighbors.push({ row: row + 1, col: col - 1 });
      neighbors.push({ row: row + 1, col: col });
    } else {
      // For odd rows, the neighbors above/below are at col and col+1
      neighbors.push({ row: row - 1, col: col });
      neighbors.push({ row: row - 1, col: col + 1 });
      neighbors.push({ row: row + 1, col: col });
      neighbors.push({ row: row + 1, col: col + 1 });
    }

    // Filter out logically invalid cells (out of bounds)
    return neighbors.filter(pos => {
      return pos.row >= 0 && pos.col >= 0 && pos.col < this.getColsInRow(pos.row);
    });
  }
}
