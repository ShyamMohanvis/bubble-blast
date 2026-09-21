# Bubble Shooter --- Technical Requirements Document (TRD)

## 1. Technical Objective

Build a browser-native 2D Bubble Shooter using a lightweight web stack.

Recommended stack:

-   HTML5
-   CSS3
-   JavaScript / TypeScript
-   Canvas 2D for gameplay rendering
-   DOM/CSS for menus and HUD
-   Web Audio API for sound
-   `requestAnimationFrame` for the game loop

Optional: - Vite for development/build tooling - TypeScript for stronger
type safety

Do NOT require Unity, Unreal Engine, Blender, or WebGL for the core
implementation.

------------------------------------------------------------------------

## 2. Architecture

``` text
src/
├── main.ts
│
├── core/
│   ├── Game.ts
│   ├── GameLoop.ts
│   ├── GameState.ts
│   ├── InputManager.ts
│   ├── Time.ts
│   └── EventBus.ts
│
├── gameplay/
│   ├── Bubble.ts
│   ├── BubbleGrid.ts
│   ├── Shooter.ts
│   ├── CollisionSystem.ts
│   ├── MatchSystem.ts
│   ├── DropSystem.ts
│   ├── AimSystem.ts
│   ├── LevelManager.ts
│   ├── ScoreSystem.ts
│   └── ComboSystem.ts
│
├── rendering/
│   ├── GameRenderer.ts
│   ├── BubbleRenderer.ts
│   ├── EffectsRenderer.ts
│   └── BackgroundRenderer.ts
│
├── audio/
│   ├── AudioManager.ts
│   └── SoundLibrary.ts
│
├── ui/
│   ├── MainMenu.ts
│   ├── HUD.ts
│   ├── PauseMenu.ts
│   ├── LevelComplete.ts
│   ├── GameOver.ts
│   └── Settings.ts
│
├── data/
│   ├── levels/
│   ├── bubbles.ts
│   └── gameConfig.ts
│
├── persistence/
│   └── SaveManager.ts
│
└── tests/
    ├── grid.test.ts
    ├── matching.test.ts
    ├── collision.test.ts
    └── level.test.ts
```

------------------------------------------------------------------------

## 3. Rendering Architecture

Use a single gameplay canvas.

Separate: - logical game coordinates - canvas pixel coordinates - CSS
display dimensions

Example:

``` text
Logical world
720 × 960
      ↓
Canvas rendering
      ↓
Responsive CSS scaling
      ↓
Desktop / tablet / mobile
```

The game simulation must never depend on CSS pixel dimensions.

------------------------------------------------------------------------

## 4. Game Loop

Use:

``` js
requestAnimationFrame(loop)
```

Structure:

``` text
loop(timestamp)
  ↓
calculate deltaTime
  ↓
process input
  ↓
update game state
  ↓
resolve collisions
  ↓
resolve matches
  ↓
update animations
  ↓
render
```

Clamp `deltaTime` to prevent huge jumps after a tab becomes inactive.

Example:

``` js
dt = Math.min((now - previousTime) / 1000, 0.05);
```

------------------------------------------------------------------------

## 5. State Machine

``` ts
enum GameState {
  BOOT,
  LOADING,
  MENU,
  LEVEL_START,
  PLAYING,
  SHOOTING,
  RESOLVING,
  PAUSED,
  LEVEL_COMPLETE,
  GAME_OVER
}
```

Only valid transitions should be allowed.

Example:

``` text
PLAYING
  ↓ shoot
SHOOTING
  ↓ collision
RESOLVING
  ↓
PLAYING
```

------------------------------------------------------------------------

## 6. Bubble Data Model

``` ts
type BubbleColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "purple";

interface Bubble {
  id: number;
  color: BubbleColor;
  row: number;
  col: number;
  radius: number;
  active: boolean;
  special?: SpecialBubbleType;
}
```

Never use screen coordinates as the authoritative bubble position.

Grid coordinates are authoritative.

------------------------------------------------------------------------

## 7. Hex/Staggered Grid

Use a staggered row layout.

Example:

``` text
● ● ● ● ● ●
 ● ● ● ● ●
● ● ● ● ● ●
 ● ● ● ● ●
```

Recommended logical values:

``` ts
BUBBLE_RADIUS = 24;
HORIZONTAL_SPACING ≈ 48;
VERTICAL_SPACING ≈ 42;
```

Actual values should be derived from configuration.

Do not hardcode geometry throughout the codebase.

------------------------------------------------------------------------

## 8. Grid Coordinate System

Use:

``` ts
interface GridPosition {
  row: number;
  col: number;
}
```

For even/odd rows, define neighbor offsets.

Example:

``` text
even row:
(-1,-1)
(-1, 0)
(0,-1)
(0,1)
(1,-1)
(1,0)

odd row:
(-1,0)
(-1,1)
(0,-1)
(0,1)
(1,0)
(1,1)
```

Create one authoritative function:

``` ts
getNeighbors(row, col)
```

All match/drop logic must use it.

------------------------------------------------------------------------

## 9. World Coordinate Conversion

Provide:

``` ts
gridToWorld(row, col)
worldToGrid(x, y)
```

`gridToWorld` converts a logical cell to the bubble center.

`worldToGrid` finds the nearest valid grid position after collision.

Do not duplicate these calculations in collision and rendering code.

------------------------------------------------------------------------

## 10. Shooter

``` ts
interface ShooterState {
  angle: number;
  currentBubble: Bubble;
  nextBubble: Bubble;
  projectile: Projectile | null;
}
```

Constraints:

``` text
minAngle
maxAngle
```

Prevent aiming directly outside the playable region.

------------------------------------------------------------------------

## 11. Aim System

Mouse/touch position:

``` text
pointer position
      ↓
convert to world coordinates
      ↓
calculate vector
      ↓
atan2()
      ↓
clamp angle
```

Trajectory:

``` ts
direction = {
  x: Math.cos(angle),
  y: Math.sin(angle)
}
```

------------------------------------------------------------------------

## 12. Projectile Physics

Bubble projectile uses deterministic movement.

``` ts
position += velocity * dt;
```

Wall collision:

``` text
if x < left:
    x = left
    velocity.x *= -1

if x > right:
    x = right
    velocity.x *= -1
```

Top collision ends the projectile flight.

------------------------------------------------------------------------

## 13. Bubble Collision

Collision test:

``` text
distance(projectile, bubble)
    <= projectile.radius + bubble.radius
```

Use spatial optimization if the board becomes large.

V1 can check nearby occupied cells rather than every bubble.

------------------------------------------------------------------------

## 14. Bubble Attachment

After collision:

1.  Calculate candidate grid cells.
2.  Select the nearest valid cell.
3.  Ensure the cell is inside the grid.
4.  Insert bubble.
5.  Begin resolution.

Never attach a bubble to an occupied cell.

------------------------------------------------------------------------

## 15. Match Detection

After attachment:

``` ts
findConnectedSameColor(startCell)
```

Use BFS or DFS.

Algorithm:

``` text
start
 ↓
visit same-color neighbors
 ↓
continue until no same-color neighbor remains
 ↓
return group
```

If:

``` ts
group.length >= 3
```

remove group.

------------------------------------------------------------------------

## 16. Drop Detection

After matches are removed:

1.  Find all bubbles connected to the ceiling.
2.  Mark them as supported.
3.  Any remaining bubble is unsupported.
4.  Drop unsupported bubbles.

Algorithm:

``` text
ceiling bubbles
      ↓
BFS through all connected bubbles
      ↓
supported set
      ↓
all bubbles - supported
      ↓
falling bubbles
```

This is separate from same-color matching.

------------------------------------------------------------------------

## 17. Resolution Pipeline

``` text
Bubble attached
      ↓
Find same-color group
      ↓
group >= 3?
  ├── NO → miss handling
  └── YES
        ↓
     remove group
        ↓
     calculate supported bubbles
        ↓
     remove/drop unsupported bubbles
        ↓
     score
        ↓
     combo
        ↓
     level objective
        ↓
     next shot
```

------------------------------------------------------------------------

## 18. Miss System

Configuration:

``` ts
interface MissConfig {
  missesBeforeCeilingAdvance: number;
  enabled: boolean;
}
```

Example:

``` text
miss 1
miss 2
miss 3
miss 4
↓
new bubble row
↓
reset miss counter
```

The exact threshold should be level-specific.

------------------------------------------------------------------------

## 19. Level Data

Levels must be data-driven.

Example:

``` json
{
  "id": 1,
  "colors": ["blue", "red", "yellow"],
  "objective": {
    "type": "clear_all"
  },
  "missesBeforeAdvance": 6,
  "layout": [
    ["blue", "blue", "red", "red"],
    ["blue", "yellow", "yellow", "red"]
  ]
}
```

Do not encode individual levels directly in gameplay code.

------------------------------------------------------------------------

## 20. Level Manager

Responsibilities:

-   load level
-   validate level
-   create starting grid
-   configure available colors
-   configure objective
-   detect completion
-   detect failure
-   transition to next level

------------------------------------------------------------------------

## 21. Score System

``` ts
interface ScoreEvent {
  type:
    | "MATCH"
    | "DROP"
    | "COMBO"
    | "LEVEL_COMPLETE";

  amount: number;
}
```

Centralize scoring.

Do not modify score directly from rendering or UI.

------------------------------------------------------------------------

## 22. Animation System

Use an animation manager for:

-   bubble pop
-   bubble fall
-   score float
-   combo text
-   particles
-   level completion

Animations should be independent of the logical game state.

A bubble can visually animate after it has already been removed from the
grid.

------------------------------------------------------------------------

## 23. Object Pooling

Pool frequently created objects:

``` text
Bubble projectile
Particle
Pop effect
Floating score
Combo effect
```

Avoid:

``` js
new Particle()
```

hundreds of times per second.

------------------------------------------------------------------------

## 24. Rendering

Recommended draw order:

``` text
1. Background
2. Decorative background elements
3. Board boundary
4. Bubbles
5. Aim trajectory
6. Shooter
7. Particles/effects
8. UI overlays
```

Do not render DOM elements for every bubble.

------------------------------------------------------------------------

## 25. Responsive Canvas

Use a logical resolution.

Example:

``` ts
const WORLD_WIDTH = 720;
const WORLD_HEIGHT = 960;
```

Calculate scale:

``` ts
scaleX = canvas.clientWidth / WORLD_WIDTH;
scaleY = canvas.clientHeight / WORLD_HEIGHT;
```

Maintain aspect ratio.

Do not stretch independently on X/Y.

------------------------------------------------------------------------

## 26. Mobile Input

Use Pointer Events:

``` text
pointerdown
pointermove
pointerup
```

Avoid separate mouse and touch implementations where possible.

Input flow:

``` text
pointer position
      ↓
screen → canvas coordinates
      ↓
canvas → world coordinates
      ↓
aim angle
```

Prevent accidental browser gestures only inside the gameplay interaction
area.

------------------------------------------------------------------------

## 27. Mobile Browser Compatibility

Support:

-   Chrome Android
-   Safari iOS
-   Chrome iOS
-   Firefox Android
-   Samsung Internet

Requirements:

-   no horizontal page scrolling
-   no hover dependency
-   touch targets \>= 44px
-   responsive canvas
-   safe-area support
-   dynamic browser toolbar changes
-   portrait and landscape
-   device pixel ratio support

Do not depend on fixed `100vh`.

------------------------------------------------------------------------

## 28. Device Pixel Ratio

Use:

``` ts
const dpr = Math.min(window.devicePixelRatio || 1, 2);
```

Set actual canvas resolution using DPR while keeping CSS size
responsive.

This prevents blurry bubbles on high-density screens without excessive
memory use.

------------------------------------------------------------------------

## 29. Audio Architecture

``` ts
class AudioManager {
  playSfx(name: string): void;
  setSfxEnabled(enabled: boolean): void;
  setMusicEnabled(enabled: boolean): void;
}
```

Do not create a new AudioContext for every sound.

Use one shared audio context.

Respect browser autoplay restrictions.

Initialize/resume audio after the first user interaction.

------------------------------------------------------------------------

## 30. Persistence

Use a storage abstraction:

``` ts
interface SaveManager {
  getProgress(): Progress;
  saveProgress(progress: Progress): void;
  getSettings(): Settings;
  saveSettings(settings: Settings): void;
}
```

Do not call browser storage directly throughout the application.

------------------------------------------------------------------------

## 31. UI Architecture

Use DOM/CSS for:

-   Main menu
-   HUD
-   Pause
-   Difficulty/settings
-   Level complete
-   Game over

Use Canvas for:

-   bubbles
-   shooter
-   trajectory
-   gameplay particles
-   board effects

This separation keeps UI accessible and gameplay performant.

------------------------------------------------------------------------

## 32. Settings

V1:

``` text
Sound Effects   ON/OFF
Music           ON/OFF
Reduced Motion  ON/OFF / system
```

Persist settings.

------------------------------------------------------------------------

## 33. Input Locking

Use:

``` ts
inputLocked: boolean
```

Lock input during:

-   projectile flight
-   match resolution
-   drop animation
-   level completion
-   game over
-   pause

Do not process a second shot while the first shot is resolving.

------------------------------------------------------------------------

## 34. Game Loop Safety

When pausing:

-   stop gameplay updates
-   preserve state
-   preserve current projectile state if pause occurs mid-shot
-   resume without duplicating animation frames

When restarting:

-   cancel current animation
-   clear projectile
-   reset board
-   reset timers
-   reset listeners if necessary

There must never be duplicate `requestAnimationFrame` loops.

------------------------------------------------------------------------

## 35. Collision Safety

Every projectile must have a lifecycle:

``` text
READY
→ FLYING
→ COLLIDED
→ ATTACHED
→ RESOLVING
→ DESTROYED
```

Never process collision twice for one projectile.

------------------------------------------------------------------------

## 36. Testing Strategy

### Unit tests

Test:

-   grid neighbors
-   world/grid conversion
-   matching
-   drop detection
-   collision
-   scoring
-   level objectives
-   miss counter

### Gameplay tests

Test:

-   shoot
-   match 3
-   match 4+
-   no match
-   drop cluster
-   wall bounce
-   ceiling collision
-   restart
-   pause
-   resume
-   level completion
-   game over

### Device tests

Test:

``` text
320×568
360×640
375×667
390×844
412×915
430×932
768×1024
1024×768
1280×720
1440×900
1920×1080
```

------------------------------------------------------------------------

## 37. Critical Edge Cases

The implementation must handle:

-   full board
-   no valid attachment location
-   projectile hitting between bubbles
-   projectile touching two bubbles simultaneously
-   bubble attached near a wall
-   match created at ceiling
-   entire cluster dropping
-   last bubble removed
-   level completed during a drop animation
-   restart during projectile flight
-   pause during projectile flight
-   rapid taps
-   pointer leaving canvas
-   browser tab backgrounding
-   resize during gameplay

------------------------------------------------------------------------

## 38. Performance Budget

Targets:

-   60 FPS where device permits
-   \< 16.7ms frame budget at 60 FPS
-   bounded particle count
-   bounded object count
-   no per-frame DOM tree rebuild
-   no memory leak after 100 restarts
-   no repeated event listener registration

Use profiling before adding expensive effects.

------------------------------------------------------------------------

## 39. Build and Deployment

Recommended:

``` text
Vite
TypeScript
HTML
CSS
Canvas 2D
```

Development:

``` bash
npm install
npm run dev
```

Production:

``` bash
npm run build
```

Deployment targets: - GitHub Pages - Netlify - Vercel - static hosting

The production build must work from a configurable base path so GitHub
Pages deployment does not break asset URLs.

------------------------------------------------------------------------

## 40. Security / Reliability

Do not use: - `eval` - dynamically executed untrusted code - inline
third-party scripts without a reason - unnecessary external dependencies

Validate level JSON before loading.

Gracefully handle missing assets.

Never allow invalid level data to crash the game.

------------------------------------------------------------------------

## 41. Suggested Implementation Phases

### Phase 1 --- Foundation

-   project setup
-   canvas
-   responsive layout
-   game loop
-   state machine

### Phase 2 --- Grid

-   staggered grid
-   bubble model
-   grid/world conversion
-   level loader

### Phase 3 --- Shooting

-   shooter
-   aiming
-   projectile
-   wall bounce
-   collision
-   attachment

### Phase 4 --- Puzzle Logic

-   match detection
-   drop detection
-   miss system
-   score

### Phase 5 --- Progression

-   objectives
-   level completion
-   game over
-   level data

### Phase 6 --- UI

-   menu
-   HUD
-   pause
-   settings
-   completion screen

### Phase 7 --- Effects

-   bubble pop
-   drop animation
-   particles
-   audio
-   combo feedback

### Phase 8 --- Mobile

-   touch
-   responsive canvas
-   safe-area
-   orientation
-   browser compatibility

### Phase 9 --- QA

-   automated tests
-   device tests
-   performance profiling
-   restart/pause stress testing

### Phase 10 --- Deployment

-   production build
-   GitHub Pages/Netlify/Vercel
-   final asset audit
-   performance check

------------------------------------------------------------------------

## 42. Definition of Done

The Bubble Shooter is production-ready for V1 when:

-   [ ] Game loads without errors
-   [ ] First level starts reliably
-   [ ] Mouse aiming works
-   [ ] Touch aiming works
-   [ ] Shooting works
-   [ ] Wall bouncing works
-   [ ] Collision works
-   [ ] Grid snapping works
-   [ ] Match-3 works
-   [ ] Large matches work
-   [ ] Unsupported bubble detection works
-   [ ] Falling animation works
-   [ ] Miss system works
-   [ ] Score works
-   [ ] Combo works
-   [ ] Level objective works
-   [ ] Win state works
-   [ ] Lose state works
-   [ ] Pause works
-   [ ] Restart works
-   [ ] Settings work
-   [ ] Sound works
-   [ ] Mobile browsers work
-   [ ] Desktop browsers work
-   [ ] No horizontal overflow
-   [ ] No duplicate game loops
-   [ ] No duplicate event listeners
-   [ ] No major memory growth after repeated restarts
-   [ ] Reduced-motion mode works
-   [ ] Production build deploys correctly

------------------------------------------------------------------------

## 43. Recommended Technical Principle

Keep the implementation separated into:

``` text
INPUT
  ↓
GAME STATE
  ↓
GAME LOGIC
  ↓
ANIMATION STATE
  ↓
RENDERER
  ↓
UI
```

Never make the renderer responsible for deciding game rules.

Never make UI components directly mutate the bubble grid.

Never make visual animation the source of truth for gameplay.

The logical game state must always be authoritative.
