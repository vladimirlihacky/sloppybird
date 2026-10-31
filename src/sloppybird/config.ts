/**
 * Все «магические числа» игры живут здесь.
 * Единицы: пиксели и секунды (скорости — пикселей в секунду).
 */
const WIDTH = 400;
const HEIGHT = 600;
const GROUND_HEIGHT = 80;

export const CONFIG = {
  canvas: {
    width: WIDTH,
    height: HEIGHT,
  },

  ground: {
    height: GROUND_HEIGHT,
    /** Y-координата верхней границы земли. */
    top: HEIGHT - GROUND_HEIGHT,
  },

  bird: {
    x: 90,
    radius: 14,
    gravity: 1500,
    flapVelocity: -440,
    maxFallSpeed: 720,
  },

  pipes: {
    width: 64,
    gap: 150,
    speed: 160,
    /** Как часто появляются трубы, сек. */
    spawnInterval: 1.6,
    /** Минимальный отступ щели от потолка и от земли. */
    edgeMargin: 50,
    capHeight: 22,
    capOverhang: 4,
  },

  /** Сколько секунд после проигрыша игнорировать ввод (защита от случайного рестарта). */
  restartDelay: 0.5,

  storageKey: 'floppy-bird:best-score',

  colors: {
    skyTop: '#8fd3e8',
    skyBottom: '#e4f5ea',
    pipe: '#2f7d5b',
    pipeCap: '#25644a',
    pipeHighlight: '#4a9c78',
    ground: '#dcb676',
    groundStripe: '#c99d55',
    groundEdge: '#7a5a2b',
    birdBody: '#ffc93c',
    birdWing: '#f29e1f',
    birdBeak: '#ff6b4a',
    birdEye: '#1f2a33',
    text: '#ffffff',
    textShadow: 'rgba(31, 42, 51, 0.55)',
    overlay: 'rgba(31, 42, 51, 0.35)',
  },

  font: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
} as const;
