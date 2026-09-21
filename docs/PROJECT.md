# Bubble Blast Project Documentation

This document is the implementation guide for Bubble Blast. The product and
technical requirements are kept separately in [Bubble_Shooter_PRD.md](../Bubble_Shooter_PRD.md)
and [Bubble_Shooter_TRD.md](../Bubble_Shooter_TRD.md). This guide describes the
code that currently exists and calls out requirements that are planned rather
than implemented.

## Quick Start

Requirements:

- Node.js with npm
- A modern browser with Canvas and Web Audio support

From the repository root:

```bash
npm install
npm run dev
```

The Vite development server normally runs at `http://localhost:5173/`.

Production checks:

```bash
npm run build
npm run preview
```

The build command runs TypeScript compilation followed by the Vite production
build. There is currently no test or lint script in `package.json`.

## Runtime Architecture

The game is a Phaser application written in TypeScript and bundled with Vite.
Phaser owns the logical game canvas, scenes, input, animation, and Arcade
physics. The logical play area is `540 x 960` and Phaser scales it with
`Phaser.Scale.FIT` so gameplay coordinates remain independent of screen size.

Startup flow:

```text
index.html
  -> src/main.ts
  -> Phaser.Game(gameConfig)
  -> BootScene
  -> PreloadScene
  -> MenuScene
  -> LevelSelectScene or GameScene
```

`src/main.ts` also resumes the Web Audio context after the first browser
interaction and prevents touch scrolling while the game is being played.

## Source Map

| Area | Responsibility |
| --- | --- |
| `src/main.ts` | Creates the Phaser game and installs browser-level input/audio handling. |
| `src/config/constants.ts` | Logical board dimensions, bubble geometry, speed, coordinates, and colors. |
| `src/config/gameConfig.ts` | Phaser renderer, scale mode, input capture, physics, and scene order. |
| `src/scenes/BootScene.ts` | Loads the loader atlas and waits for fonts before continuing. |
| `src/scenes/PreloadScene.ts` | Loads shared atlases and level JSON resources. |
| `src/scenes/MenuScene.ts` | Main menu and entry point into play. |
| `src/scenes/LevelSelectScene.ts` | Displays and starts unlocked levels. |
| `src/scenes/GameScene.ts` | Builds the board, handles aiming/shooting, resolves matches, updates score, and controls pause/win/lose flow. |
| `src/game/BubbleGrid.ts` | Authoritative occupied-cell map and nearest-empty-cell lookup. |
| `src/game/Shooter.ts` | Current/next bubble state and projectile movement. |
| `src/game/Level.ts` | Converts a level grid into `BubbleGrid` bubble data. |
| `src/algorithms/GridMath.ts` | Converts grid cells to world coordinates and provides staggered-grid neighbors. |
| `src/algorithms/MatchFinder.ts` | Breadth-first same-color cluster detection. |
| `src/algorithms/FloatingBubbleFinder.ts` | Breadth-first detection of bubbles disconnected from row zero. |
| `src/ui/HUD.ts` and `src/ui/UiFactory.ts` | HUD, buttons, overlays, and shared UI styling helpers. |
| `src/systems/SaveSystem.ts` | Local progress and sound settings persistence. |
| `src/assets/keys.ts` | Texture atlas and frame key constants. |
| `public/assets/` | Runtime atlases, JSON data, and audio files served by Vite. |
| `public/levels/` | Runtime level JSON resources loaded by `PreloadScene`. |

## Gameplay Resolution

The logical state is stored in `BubbleGrid`; sprites are a visual projection
of that state. A normal shot follows this path:

1. The pointer determines an aim direction and the shooter fires its active
   bubble.
2. `Shooter` advances the projectile and handles wall/board collision checks.
3. `BubbleGrid.getNearestEmptyCell` selects an available staggered-grid cell.
4. `MatchFinder.findMatchingCluster` runs BFS from the attached bubble.
5. A cluster of three or more matching bubbles is removed.
6. `FloatingBubbleFinder.findFloatingBubbles` finds bubbles no longer linked
   to row zero; those bubbles are removed with drop feedback.
7. Score, shots, HUD state, and the next shooter bubble are updated.
8. An empty grid completes the level; exhausted shots or the death line can
   end the level.

The match and floating-bubble algorithms both use `GridMath.getNeighbors`, so
the staggered-grid rules have one shared source of truth.

## Level Data

Levels are JSON resources named `level-001`, `level-002`, and so on. The
runtime schema uses an identifier and a character grid:

```json
{
  "id": 1,
  "grid": [
    ["B", "B", "O", "O"],
    ["B", "G", "G", "O"]
  ]
}
```

The current character mapping is:

| Character | Color |
| --- | --- |
| `B` | blue |
| `O` | orange |
| `G` | green |
| `P` | purple |
| `R` | red |
| `Y` | orange |

`Y` currently maps to orange in `src/game/Level.ts`; use `O` for orange when
authoring new levels unless that behavior is intentionally changed.

The `colors` property described in the TRD is not currently consumed by the
loader. Available colors are inferred from the grid and the shooter uses those
colors for the level. Note that `LevelConfig` still declares `colors` as a
required TypeScript property, so the interface and the runtime JSON schema are
currently out of sync; resolve that mismatch before adding typed level
validation.

To add a level:

1. Add the JSON file under `public/levels/`.
2. Use the filename expected by `PreloadScene`, such as
  `public/levels/level-001.json`.
3. Keep rows within the configured board width and use only supported codes.
4. Run `npm run build` before testing it in the browser.

## Persistence

`SaveSystem` stores JSON under the localStorage key
`bubble_blast_save_data`:

```ts
interface SaveData {
  unlockedLevel: number;
  sound: boolean;
}
```

The default state unlocks level 1 and enables sound. Progress is advanced
through `unlockLevel`; sound is toggled through `toggleSound`. A malformed
save falls back to defaults after logging a parse error. Clearing site data
resets local progress.

## Controls and UI

- Desktop and mobile pointer input are handled through Phaser pointer events.
- The aim trajectory is shown before firing.
- The current and next bubbles can be swapped when the shooter is idle.
- Pause, restart, home, and sound controls are available through the HUD and
  pause overlay.
- Phaser's FIT scale preserves the logical aspect ratio across viewport sizes.

The PRD/TRD also describe keyboard aiming/shooting, settings screens, reduced
motion, and a broader objective system. Those are requirements for future work,
not guarantees of the current build.

## Implementation Status

Implemented in the current codebase:

- Phaser scene boot, preload, menu, level selection, and gameplay flow
- Fixed logical board with responsive FIT scaling
- Pointer aiming, projectile movement, wall bounce, collision, and grid snap
- Match-three detection using BFS
- Unsupported bubble detection using ceiling connectivity
- Score and remaining-shot HUD updates
- Bubble swap, pause, restart, home, win, and game-over paths
- Sound toggle and localStorage progress persistence
- Ten level JSON resources

Not yet represented as complete systems:

- Multiple objective types such as target colors, rescue/drop, and score target
- Configurable miss/ceiling-advance rules
- Combo scoring and combo UI
- Keyboard controls and explicit accessibility mode
- Reduced-motion preferences and automated unit/E2E test suites
- Object pooling and a dedicated analytics event bus
- Special bubbles such as bomb, rainbow, lightning, and locked bubbles

When requirements change, update the PRD/TRD first, then update this status
section after the corresponding implementation and verification are complete.

## Verification Checklist

For a local change, run:

```bash
npm run build
npm run dev
```

Then manually verify the changed flow in a desktop and mobile-sized viewport:

- The game loads through Boot and Preload without console errors.
- A level can be opened from the menu or level select screen.
- A shot can be aimed, fired, attached, and resolved once.
- A match removes bubbles and a disconnected group drops.
- Pause, resume, restart, and home do not duplicate input or animation state.
- Sound state and unlocked progress survive a page reload.
- The board has no horizontal overflow.