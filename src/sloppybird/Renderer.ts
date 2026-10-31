import { CONFIG } from './config';
import type { Bird } from './Bird';
import type { PipePair } from './PipeManager';
import type { GameState } from './types';

/** Всё, что нужно Renderer'у, чтобы нарисовать кадр. Игровой логики здесь нет. */
export interface RenderView {
  state: GameState;
  bird: Bird;
  pipes: readonly PipePair[];
  score: number;
  bestScore: number;
  groundOffset: number;
}

const { colors } = CONFIG;
const { width: W, height: H } = CONFIG.canvas;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is not available');
    this.ctx = ctx;
    this.setupHiDpi();
  }

  render(view: RenderView): void {
    this.drawBackground();
    this.drawPipes(view.pipes);
    this.drawGround(view.groundOffset);
    this.drawBird(view.bird);
    this.drawHud(view);
  }

  // ---------- Сцена ----------

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.ground.top);
    gradient.addColorStop(0, colors.skyTop);
    gradient.addColorStop(1, colors.skyBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, W, H);
  }

  private drawPipes(pipes: readonly PipePair[]): void {
    const { width, gap, capHeight, capOverhang } = CONFIG.pipes;
    const groundTop = CONFIG.ground.top;

    for (const pipe of pipes) {
      const gapTop = pipe.gapY - gap / 2;
      const gapBottom = pipe.gapY + gap / 2;

      // Верхняя труба: колпак внизу
      this.drawPipeBody(pipe.x, 0, width, gapTop);
      this.drawPipeCap(pipe.x - capOverhang, gapTop - capHeight, width + capOverhang * 2, capHeight);

      // Нижняя труба: колпак сверху
      this.drawPipeBody(pipe.x, gapBottom, width, groundTop - gapBottom);
      this.drawPipeCap(pipe.x - capOverhang, gapBottom, width + capOverhang * 2, capHeight);
    }
  }

  private drawPipeBody(x: number, y: number, w: number, h: number): void {
    this.ctx.fillStyle = colors.pipe;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = colors.pipeHighlight;
    this.ctx.fillRect(x + 6, y, 6, h);
  }

  private drawPipeCap(x: number, y: number, w: number, h: number): void {
    this.ctx.fillStyle = colors.pipeCap;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = colors.pipeHighlight;
    this.ctx.fillRect(x + 6, y, 6, h);
  }

  private drawGround(offset: number): void {
    const { top, height } = CONFIG.ground;
    const ctx = this.ctx;

    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, top, W, height);

    // Диагональные полосы, «едущие» влево
    const stripeWidth = 20;
    const period = stripeWidth * 2;
    ctx.fillStyle = colors.groundStripe;
    for (let x = -period - (offset % period); x < W + period; x += period) {
      ctx.beginPath();
      ctx.moveTo(x, top + 8);
      ctx.lineTo(x + stripeWidth, top + 8);
      ctx.lineTo(x + stripeWidth - 10, top + height);
      ctx.lineTo(x - 10, top + height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = colors.groundEdge;
    ctx.fillRect(0, top, W, 4);
  }

  private drawBird(bird: Bird): void {
    const ctx = this.ctx;
    const r = CONFIG.bird.radius;

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Тело
    ctx.fillStyle = colors.birdBody;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Крыло
    ctx.fillStyle = colors.birdWing;
    ctx.beginPath();
    ctx.ellipse(-4, 3, 7, 4.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Клюв
    ctx.fillStyle = colors.birdBeak;
    ctx.beginPath();
    ctx.moveTo(r - 2, -2);
    ctx.lineTo(r + 9, 2);
    ctx.lineTo(r - 2, 6);
    ctx.closePath();
    ctx.fill();

    // Глаз
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.birdEye;
    ctx.beginPath();
    ctx.arc(6.5, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ---------- Интерфейс ----------

  private drawHud(view: RenderView): void {
    switch (view.state) {
      case 'ready':
        this.drawText('Floppy Bird', W / 2, 190, 44);
        this.drawText('Пробел или тап — взмах', W / 2, 250, 20);
        break;

      case 'playing':
        this.drawText(String(view.score), W / 2, 80, 56);
        break;

      case 'gameover':
        this.ctx.fillStyle = colors.overlay;
        this.ctx.fillRect(0, 0, W, H);
        this.drawText('Конец игры', W / 2, 200, 44);
        this.drawText(`Счёт: ${view.score}`, W / 2, 270, 28);
        this.drawText(`Рекорд: ${view.bestScore}`, W / 2, 310, 22);
        this.drawText('Пробел или тап — ещё раз', W / 2, 380, 18);
        break;
    }
  }

  private drawText(text: string, x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.font = `bold ${size}px ${CONFIG.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size / 8);
    ctx.strokeStyle = colors.textShadow;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = colors.text;
    ctx.fillText(text, x, y);
  }

  /** Чёткая картинка на экранах с devicePixelRatio > 1. */
  private setupHiDpi(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.ctx.scale(dpr, dpr);
  }
}
