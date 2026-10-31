import { CONFIG } from './config';
import type { Circle } from './types';

/** Птица: хранит физику (позицию и скорость), не знает про отрисовку. */
export class Bird {
  readonly x = CONFIG.bird.x;
  y = CONFIG.canvas.height / 2;
  velocity = 0;

  reset(): void {
    this.y = CONFIG.canvas.height / 2;
    this.velocity = 0;
  }

  flap(): void {
    this.velocity = CONFIG.bird.flapVelocity;
  }

  /** Физика полёта: гравитация + движение. */
  update(dt: number): void {
    const { gravity, maxFallSpeed, radius } = CONFIG.bird;

    this.velocity = Math.min(this.velocity + gravity * dt, maxFallSpeed);
    this.y += this.velocity * dt;

    // Потолок: не даём улететь за экран
    if (this.y < radius) {
      this.y = radius;
      this.velocity = 0;
    }
  }

  /** Лёгкое покачивание на экране ожидания. */
  hover(time: number): void {
    this.y = CONFIG.canvas.height / 2 + Math.sin(time * 4) * 6;
    this.velocity = 0;
  }

  /** Прижать птицу к земле (после проигрыша). */
  landOn(groundTop: number): void {
    this.y = groundTop - CONFIG.bird.radius;
    this.velocity = 0;
  }

  get hitbox(): Circle {
    return { x: this.x, y: this.y, radius: CONFIG.bird.radius };
  }

  /** Угол наклона в радианах: клюв вверх при взлёте, вниз при падении. */
  get rotation(): number {
    const t = this.velocity / CONFIG.bird.maxFallSpeed; // -0.6 … 1
    return Math.max(-0.45, Math.min(1.2, t * 1.2));
  }
}
