import { Bird } from './Bird';
import { circleIntersectsRect } from './collision';
import { CONFIG } from './config';
import { Input } from './Input';
import { PipeManager } from './PipeManager';
import { Renderer } from './Renderer';
import { ScoreStorage } from './ScoreStorage';
import type { GameState } from './types';

/**
 * Оркестратор: владеет состоянием, игровым циклом и связывает части между собой.
 * Физика — в Bird/PipeManager, рисование — в Renderer, ввод — в Input.
 */
export class Game {
  private readonly bird = new Bird();
  private readonly pipes = new PipeManager();
  private readonly renderer: Renderer;
  private readonly storage = new ScoreStorage();

  private state: GameState = 'ready';
  private score = 0;
  private bestScore = this.storage.load();

  private groundOffset = 0;
  private elapsed = 0;          // общее время, для анимации ожидания
  private timeInState = 0;      // время в текущем состоянии
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    new Input(canvas, this.handleAction);
  }

  start(): void {
    requestAnimationFrame(this.loop);
  }

  // ---------- Игровой цикл ----------

  private loop = (now: number): void => {
    // dt в секундах; ограничиваем, чтобы после паузы вкладки не было «телепортации»
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.elapsed += dt;
    this.timeInState += dt;

    switch (this.state) {
      case 'ready':
        this.scrollGround(dt);
        this.bird.hover(this.elapsed);
        break;

      case 'playing':
        this.updatePlaying(dt);
        break;

      case 'gameover':
        this.updateGameOver(dt);
        break;
    }
  }

  private updatePlaying(dt: number): void {
    this.scrollGround(dt);
    this.bird.update(dt);
    this.pipes.update(dt);

    this.updateScore();

    if (this.hasCollision()) {
      this.endGame();
    }
  }

  private updateGameOver(dt: number): void {
    // Птица продолжает падать до земли, мир замирает
    if (this.bird.y + CONFIG.bird.radius < CONFIG.ground.top) {
      this.bird.update(dt);
    } else {
      this.bird.landOn(CONFIG.ground.top);
    }
  }

  private render(): void {
    this.renderer.render({
      state: this.state,
      bird: this.bird,
      pipes: this.pipes.pipes,
      score: this.score,
      bestScore: this.bestScore,
      groundOffset: this.groundOffset,
    });
  }

  // ---------- Правила игры ----------

  private updateScore(): void {
    for (const pipe of this.pipes.pipes) {
      const passed = pipe.x + CONFIG.pipes.width < this.bird.x;
      if (passed && !pipe.scored) {
        pipe.scored = true;
        this.score += 1;
      }
    }
  }

  private hasCollision(): boolean {
    const hitbox = this.bird.hitbox;

    const hitsGround = hitbox.y + hitbox.radius >= CONFIG.ground.top;
    if (hitsGround) return true;

    return this.pipes.colliders.some((rect) => circleIntersectsRect(hitbox, rect));
  }

  private endGame(): void {
    this.setState('gameover');

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.storage.save(this.bestScore);
    }
  }

  private resetGame(): void {
    this.score = 0;
    this.bird.reset();
    this.pipes.reset();
    this.setState('ready');
  }

  // ---------- Состояния и ввод ----------

  private setState(next: GameState): void {
    this.state = next;
    this.timeInState = 0;
  }

  /** Единственная точка входа для пользовательского ввода. */
  private handleAction = (): void => {
    switch (this.state) {
      case 'ready':
        this.setState('playing');
        this.bird.flap();
        break;

      case 'playing':
        this.bird.flap();
        break;

      case 'gameover':
        if (this.timeInState >= CONFIG.restartDelay) {
          this.resetGame();
        }
        break;
    }
  };

  private scrollGround(dt: number): void {
    this.groundOffset += CONFIG.pipes.speed * dt;
  }
}
