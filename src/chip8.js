'use strict';

class Chip8 {
  constructor() {
    this.displayWidth = 64;
    this.displayHeight = 32;
    this.display = new Uint8Array(this.displayWidth * this.displayHeight);
    this.memory = new Uint8Array(0xfff);
    this.stack = new Uint8Array(16);
    this.V = new Uint8Array(16);
    this.SP = null;
    this.PC = null;
    this.I = null;
    this.drawScreen = false;
    this.delayTimer = null;
    this.soundTimer = null;
    this.keyboard = new Keyboard();
    this.canvasRender = new CanvasRender();
    this.halted = false;
    this.stopped = false;
  }

  init() {
    // Reset memory
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0;
    }

    // Reset registers
    this.PC = 0x200;
    this.SP = 0;
    this.I = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    for (let i = 0; i < this.V.length; i++) {
      this.V[i] = 0;
    }

    // Reset stack
    for (let i = 0; i < this.stack.length; i++) {
      this.stack[i] = 0;
    }

    // Install font into memory, up to memory[80]
    // prettier-ignore
    let font = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80 // F
        ];
    for (let i = 0; i < font.length; i++) {
      this.memory[i] = font[i];
    }

    this.halted = false;
    this.stopped = false;
  }

  loadROM(rom) {
    // Expects a rom in UInt8 Array format
    for (let i = 0; i < rom.length; i++) this.memory[i + 0x200] = program[i];
  }

  handleTimers() {
    if (this.delayTimer > 0) this.delayTimer--;
    if (this.soundTimer > 0) {
      if (this.soundTimer == 1) {
        //https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
        function beep() {
          var sound = new Audio(
            'data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU='
          );
          sound.play();
        }
        beep();
      }
      this.soundTimer--;
    }
  }

  //Fetches and Executes an Opcode
  //If cpu is halted then just return
  executeOpcode() {
    if (this.halted) return;

    let opCode = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];

    switch (opcode & 0xf000) {
      case 0x0000:
        handle_0x0(opcode);
        break;
      case 0x1000:
        //1nnn - JP addr
        //Jump to location nnn
        this.PC = opcode & 0x0fff;
        break;
      case 0x2000:
        //2nnn - CALL addr
        //Call subroutine at nnn
        this.stack[this.SP] = this.PC;
        this.SP++;
        this.PC = opcode & 0x0fff;
        break;
      case 0x3000:
        //3xkk - SE Vx, byte
        //Skip next instruction if Vx = kk
        if (this.V[(opcode & 0x0f00) >> 8] == (opcode & 0x00ff)) this.PC += 4;
        else this.PC += 2;
        break;
      case 0x4000:
        //4xkk - SNE Vx, byte
        //Skip next instruction if Vx != kk
        if (this.V[(opcode & 0x0f00) >> 8] != (opcode & 0x00ff)) this.PC += 4;
        else this.PC += 2;
        break;
      case 0x5000:
        //5xy0 - SE Vx, Vy
        //Skip next instruction if Vx = Vy
        if (this.V[(opcode & 0x0f00) >> 8] == this.V[(opcode & 0x00f0) >> 4])
          this.PC += 4;
        else this.PC += 2;
        break;
      case 0x6000:
        //6xkk - LD Vx, byte
        //Set Vx = kk
        this.V[(opcode & 0x0f00) >> 8] = opcode & 0x00ff;
        this.PC += 2;
        break;
      case 0x7000:
        //7xkk - ADD Vx, byte
        //Set Vx = Vx + kk
        this.V[(opcode & 0x0f00) >> 8] += opcode & 0x00ff;
        this.PC += 2;
        break;
      case 0x8000:
        handle_0x8(opcode);
        break;
      case 0x9000:
        //9xy0 - SNE Vx, Vy
        //Skip next instruction if Vx != Vy
        if (this.V[(opcode & 0x0f00) >> 8] != this.V[(opcode & 0x00f0) >> 4])
          this.PC += 4;
        else this.PC += 2;
        break;
      case 0xa000:
        //Annn - LD I, addr
        //Set I = nnn
        this.I = opcode & 0x0fff;
        this.PC += 2;
        break;
      case 0xb000:
        //Bnnn - JP V0, addr
        //Jump to location nnn + V0
        this.PC = this.V[0x0] + (opcode & 0x0fff);
        break;
      case 0xc000:
        //Cxkk - RND Vx, byte
        //Set Vx = random byte AND kk
        this.V[(opcode & 0x0f00) >> 8] =
          Math.floor(Math.random() * 255) & (opcode & 0x00ff);
        this.PC += 2;
        break;
      case 0xd000:
        //Dxyn - DRW Vx, Vy, nibble
        //Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
        //Each row of 8 pixels is read as bit-coded starting from memory location I;
        //I value doesn’t change after the execution of this instruction.
        //As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the
        //sprite is drawn, and to 0 if that doesn’t happen.
        let height = opcode & 0x000f;
        let x = this.V[(opcode & 0x0f00) >> 8];
        let y = this.V[(opcode & 0x00f0) >> 4];
        let pixel = null;
        this.V[0xf] = 0;
        //Loop over the rows
        for (let yline = 0; yline < height; yline++) {
          pixel = this.memory[this.I + yline];
          //Loop over 8 bits of a row
          for (let xline = 0; xline < 8; xline++) {
            //Scans through the byte and checks if there is anything to write
            if ((pixel & (0b10000000 >> xline)) != 0) {
              //Check for collision
              if (
                this.graphics[x + xline + (y + yline) * this.displayWidth] == 1
              )
                this.V[0xf] = 1;
              //Perform XOR
              this.graphics[x + xline + (y + yline) * this.displayWidth] ^= 1;
            }
          }
        }
        //Set the draw flag
        this.drawScreen = true;
        this.PC += 2;
        break;
      case 0xe000:
        handle_0xE(opcode);
        break;
      case 0xf000:
        handle_0xF(opcode);
        break;
      default:
        console.log(
          `Invalid Opcode: ${'0x' + opcode.toString(16).toUpperCase()}`
        );
        break;
    }
  }

  handle_0x0(opcode) {
    switch (opcode & 0x000f) {
      case 0x0000:
        //00E0 - CLS
        //Clear the display
        for (let i = 0; i < this.display.length; i++) this.display[i] = 0;
        this.drawScreen = true;
        this.PC += 2;
        break;
      case 0x000e:
        //00EE - RET
        //Return from a subroutine
        this.SP--;
        this.PC = this.stack[this.SP];
        this.PC += 2;
        break;
      default:
        console.log(
          `Invalid Opcode: ${'0x' + opcode.toString(16).toUpperCase()}`
        );
        break;
    }
  }

  handle_0x8(opcode) {
    switch (opcode & 0x000f) {
      case 0x0000:
        //8xy0 - LD Vx, Vy
        //Set Vx = Vy
        this.V[(opcode & 0x0f00) >> 8] = this.V[(opcode & 0x00f0) >> 4];
        this.PC += 2;
        break;
      case 0x0001:
        //8xy1 - OR Vx, Vy
        //Set Vx = Vx OR Vy
        this.V[(opcode & 0x0f00) >> 8] |= this.V[(opcode & 0x00f0) >> 4];
        this.PC += 2;
        break;
      case 0x0003:
        //8xy3 - XOR Vx, Vy
        //Set Vx = Vx XOR Vy
        this.V[(opcode & 0x0f00) >> 8] ^= this.V[(opcode & 0x00f0) >> 4];
        this.PC += 2;
        break;
      case 0x0004:
        //8xy4 - ADD Vx, Vy
        //Set Vx = Vx + Vy, set VF = 1 if Vx + Vy > 255 (0xFF)
        let sum =
          this.V[(opcode & 0x0f00) >> 8] + this.V[(opcode & 0x00f0) >> 4];
        if (sum > 0xff) {
          this.V[(opcode & 0x0f00) >> 8] = 0xff;
          this.V[0xf] = 1;
        } else {
          this.V[(opcode & 0x0f00) >> 8] = sum;
          this.V[0xf] = 0;
        }
        this.PC += 2;
        break;
      case 0x0005:
        //8xy5 - SUB Vx, Vy
        //Set Vx = Vx - Vy, if Vx > Vy then VF = 1
        if (this.V[(opcode & 0x0f00) >> 8] > this.v[(opcode & 0x00f0) >> 4])
          this.V[0xf] = 1;
        else this.V[0xf] = 0;
        this.V[(opcode & 0x0f00) >> 8] -= this.V[(opcode & 0x00f0) >> 4];
        this.PC += 2;
        break;
      case 0x0006:
        //8xy6 - SHR Vx {, Vy}
        //Set VF = Vx SHR 1, then Vx >> 1
        this.V[0xf] = this.V[(opcode & 0x0f00) >> 8] && 0x01;
        this.v[(opcode & 0x0f00) >> 8] >>= 1;
        this.PC += 2;
        break;
      case 0x0007:
        //8xy7 - SUBN Vx, Vy
        //Set Vx = Vy - Vx, if Vy > Vx then VF = 1
        if (this.V[(opcode & 0x00f0) >> 4] > this.v[(opcode & 0x0f00) >> 8])
          this.V[0xf] = 1;
        else this.V[0xf] = 0;
        this.V[(opcode & 0x0f00) >> 8] =
          this.V[(opcode & 0x00f0) >> 4] - this.V[(opcode & 0x0f00) >> 8];
        this.PC += 2;
        break;
      case 0x000e:
        //8xyE - SHL Vx {, Vy}
        //Set VF = Vx SHL 1, then Vx << 1
        this.V[0xf] = this.V[(opcode & 0x0f00) >> 8] >> 7;
        this.V[(opcode & 0x0f00) >> 8] <<= 1;
        this.PC += 2;
        break;
      default:
        console.log(
          `Invalid Opcode: ${'0x' + opcode.toString(16).toUpperCase()}`
        );
        break;
    }
  }

  handle_0xE(opcode) {
    switch (opcode & 0x000f) {
      case 0x000e:
        //Ex9E - SKP Vx
        //Skip next instruction if key with the value of Vx is pressed
        if (this.keyboard.keysPressed[this.V[(opcode & 0x0f00) >> 8]] == 1)
          this.PC += 4;
        else this.PC += 2;
        break;
      case 0x0001:
        //ExA1 - SKNP Vx
        //Skip next instruction if key with the value of Vx is not pressed
        if (
          typeof this.keyboard.keysPressed[this.V[(opcode & 0x0f00) >> 8]] ==
          'undefined'
        )
          this.PC += 4;
        else this.PC += 2;
        break;
      default:
        console.log(
          `Invalid Opcode: ${'0x' + opcode.toString(16).toUpperCase()}`
        );
        break;
    }
  }

  handle_0xF(opcode) {
    switch (opcode & 0x00ff) {
      case 0x0007:
        //Fx07 - LD Vx, DT
        //Set Vx = delay timer value
        this.V[(opcode & 0x0f00) >> 8] = this.delayTimer;
        this.PC += 2;
        break;
      case 0x000a:
        //Fx0A - LD Vx, K
        //Wait for a key press, store the value of the key in Vx
        this.keyboard.waitForKeypress = true;
        this.halted = true;
        this.keyboard.onNextKeyPressed = function(keyCode) {
          this.V[(opcode & 0x0f00) >> 8] = this.keyHandler.lastKeyPressed;
          this.PC += 2;
          this.halted = false;
        };
        break;
      case 0x0015:
        //Fx15 - LD DT, Vx
        //Set delay timer = Vx
        this.delayTimer = this.V[(opcode & 0x0f00) >> 8];
        this.PC += 2;
        break;
      case 0x0018:
        //Fx18 - LD ST, Vx
        //Set sound timer = Vx
        this.soundTimer = this.V[(opcode & 0x0f00) >> 8];
        this.PC += 2;
        break;
      case 0x001e:
        //Fx1E - ADD I, Vx
        //Set I = I + Vx
        this.I += this.V[(opcode & 0x0f00) >> 8];
        this.PC += 2;
        break;
      case 0x0029:
        //Fx29 - LD F, Vx
        //Set I = location of sprite for digit Vx
        this.I = this.memory[this.V[(opcode & 0x0f00) >> 8] * 5];
        this.PC += 2;
        break;
      case 0x0033:
        //Fx33 - LD B, Vx
        //Store BCD representation of Vx in memory locations I, I+1, and I+2
        this.memory[this.I] = parseInt(
          this.V[(opcode & 0x0f00) >> 8] / 100,
          10
        );
        this.memory[this.I + 1] = parseInt(
          (this.V[(opcode & 0x0f00) >> 8] % 100) / 10,
          10
        );
        this.memory[this.I + 2] = cpu.V[x] % 10;
        this.PC += 2;
        break;
      case 0x0055:
        //Fx55 - LD [I], Vx
        //Store registers V0 through Vx in memory starting at location I
        //I is set to I + X + 1 after operation
        var x = this.V[(opcode & 0x0f00) >> 8];
        for (let i = 0; i <= x; i++) {
          this.memory[this.I + i] = this.V[i];
        }
        I += x + 1;
        this.PC += 2;
        break;
      case 0x0065:
        //Fx65 - LD Vx, [I]
        //Read registers V0 through Vx from memory starting at location I
        //I is set to I + X + 1 after operation
        var x = this.V[(opcode & 0x0f00) >> 8];
        for (let i = 0; i <= x; i++) {
          this.V[i] = this.memory[this.I + i];
        }
        I += x + 1;
        this.PC += 2;
        break;
      default:
        console.log(
          `Invalid Opcode: ${'0x' + opcode.toString(16).toUpperCase()}`
        );
        break;
    }
  }
}
