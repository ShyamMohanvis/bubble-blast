import { BUBBLE_RADIUS, BUBBLE_DIAMETER, BUBBLE_SPEED, BOARD_WIDTH, GRID_OFFSET_Y, GRID_OFFSET_X, BOARD_WIDTH_BUBBLES, type BubbleColor, COLORS } from '../config/constants';
import { BubbleGrid } from './BubbleGrid';
import { GridMath } from '../algorithms/GridMath';

export class Shooter {
  public x: number;
  public y: number;
  public activeColor: BubbleColor;
  public nextColor: BubbleColor;
  
  public isShooting: boolean = false;
  public projectileX: number = 0;
  public projectileY: number = 0;
  public projectileAngle: number = -Math.PI / 2;
  
  public shotsRemaining: number = 20;
  
  private velocityX: number = 0;
  private velocityY: number = 0;

  private palette: BubbleColor[] = [...COLORS];

  constructor(x: number, y: number, palette?: BubbleColor[]) {
    this.x = x;
    this.y = y;
    this.setPalette(palette);
    this.activeColor = this.getRandomColor();
    this.nextColor = this.getRandomColor();
  }

  setPalette(palette?: BubbleColor[]) {
    this.palette = palette && palette.length > 0 ? [...palette] : [...COLORS];
  }

  private getRandomColor(): BubbleColor {
    return this.palette[Math.floor(Math.random() * this.palette.length)];
  }

  reload() {
    this.activeColor = this.palette.includes(this.nextColor) ? this.nextColor : this.getRandomColor();
    this.nextColor = this.getRandomColor();
    this.isShooting = false;
  }

  swap() {
    const temp = this.activeColor;
    this.activeColor = this.nextColor;
    this.nextColor = temp;
  }

  shoot(targetX: number, targetY: number) {
    if (this.isShooting || this.shotsRemaining <= 0) return;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    
    // Prevent shooting downwards
    if (dy >= 0) return;

    this.shotsRemaining--;
    
    const angle = Math.atan2(dy, dx);
    this.projectileAngle = angle;

    this.velocityX = Math.cos(angle) * BUBBLE_SPEED;
    this.velocityY = Math.sin(angle) * BUBBLE_SPEED;

    this.projectileX = this.x;
    this.projectileY = this.y;
    this.isShooting = true;
  }

  update(deltaMs: number, grid: BubbleGrid): boolean {
    if (!this.isShooting) return false;

    const dt = deltaMs / 1000;
    this.projectileX += this.velocityX * dt;
    this.projectileY += this.velocityY * dt;

    // Wall bounce
    const leftWall = GRID_OFFSET_X - BUBBLE_RADIUS;
    const rightWall = GRID_OFFSET_X - BUBBLE_RADIUS + (BOARD_WIDTH_BUBBLES * BUBBLE_DIAMETER);

    if (this.projectileX - BUBBLE_RADIUS <= leftWall) {
      this.projectileX = leftWall + BUBBLE_RADIUS;
      this.velocityX *= -1;
    } else if (this.projectileX + BUBBLE_RADIUS >= rightWall) {
      this.projectileX = rightWall - BUBBLE_RADIUS;
      this.velocityX *= -1;
    }

    // Check collision with ceiling
    if (this.projectileY <= GRID_OFFSET_Y) {
      return true; // Collision!
    }

    // Check collision with existing bubbles
    // Check a wider neighborhood to prevent tunneling through dense grids
    const currentGridPos = GridMath.getGridCoordinates(this.projectileX, this.projectileY);
    
    for (let r = Math.max(0, currentGridPos.row - 2); r <= currentGridPos.row + 2; r++) {
      const maxCols = GridMath.getColsInRow(r);
      for (let c = Math.max(0, currentGridPos.col - 2); c <= Math.min(maxCols - 1, currentGridPos.col + 2); c++) {
        if (grid.hasBubble(r, c)) {
          const bubblePixel = GridMath.getPixelCoordinates(r, c);
          const dist = Math.sqrt(
            Math.pow(bubblePixel.x - this.projectileX, 2) + 
            Math.pow(bubblePixel.y - this.projectileY, 2)
          );

          if (dist <= BUBBLE_RADIUS * 2 * 0.9) {
            return true; // Collision!
          }
        }
      }
    }

    return false;
  }
}
