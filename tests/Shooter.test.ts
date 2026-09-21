import { describe, expect, it } from 'vitest';
import { Shooter } from '../src/game/Shooter';
import { BubbleGrid } from '../src/game/BubbleGrid';

describe('Shooter projectile lifecycle', () => {
  it('keeps a fired projectile active and moving after the shot starts', () => {
    const shooter = new Shooter(270, 890, ['blue', 'green']);
    const grid = new BubbleGrid();

    shooter.shoot(270, 300);
    const startY = shooter.projectileY;
    shooter.update(16, grid);

    expect(shooter.isShooting).toBe(true);
    expect(shooter.projectileY).toBeLessThan(startY);
    expect(shooter.projectileAngle).toBeLessThan(0);
  });
});