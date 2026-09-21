# Bubble Shooter --- Product Requirements Document (PRD)

## 1. Product Overview

**Product name:** Bubble Shooter\
**Platform:** Browser / Web\
**Primary devices:** Desktop, tablet, mobile\
**Genre:** Casual arcade / puzzle\
**Core mechanic:** Aim and shoot colored bubbles. Match 3+ bubbles of
the same color to clear them. Clear the level objective before the
player runs out of shots/misses or fails the level condition.

### Product vision

Create a polished, browser-first Bubble Shooter game with the instant
readability and accessibility of a modern casual game portal. The game
should load quickly, work without installation, be playable with
mouse/touch, and provide satisfying shooting, matching, falling, combo,
and win/lose feedback.

The game should have an original visual identity. It may use the general
Bubble Shooter genre conventions, but it must not copy another game's
protected artwork, branding, exact level layouts, UI assets, or
proprietary content.

------------------------------------------------------------------------

## 2. Goals

### Primary goals

1.  Make the first shot possible within seconds of loading.
2.  Make aiming and shooting intuitive on desktop and mobile.
3.  Make bubble matching visually obvious.
4.  Provide satisfying feedback for:
    -   shot
    -   match
    -   chain reaction
    -   unsupported bubble drop
    -   combo
    -   level completion
    -   failure
5.  Provide a scalable level system.
6.  Maintain smooth performance on ordinary mobile browsers.
7.  Support keyboard, mouse, touch, and responsive layouts.
8.  Keep game state deterministic enough for replay/debugging.

### Non-goals for V1

-   Real-time multiplayer
-   Accounts/login
-   Cloud saves
-   Social chat
-   Complex economy
-   In-game purchases
-   Advertising integration
-   Procedurally generated infinite content
-   Full 3D physics

------------------------------------------------------------------------

## 3. Target Experience

The player should understand the game without reading a manual:

**Aim → Shoot → Match 3+ → Clear → Drop → Complete objective → Next
level**

The game should feel: - fast - colorful - responsive - forgiving at
first - progressively challenging - satisfying without excessive visual
clutter

------------------------------------------------------------------------

## 4. Core Gameplay

### 4.1 Game board

The board contains a staggered/hexagonal grid of bubbles.

Each bubble has: - color - grid coordinate - visual state - optional
special type

Supported base colors: - red - orange - yellow - green - cyan/blue -
purple

The number of colors should increase with level difficulty.

### 4.2 Shooter

The bottom of the board contains: - bubble launcher - current bubble -
next bubble preview - aim direction - optional trajectory guide

The player aims with: - mouse movement - touch drag - pointer position

The player fires with: - mouse click - touch release/tap - optional
Space key

### 4.3 Shooting

A fired bubble travels along the aim vector.

The bubble: 1. leaves the launcher 2. moves continuously 3. bounces from
allowed side walls 4. collides with the ceiling or another bubble 5.
snaps to the nearest valid grid location

The shot must never stop at an invalid grid coordinate.

### 4.4 Matching

After a bubble snaps: 1. Find connected bubbles of the same color. 2. If
connected count \>= 3, remove them. 3. Identify bubbles still connected
to the ceiling. 4. Any unsupported bubbles fall. 5. Award score. 6.
Apply combo effects. 7. Load the next bubble.

### 4.5 Minimum match

Default:

**3 matching bubbles = clear**

Configuration must be data-driven so levels can alter special rules
later.

### 4.6 No-match shot

If the newly attached bubble does not create a match: - increase
miss/shot counter - optionally advance the ceiling downward after a
configurable number of misses - continue the game

The player should receive a clear but non-intrusive indication of the
penalty.

------------------------------------------------------------------------

## 5. Level Objectives

V1 should support these objective types:

### Clear all

Remove every bubble.

### Clear target colors

Remove a specified number of bubbles of selected colors.

### Rescue/drop

Drop all bubbles of a target type.

### Score target

Reach a minimum score before the board reaches the failure threshold.

The level configuration should specify: - starting layout - available
colors - target - shot/miss limit - ceiling advance rules - bubble
speed - special bubble availability

------------------------------------------------------------------------

## 6. Difficulty Progression

### Early levels

-   2--3 colors
-   large matching opportunities
-   forgiving trajectory
-   low penalty
-   simple formations

### Mid levels

-   4--5 colors
-   narrower openings
-   more unsupported structures
-   increasing miss pressure
-   occasional special bubbles

### Advanced levels

-   5--6 colors
-   constrained shots
-   complex formations
-   more aggressive ceiling progression
-   special obstacles

Difficulty should increase through level design rather than simply
making bubbles move faster.

------------------------------------------------------------------------

## 7. Scoring

Suggested scoring model:

-   matched bubble: `10`
-   dropped unsupported bubble: `20`
-   combo multiplier: configurable
-   large drop: bonus
-   level completion: level bonus
-   remaining shots/misses: optional bonus

Example:

`score = matchScore + dropScore + comboBonus + levelBonus`

The exact values must be configurable.

------------------------------------------------------------------------

## 8. Combo System

A combo occurs when: - multiple match groups are cleared in a sequence,
or - a single shot causes a large drop.

Example:

Combo x2\
Combo x3\
Combo x4

Combo UI should: - appear briefly - scale/pulse - disappear
automatically - never block gameplay

------------------------------------------------------------------------

## 9. Bubble Colors

Every bubble color must have: - high contrast - a consistent identity -
sufficient distinction for color-blind users

Do not rely only on color.

Optional accessibility enhancement: - subtle pattern/highlight
variation - color labels in accessibility mode

------------------------------------------------------------------------

## 10. Special Bubbles --- V1.5 / Optional

Architecture should support:

### Bomb bubble

Clears nearby bubbles.

### Rainbow bubble

Matches any color.

### Lightning bubble

Clears a row/column.

### Stone/locked bubble

Cannot be removed normally.

Special bubbles should be disabled in early levels.

------------------------------------------------------------------------

## 11. Game States

Required state machine:

``` text
BOOT
  ↓
LOADING
  ↓
MAIN_MENU
  ↓
LEVEL_SELECT / LEVEL_START
  ↓
PLAYING
  ↓
SHOT_RESOLUTION
  ↓
PLAYING
  ↓
LEVEL_COMPLETE
  ↓
NEXT_LEVEL

PLAYING → PAUSED
PAUSED → PLAYING

PLAYING → GAME_OVER
```

No input should be accepted when the game state does not permit it.

------------------------------------------------------------------------

## 12. Main Menu

Main menu should contain:

-   game logo/title
-   Play button
-   optional Level Select
-   Settings
-   How to Play

Keep the initial screen uncluttered.

Primary CTA:

**PLAY**

Clicking Play starts the configured first/current level.

------------------------------------------------------------------------

## 13. In-Game UI

Desktop:

``` text
┌──────────────────────────────────────────────┐
│ Pause   LEVEL 01     SCORE 1200      ❤️ 3    │
│                                              │
│              BUBBLE BOARD                    │
│                                              │
│                                              │
│                 AIM                          │
│                /                             │
│               ○                              │
│          Current   Next                      │
└──────────────────────────────────────────────┘
```

Mobile: - top HUD becomes compact - board remains dominant - shooter
remains reachable - controls stay within thumb-friendly area

Required UI: - pause - level/objective - score - current bubble - next
bubble - remaining misses/shots when applicable

------------------------------------------------------------------------

## 14. Visual Direction

Use an original, modern arcade aesthetic.

Recommended direction: - deep blue/purple background - bright bubble
colors - soft gradients - glossy bubbles - subtle particles - neon
accents - readable HUD - strong contrast

Do not make every element glow.

The bubbles and gameplay should remain the visual focus.

------------------------------------------------------------------------

## 15. Bubble Rendering

Each bubble should have: - radial/linear gradient - specular highlight -
soft shadow - subtle rim light - optional small reflection

Avoid flat circles.

Bubble appearance should communicate: - color - depth - state - special
status

------------------------------------------------------------------------

## 16. Animation Requirements

### Shooting

-   smooth acceleration/deceleration
-   no teleporting

### Collision

-   subtle impact effect

### Match

-   bubbles scale/fade/pop
-   particles
-   optional sound

### Drop

-   bubbles detach
-   fall with gravity-like animation
-   slight rotation
-   bounce or pop on impact

### Level completion

-   celebratory particles
-   score animation
-   clear success state

Animations must respect `prefers-reduced-motion`.

------------------------------------------------------------------------

## 17. Audio

V1 sound categories:

-   shoot
-   wall bounce
-   bubble attach
-   match
-   pop
-   drop
-   combo
-   button click
-   level complete
-   game over

Settings: - master volume - sound effects toggle - music toggle

Audio must initialize only after browser interaction where required.

------------------------------------------------------------------------

## 18. Controls

### Desktop

Mouse: - move = aim - click = shoot

Keyboard: - A/D or Left/Right = adjust aim - Space/Enter = shoot -
Escape = pause

### Mobile

Touch: - drag = aim - release/tap = shoot

Controls must not require hover.

------------------------------------------------------------------------

## 19. Camera / Play Area

The game should use a fixed 2D play area with responsive scaling.

The logical game coordinates must remain independent of screen pixels.

Example logical board:

`720 × 960`

Render it responsively into the browser.

Never change gameplay geometry simply because the device is wider.

------------------------------------------------------------------------

## 20. Pause

Pause should: - stop gameplay updates - stop shot movement - pause
animations where appropriate - pause timers if used - mute/duck gameplay
audio if appropriate

Options: - Resume - Restart - How to Play - Main Menu

------------------------------------------------------------------------

## 21. Win Condition

When the level objective is complete:

1.  stop gameplay
2.  resolve remaining animations
3.  calculate final score
4.  show:
    -   Level Complete
    -   Score
    -   Stars/rating
    -   Next Level
    -   Replay

------------------------------------------------------------------------

## 22. Lose Condition

When failure condition is reached:

Show: - Game Over - score - Retry - Main Menu

Do not reset silently.

------------------------------------------------------------------------

## 23. Persistence

V1 local persistence may store: - highest unlocked level - best score -
stars - settings

If browser persistence is used, isolate it behind a storage service so
it can later be replaced by a backend.

------------------------------------------------------------------------

## 24. Accessibility

Support: - keyboard controls - visible focus - readable text -
sufficient contrast - reduced motion - non-color-only feedback - large
touch targets

Target touch size: **44×44 CSS px minimum**

------------------------------------------------------------------------

## 25. Performance Targets

Target: - 60 FPS on normal desktop - 60 FPS on modern mobile where
practical - fast initial load - no unnecessary allocations during every
frame - no memory growth after restarting levels

Use object pooling for: - bubbles - particles - pop effects

Avoid creating/destroying hundreds of DOM elements per shot.

------------------------------------------------------------------------

## 26. Analytics-Ready Events

Architecture should support events such as:

-   game_loaded
-   level_started
-   shot_fired
-   bubble_matched
-   bubbles_dropped
-   combo_created
-   level_completed
-   level_failed
-   game_restarted
-   pause_opened

Analytics integration is not required for V1.

------------------------------------------------------------------------

## 27. Acceptance Criteria

The game is acceptable when:

-   [ ] First level can be started immediately
-   [ ] Player can aim with mouse
-   [ ] Player can aim with touch
-   [ ] Player can shoot
-   [ ] Bubble collision works
-   [ ] Bubble snapping works
-   [ ] Match-3 detection works
-   [ ] Unsupported bubbles fall
-   [ ] Score updates correctly
-   [ ] Next bubble works
-   [ ] Level objective works
-   [ ] Win state works
-   [ ] Lose state works
-   [ ] Pause works
-   [ ] Restart works
-   [ ] Mobile layout works
-   [ ] Desktop layout works
-   [ ] No horizontal overflow
-   [ ] 60 FPS target is approached
-   [ ] Game can restart without duplicated timers/listeners
