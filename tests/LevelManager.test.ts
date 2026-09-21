import { describe, expect, it } from 'vitest';
import { LevelManager } from '../src/game/LevelManager';

describe('LevelManager', () => {
  it('increments a completed level exactly once', () => {
    const manager = new LevelManager(1);

    expect(manager.completeLevel()).toBe(2);
    expect(manager.completeLevel()).toBe(2);
  });

  it('does not advance beyond the final catalog level', () => {
    const manager = new LevelManager(30);

    expect(manager.completeLevel()).toBe(30);
  });

  it('increases difficulty through the configured tiers', () => {
    const manager = new LevelManager(1);
    const first = manager.getDifficulty(1);
    const fifth = manager.getDifficulty(5);
    const eighth = manager.getDifficulty(8);

    expect(first.colors).toHaveLength(2);
    expect(fifth.colors.length).toBeGreaterThan(first.colors.length);
    expect(eighth.rows).toBeGreaterThan(fifth.rows);
    expect(eighth.missesBeforeAdvance).toBeLessThan(fifth.missesBeforeAdvance);
  });

  it('generates different valid formations for successive levels', () => {
    const manager = new LevelManager(1);

    const first = manager.generateLevel(1).grid;
    const second = manager.generateLevel(2).grid;

    expect(second).not.toEqual(first);
    expect(second.length).toBeGreaterThan(0);
    expect(second.every((row, index) => row.length === (index % 2 === 0 ? 11 : 10))).toBe(true);
  });
});