import { Game } from './Game';

window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

const canvas = document.getElementById('game');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element #game not found');
}

new Game(canvas).start();
