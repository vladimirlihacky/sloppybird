// src/sloppybird/config.ts
var WIDTH = 400;
var HEIGHT = 600;
var GROUND_HEIGHT = 80;
var CONFIG = {
  canvas: {
    width: WIDTH,
    height: HEIGHT
  },
  ground: {
    height: GROUND_HEIGHT,
    top: HEIGHT - GROUND_HEIGHT
  },
  bird: {
    x: 90,
    radius: 14,
    gravity: 1500,
    flapVelocity: -440,
    maxFallSpeed: 720
  },
  pipes: {
    width: 64,
    gap: 150,
    speed: 160,
    spawnInterval: 1.6,
    edgeMargin: 50,
    capHeight: 22,
    capOverhang: 4
  },
  restartDelay: 0.5,
  storageKey: "floppy-bird:best-score",
  colors: {
    skyTop: "#8fd3e8",
    skyBottom: "#e4f5ea",
    pipe: "#2f7d5b",
    pipeCap: "#25644a",
    pipeHighlight: "#4a9c78",
    ground: "#dcb676",
    groundStripe: "#c99d55",
    groundEdge: "#7a5a2b",
    birdBody: "#ffc93c",
    birdWing: "#f29e1f",
    birdBeak: "#ff6b4a",
    birdEye: "#1f2a33",
    text: "#ffffff",
    textShadow: "rgba(31, 42, 51, 0.55)",
    overlay: "rgba(31, 42, 51, 0.35)"
  },
  font: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif'
};

// src/sloppybird/Bird.ts
class Bird {
  x = CONFIG.bird.x;
  y = CONFIG.canvas.height / 2;
  velocity = 0;
  reset() {
    this.y = CONFIG.canvas.height / 2;
    this.velocity = 0;
  }
  flap() {
    this.velocity = CONFIG.bird.flapVelocity;
  }
  update(dt) {
    const { gravity, maxFallSpeed, radius } = CONFIG.bird;
    this.velocity = Math.min(this.velocity + gravity * dt, maxFallSpeed);
    this.y += this.velocity * dt;
    if (this.y < radius) {
      this.y = radius;
      this.velocity = 0;
    }
  }
  hover(time) {
    this.y = CONFIG.canvas.height / 2 + Math.sin(time * 4) * 6;
    this.velocity = 0;
  }
  landOn(groundTop) {
    this.y = groundTop - CONFIG.bird.radius;
    this.velocity = 0;
  }
  get hitbox() {
    return { x: this.x, y: this.y, radius: CONFIG.bird.radius };
  }
  get rotation() {
    const t = this.velocity / CONFIG.bird.maxFallSpeed;
    return Math.max(-0.45, Math.min(1.2, t * 1.2));
  }
}

// src/sloppybird/collision.ts
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function circleIntersectsRect(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

// src/sloppybird/Input.ts
class Input {
  target;
  onAction;
  constructor(target, onAction) {
    this.target = target;
    this.onAction = onAction;
    window.addEventListener("keydown", this.handleKey);
    this.target.addEventListener("pointerdown", this.handlePointer);
  }
  destroy() {
    window.removeEventListener("keydown", this.handleKey);
    this.target.removeEventListener("pointerdown", this.handlePointer);
  }
  handleKey = (event) => {
    const isActionKey = event.code === "Space" || event.code === "ArrowUp";
    if (!isActionKey)
      return;
    event.preventDefault();
    if (!event.repeat)
      this.onAction();
  };
  handlePointer = (event) => {
    event.preventDefault();
    this.onAction();
  };
}

// src/sloppybird/PipeManager.ts
class PipeManager {
  pipes = [];
  timeSinceSpawn = CONFIG.pipes.spawnInterval;
  reset() {
    this.pipes.length = 0;
    this.timeSinceSpawn = CONFIG.pipes.spawnInterval;
  }
  update(dt) {
    this.timeSinceSpawn += dt;
    if (this.timeSinceSpawn >= CONFIG.pipes.spawnInterval) {
      this.timeSinceSpawn = 0;
      this.spawn();
    }
    for (const pipe of this.pipes) {
      pipe.x -= CONFIG.pipes.speed * dt;
    }
    while (this.pipes.length > 0 && this.pipes[0].x + CONFIG.pipes.width < 0) {
      this.pipes.shift();
    }
  }
  get colliders() {
    const { width, gap } = CONFIG.pipes;
    const { top: groundTop } = CONFIG.ground;
    return this.pipes.flatMap((pipe) => {
      const gapTop = pipe.gapY - gap / 2;
      const gapBottom = pipe.gapY + gap / 2;
      return [
        { x: pipe.x, y: 0, width, height: gapTop },
        { x: pipe.x, y: gapBottom, width, height: groundTop - gapBottom }
      ];
    });
  }
  spawn() {
    const { gap, edgeMargin, width } = CONFIG.pipes;
    const minY = edgeMargin + gap / 2;
    const maxY = CONFIG.ground.top - edgeMargin - gap / 2;
    this.pipes.push({
      x: CONFIG.canvas.width + width,
      gapY: minY + Math.random() * (maxY - minY),
      scored: false
    });
  }
}

// src/sloppybird/Renderer.ts
var { colors } = CONFIG;
var { width: W, height: H } = CONFIG.canvas;

class Renderer {
  canvas;
  ctx;
  constructor(canvas) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Canvas 2D context is not available");
    this.ctx = ctx;
    this.setupHiDpi();
  }
  render(view) {
    this.drawBackground();
    this.drawPipes(view.pipes);
    this.drawGround(view.groundOffset);
    this.drawBird(view.bird);
    this.drawHud(view);
  }
  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.ground.top);
    gradient.addColorStop(0, colors.skyTop);
    gradient.addColorStop(1, colors.skyBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, W, H);
  }
  drawPipes(pipes) {
    const { width, gap, capHeight, capOverhang } = CONFIG.pipes;
    const groundTop = CONFIG.ground.top;
    for (const pipe of pipes) {
      const gapTop = pipe.gapY - gap / 2;
      const gapBottom = pipe.gapY + gap / 2;
      this.drawPipeBody(pipe.x, 0, width, gapTop);
      this.drawPipeCap(pipe.x - capOverhang, gapTop - capHeight, width + capOverhang * 2, capHeight);
      this.drawPipeBody(pipe.x, gapBottom, width, groundTop - gapBottom);
      this.drawPipeCap(pipe.x - capOverhang, gapBottom, width + capOverhang * 2, capHeight);
    }
  }
  drawPipeBody(x, y, w, h) {
    this.ctx.fillStyle = colors.pipe;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = colors.pipeHighlight;
    this.ctx.fillRect(x + 6, y, 6, h);
  }
  drawPipeCap(x, y, w, h) {
    this.ctx.fillStyle = colors.pipeCap;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = colors.pipeHighlight;
    this.ctx.fillRect(x + 6, y, 6, h);
  }
  drawGround(offset) {
    const { top, height } = CONFIG.ground;
    const ctx = this.ctx;
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, top, W, height);
    const stripeWidth = 20;
    const period = stripeWidth * 2;
    ctx.fillStyle = colors.groundStripe;
    for (let x = -period - offset % period;x < W + period; x += period) {
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
  drawBird(bird) {
    const ctx = this.ctx;
    const r = CONFIG.bird.radius;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    ctx.fillStyle = colors.birdBody;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.birdWing;
    ctx.beginPath();
    ctx.ellipse(-4, 3, 7, 4.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.birdBeak;
    ctx.beginPath();
    ctx.moveTo(r - 2, -2);
    ctx.lineTo(r + 9, 2);
    ctx.lineTo(r - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(5, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.birdEye;
    ctx.beginPath();
    ctx.arc(6.5, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawHud(view) {
    switch (view.state) {
      case "ready":
        this.drawText("Floppy Bird", W / 2, 190, 44);
        this.drawText("Пробел или тап — взмах", W / 2, 250, 20);
        break;
      case "playing":
        this.drawText(String(view.score), W / 2, 80, 56);
        break;
      case "gameover":
        this.ctx.fillStyle = colors.overlay;
        this.ctx.fillRect(0, 0, W, H);
        this.drawText("Конец игры", W / 2, 200, 44);
        this.drawText(`Счёт: ${view.score}`, W / 2, 270, 28);
        this.drawText(`Рекорд: ${view.bestScore}`, W / 2, 310, 22);
        this.drawText("Пробел или тап — ещё раз", W / 2, 380, 18);
        break;
    }
  }
  drawText(text, x, y, size) {
    const ctx = this.ctx;
    ctx.font = `bold ${size}px ${CONFIG.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, size / 8);
    ctx.strokeStyle = colors.textShadow;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = colors.text;
    ctx.fillText(text, x, y);
  }
  setupHiDpi() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.ctx.scale(dpr, dpr);
  }
}

// src/sloppybird/ScoreStorage.ts
class ScoreStorage {
  load() {
    try {
      return Number(localStorage.getItem(CONFIG.storageKey)) || 0;
    } catch {
      return 0;
    }
  }
  save(score) {
    try {
      localStorage.setItem(CONFIG.storageKey, String(score));
    } catch {}
  }
}

// src/sloppybird/Game.ts
class Game {
  bird = new Bird;
  pipes = new PipeManager;
  renderer;
  storage = new ScoreStorage;
  state = "ready";
  score = 0;
  bestScore = this.storage.load();
  groundOffset = 0;
  elapsed = 0;
  timeInState = 0;
  lastFrameTime = 0;
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    new Input(canvas, this.handleAction);
  }
  start() {
    requestAnimationFrame(this.loop);
  }
  loop = (now) => {
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  };
  update(dt) {
    this.elapsed += dt;
    this.timeInState += dt;
    switch (this.state) {
      case "ready":
        this.scrollGround(dt);
        this.bird.hover(this.elapsed);
        break;
      case "playing":
        this.updatePlaying(dt);
        break;
      case "gameover":
        this.updateGameOver(dt);
        break;
    }
  }
  updatePlaying(dt) {
    this.scrollGround(dt);
    this.bird.update(dt);
    this.pipes.update(dt);
    this.updateScore();
    if (this.hasCollision()) {
      this.endGame();
    }
  }
  updateGameOver(dt) {
    if (this.bird.y + CONFIG.bird.radius < CONFIG.ground.top) {
      this.bird.update(dt);
    } else {
      this.bird.landOn(CONFIG.ground.top);
    }
  }
  render() {
    this.renderer.render({
      state: this.state,
      bird: this.bird,
      pipes: this.pipes.pipes,
      score: this.score,
      bestScore: this.bestScore,
      groundOffset: this.groundOffset
    });
  }
  updateScore() {
    for (const pipe of this.pipes.pipes) {
      const passed = pipe.x + CONFIG.pipes.width < this.bird.x;
      if (passed && !pipe.scored) {
        pipe.scored = true;
        this.score += 1;
      }
    }
  }
  hasCollision() {
    const hitbox = this.bird.hitbox;
    const hitsGround = hitbox.y + hitbox.radius >= CONFIG.ground.top;
    if (hitsGround)
      return true;
    return this.pipes.colliders.some((rect) => circleIntersectsRect(hitbox, rect));
  }
  endGame() {
    this.setState("gameover");
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.storage.save(this.bestScore);
    }
  }
  resetGame() {
    this.score = 0;
    this.bird.reset();
    this.pipes.reset();
    this.setState("ready");
  }
  setState(next) {
    this.state = next;
    this.timeInState = 0;
  }
  handleAction = () => {
    switch (this.state) {
      case "ready":
        this.setState("playing");
        this.bird.flap();
        break;
      case "playing":
        this.bird.flap();
        break;
      case "gameover":
        if (this.timeInState >= CONFIG.restartDelay) {
          this.resetGame();
        }
        break;
    }
  };
  scrollGround(dt) {
    this.groundOffset += CONFIG.pipes.speed * dt;
  }
}

// src/sloppybird/main.ts
var canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas element #game not found");
}
new Game(canvas).start();
