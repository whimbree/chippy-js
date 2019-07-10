'use strict';

class CanvasRender {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.canvas.width = 640;
    this.canvas.height = 320;
    this.context = this.canvas.getContext('2d');
    this.pixelSize = 10;
  }

  render(display) {
    //Each chip8 pixel will be 10x10 pixels on the canvas
    //Black out the entire canvas
    this.context.fillStyle = '#000000'; //Black
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    //Now we render the display in white to the black canvas
    this.context.fillStyle = '#ffffff'; //White
    for (let i = 0; i < display.length; i++) {
      if (display[i] == 1) {
        let x = (i % 64) * this.pixelSize;
        let y = Math.floor(i / 64) * this.pixelSize;
        this.context.fillRect(x, y, this.pixelSize, this.pixelSize);
      }
    }
  }
}
