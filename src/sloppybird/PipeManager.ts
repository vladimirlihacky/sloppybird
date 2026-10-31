import { CONFIG } from './config';
import type { Rect } from './types';

export interface PipePair {
  /** Левая граница трубы. */
  x: number;
  /** Y центра щели. */
  gapY: number;
  /** Засчитано ли очко за эту пару. */
  scored: boolean;
}

/** Создаёт, двигает и удаляет трубы. */
export class PipeManager {
  readonly pipes: PipePair[] = [];
  private timeSinceSpawn: number = CONFIG.pipes.spawnInterval; // первая труба появится сразу

  reset(): void {
    this.pipes.length = 0;
    this.timeSinceSpawn = CONFIG.pipes.spawnInterval;
  }

  update(dt: number): void {
    this.timeSinceSpawn += dt;
    if (this.timeSinceSpawn >= CONFIG.pipes.spawnInterval) {
      this.timeSinceSpawn = 0;
      this.spawn();
    }

    for (const pipe of this.pipes) {
      pipe.x -= CONFIG.pipes.speed * dt;
    }

    // Удаляем трубы, полностью ушедшие за левый край
    while (this.pipes.length > 0 && this.pipes[0].x + CONFIG.pipes.width < 0) {
      this.pipes.shift();
    }
  }

  /** Прямоугольники всех труб (верхняя и нижняя часть каждой пары). */
  get colliders(): Rect[] {
    const { width, gap } = CONFIG.pipes;
    const { top: groundTop } = CONFIG.ground;

    return this.pipes.flatMap((pipe) => {
      const gapTop = pipe.gapY - gap / 2;
      const gapBottom = pipe.gapY + gap / 2;
      return [
        { x: pipe.x, y: 0, width, height: gapTop },
        { x: pipe.x, y: gapBottom, width, height: groundTop - gapBottom },
      ];
    });
  }

  private spawn(): void {
    const { gap, edgeMargin, width } = CONFIG.pipes;
    const minY = edgeMargin + gap / 2;
    const maxY = CONFIG.ground.top - edgeMargin - gap / 2;

    this.pipes.push({
      x: CONFIG.canvas.width + width,
      gapY: minY + Math.random() * (maxY - minY),
      scored: false,
    });
  }
}
