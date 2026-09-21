import type { BubbleColor } from '../config/constants';

export const ATLAS = {
  UI: 'ui',
  GAME: 'game',
  LOADER: 'loader',
} as const;

export const UI = {
  close: 'assets/buttons/closeButton',
  grayBtn: 'assets/buttons/grayButton',
  greenBtn: 'assets/buttons/greenButton',
  helpBtn: 'assets/buttons/helpButton',
  optionsBtn: 'assets/buttons/optionsButton',
  redBtn: 'assets/buttons/redButton',
  soundOn: 'assets/buttons/tumbler_check',
  soundOff: 'assets/buttons/tumbler_uncheck',
  arrow: 'assets/icons/arrow',
  bomb: 'assets/icons/bomb',
  scoreIcon: 'assets/icons/score',
  trophy: 'assets/icons/tournament',
  bubbleBack: 'assets/other/bubbleBack',
  shelter: 'assets/other/shelter',
  sky: 'background/background',
  border: 'background/border',
  field: 'background/field',
  gameLine: 'background/gameLine',
  logo: 'menu/game/logo',
  boostBack: 'menu/game/boostBack',
  queueEmpty: 'menu/game/queueEmpty',
  queueFull: 'menu/game/queueFull',
  scoreBack: 'menu/game/scoreBack',
  hamburger: 'perks/perkButton',
  perkMulti: 'perks/perkMulti_1',
  soundIcon: 'popups/options/soundIcon',
  popup: 'popups/popupBackBase',
  rainbow: 'perks/perkThirdBubble_1',
  hand: 'tutorial/tutorialHand',
} as const;

export const LOADER = {
  bg: 'background.jpg',
  logo: 'preloaderLogo.png',
  icon: 'preloaderIcon.jpg',
  barBack: 'preloaderProgressBarBack.png',
  barFront: 'preloaderProgressBarFront.png',
} as const;

export const GAME = {
  starter: 'gameStarter',
  cursor: 'gameDirectionLineCursor',
  aimDot: 'gameDirectionLine',
  aimArrow: 'gameDirectionLineArrow',
  aimBorder: 'gameDirectionLineBorder',
} as const;

export const BUBBLE_FRAMES: Record<BubbleColor, string> = {
  blue: 'gameItem_blue',
  orange: 'gameItem_yellow',
  green: 'gameItem_green',
  purple: 'gameItem_purple',
  red: 'gameItem_red',
  yellow: 'gameItem_yellow',
};

export const FONT = 'Fredoka, "Trebuchet MS", sans-serif';
