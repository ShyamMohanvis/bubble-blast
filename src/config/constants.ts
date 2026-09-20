export const BUBBLE_RADIUS = 20;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
// In a hex grid, the vertical distance between rows is slightly less than the diameter
// It's typically radius * sqrt(3)
export const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);

export const BOARD_WIDTH_BUBBLES = 11; // 11 in even rows, 10 in odd rows
export const BOARD_WIDTH = 540;
export const BOARD_HEIGHT = 960;

// The horizontal offset to center the grid
export const GRID_OFFSET_X = (BOARD_WIDTH - (BOARD_WIDTH_BUBBLES * BUBBLE_DIAMETER)) / 2 + BUBBLE_RADIUS;
export const GRID_OFFSET_Y = 80; // Top margin, below the 55px HUD

export type BubbleColor = 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'yellow';
export const COLORS: BubbleColor[] = ['blue', 'orange', 'green']; // Only using 3 colors for milestone 1

export const SHOOTER_Y = BOARD_HEIGHT - 70;
export const SHOOTER_X = BOARD_WIDTH / 2;
export const BUBBLE_SPEED = 1200;
