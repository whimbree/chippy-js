'use strict';

class Keyboard {
  constructor() {
    this.keysPressed = {};
    this.translateKeyCode = {
      49: 0x1, // 1
      50: 0x2, // 2
      51: 0x3, // 3
      52: 0x4, // 4
      81: 0x5, // Q
      87: 0x6, // W
      69: 0x7, // E
      82: 0x8, // R
      65: 0x9, // A
      83: 0xa, // S
      68: 0xb, // D
      70: 0xc, // F
      90: 0xd, // Z
      88: 0xe, // X
      67: 0xf, // C
      86: 0x10 // V
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
