export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/** Состояния игры: ожидание старта → игра → конец. */
export type GameState = 'ready' | 'playing' | 'gameover';
