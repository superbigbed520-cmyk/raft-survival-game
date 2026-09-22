import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  canvas.width = 800;
  canvas.height = 600;
  const game = new Game(canvas);
  game.loop();
});
