'use strict';

class Keyboard {
  constructor() {
    this.keysPressed = {};
    this.translateKeyCode = {
      49: 0x0, // 1
      50: 0x1, // 2
      51: 0x2, // 3
      52: 0x3, // 4
      81: 0x4, // Q
      87: 0x5, // W
      69: 0x6, // E
      82: 0x7, // R
      65: 0x8, // A
      83: 0x9, // S
      68: 0xa, // D
      70: 0xb, // F
      90: 0xc, // Z
      88: 0xd, // X
      67: 0xe, // C
      86: 0xf // V
    };
  }

  onNextKeyPressed(code) {
    //Override this in Fx0A - LD Vx, K
  }

  isPressed(event) {
    return this.keysPressed[this.translateKeyCode[event.keyCode]];
  }

  isDown(event) {
    console.log(`Pressed ${event.keyCode}`);
    this.keysPressed[this.translateKeyCode[event.keyCode]] = 1;
    this.onNextKeyPressed(event.keyCode);
    // We only want onNextKeyPressed to run once
    // After a Fx0A opcode
    this.onNextKeyPressed = function() {};
  }

  isUp(event) {
    console.log(`Released ${event.keyCode}`);
    delete this.keysPressed[this.translateKeyCode[event.keyCode]];
  }
}
