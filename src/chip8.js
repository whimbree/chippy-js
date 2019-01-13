'use strict';

class Chip8 {

    constructor() {
        this.displayWidth = 64;
        this.displayHeight = 32;
        this.display = new Uint8Array(this.displayWidth * this.displayHeight);
        this.memory = new Uint8Array(0xFFF);
        this.stack = new Uint8Array(16);
        this.V = new Uint8Array(16);
        this.SP = null;
        this.PC = null;
        this.I = null;
        this.drawScreen = False;
        this.delayTimer = null;
        this.soundTimer = null;
        this.keys = {};
        this.canvas = null;
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
    }

    loadROM(rom) {
        // Expects a rom in UInt8 Array format
        for (let i = 0; i < rom.length; i++)
            this.memory[i + 0x200] = program[i];
    }

    handleTimers() {
        if (this.delayTimer > 0)
            this.delayTimer--;
        if (this.soundTimer > 0) {
            if (this.soundTimer == 1)
                //TODO BEEP
            this.soundTimer--; 
        }
    }

    executeOpcode() {

        let opCode = this.memory[this.PC] << 8 | this.memory[this.PC + 1];
        
        switch (opcode & 0xF000) {
            case 0x0000: 
                handle_0x0(opcode);
                break;
            case 0x1000:
                //1nnn - JP addr
                //Jump to location nnn
                this.PC = opcode & 0x0FFF;
                break;
            case 0x2000:
                //2nnn - CALL addr
                //Call subroutine at nnn
                this.stack[this.SP] = this.PC;
                this.SP++;
                this.PC = opcode & 0x0FFF;
                break;
            case 0x3000:
                //3xkk - SE Vx, byte
                //Skip next instruction if Vx = kk
                if (this.V[(opcode & 0x0F00) >> 8] == (opcode & 0x00FF))
                    this.PC += 4;
                else
                    this.PC += 2;
                break;
            case 0x4000:
                //4xkk - SNE Vx, byte
                //Skip next instruction if Vx != kk
                if (this.V[(opcode & 0x0F00) >> 8] != (opcode & 0x00FF))
                    this.PC += 4;
                else
                    this.PC += 2;
                break;
            case 0x5000:
                //5xy0 - SE Vx, Vy
                //Skip next instruction if Vx = Vy
                if (this.V[(opcode & 0x0F00) >> 8] == this.V[(opcode & 0x00F0) >> 4])
                    this.PC += 4;
                else
                    this.PC += 2;
                break;
            case 0x6000:
                //6xkk - LD Vx, byte
                //Set Vx = kk
                this.V[(opcode & 0x0F00) >> 8] = (opcode & 0x00FF);
                this.PC += 2;
                break;
            case 0x7000:
                //7xkk - ADD Vx, byte
                //Set Vx = Vx + kk
                this.V[(opcode & 0x0F00) >> 8] += (opcode & 0x00FF);
                this.PC += 2;
                break;
            case 0x8000:
                handle_0x8(opcode);
                break;
            case 0x9000:
                //9xy0 - SNE Vx, Vy
                //Skip next instruction if Vx != Vy
                if (this.V[(opcode & 0x0F00) >> 8] != this.V[(opcode & 0x00F0) >> 4])
                    this.PC += 4;
                else
                    this.PC += 2;
                break;
            case 0xA000:
                //Annn - LD I, addr
                //Set I = nnn
                this.I = opcode & 0x0FFF;
                this.PC += 2;
                break;
            case 0xB000:
                //Bnnn - JP V0, addr
                //Jump to location nnn + V0
                this.PC = this.V[0x0] + (opcode & 0x0FFF);
                break;
            case 0xC000:
                //Cxkk - RND Vx, byte
                //Set Vx = random byte AND kk
                this.V[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 255) & (opcode & 0x00FF);
                this.PC += 2;
                break;
            case 0xD000:
                //Dxyn - DRW Vx, Vy, nibble
                //Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. 
                //Each row of 8 pixels is read as bit-coded starting from memory location I; 
                //I value doesn’t change after the execution of this instruction. 
                //As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the 
                //sprite is drawn, and to 0 if that doesn’t happen.
                let height = opcode & 0x000F;
                let x = this.V[(opcode & 0x0F00) >> 8];
                let y = this.V[(opcode & 0x00F0) >> 4];
                let pixel = null;
                this.V[0xF] = 0;
                //Loop over the rows
                for (let yline = 0; yline < height; yline++) {
                    pixel = this.memory[this.I + yline];
                    //Loop over 8 bits of a row
                    for (let xline = 0; xline < 8; xline++) {
                        //Scans through the byte and checks if there is anything to write
                        if ((pixel & (0b10000000 >> xline)) != 0) {
                            //Check for collision
                            if (this.graphics[(x + xline + ((y + yline) * this.displayWidth))] == 1)
                                this.v[0xF] = 1;
                            //Perform XOR
                            this.graphics[(x + xline + ((y + yline) * this.displayWidth))] ^= 1;
                        }
                    }
                }
                //Set the draw flag
                this.drawScreen = true;
                this.PC += 2;
                break;
            case 0xE000:
                handle_0xE(opcode);
                break;
            case 0xF000:
                handle_0xF(opcode);
                break;
            default:
                console.log(`Invalid Opcode: ${"0x" + opcode.toString(16).toUpperCase()}`);
        }

    }

    handle_0x0(opcode) {
        switch (opcode & 0x000F) {
            case 0x0000:
                //00E0 - CLS
                //Clear the display
                for (let i = 0; i < this.display.length; i++)
                    this.display[i] = 0;
                this.drawScreen = true;
                this.PC += 2;
                break;
            case 0x000E:
                //00EE - RET
                //Return from a subroutine
                this.SP--;
                this.PC = this.stack[this.SP];
                this.PC += 2;
                break;
        }
    }

    handle_0x8(opcode) {
        switch (opcode & 0x000F) {
            case 0x0000:
                //8xy0 - LD Vx, Vy
                //Set Vx = Vy
                this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x00F0) >> 4];
                this.PC += 2;
                break;
            case 0x0001:
                //8xy1 - OR Vx, Vy
                //Set Vx = Vx OR Vy
                this.V[(opcode & 0x0F00) >> 8] |= this.V[(opcode & 0x00F0) >> 4];
                this.PC += 2;
                break;
            case 0x0003:
                //8xy3 - XOR Vx, Vy
                //Set Vx = Vx XOR Vy
                this.V[(opcode & 0x0F00) >> 8] ^= this.V[(opcode & 0x00F0) >> 4];
                this.PC += 2;
                break;
            case 0x0004:
                //8xy4 - ADD Vx, Vy
                //Set Vx = Vx + Vy, set VF = 1 if Vx + Vy > 255 (0xFF)
                let sum = this.V[(opcode & 0x0F00) >> 8] + this.V[(opcode & 0x00F0) >> 4];
                if (sum > 0xFF) {
                    this.V[(opcode & 0x0F00) >> 8] = 0xFF;
                    this.V[0xF] = 1;
                }
                else {
                    this.V[(opcode & 0x0F00) >> 8] = sum;
                    this.V[0xF] = 0;
                }
                this.PC += 2;
                break;
            case 0x0005:
                //8xy5 - SUB Vx, Vy
                //Set Vx = Vx - Vy, if Vx > Vy then VF = 1
                if (this.V[(opcode & 0x0F00) >> 8] > this.v[(opcode & 0x00F0) >> 4])
                    this.V[0xF] = 1
                else
                    this.V[0xF] = 0;
                this.V[(opcode & 0x0F00) >> 8] -= this.V[(opcode & 0x00F0) >> 4];
                this.PC += 2;
                break;
            case 0x0006:
                //8xy6 - SHR Vx {, Vy}
                //Set VF = Vx SHR 1, then Vx >> 1
                this.V[0xF] = this.V[(opcode & 0x0F00) >> 8] && 0x01;
                this.v[(opcode & 0x0F00) >> 8] >>= 1;
                this.PC += 2;
                break;
            case 0x0007:
                //8xy7 - SUBN Vx, Vy
                //Set Vx = Vy - Vx, if Vy > Vx then VF = 1
                if (this.V[(opcode & 0x00F0) >> 4] > this.v[(opcode & 0x0F00) >> 8])
                    this.V[0xF] = 1
                else
                    this.V[0xF] = 0;
                this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x00F0) >> 4] - this.V[(opcode & 0x0F00) >> 8];
                this.PC += 2;
                break;
            case 0x000E:
                //8xyE - SHL Vx {, Vy}
                //Set VF = Vx SHL 1, then Vx << 1
                this.V[0xF] = this.V[(opcode & 0x0F00) >> 8] >> 7;
                this.V[(opcode & 0x0F00) >> 8] <<= 1;
                this.PC += 2;
                break;
        }
    }

    handle_0xE(opcode) {
        switch (opcode & 0x000F) {
            case 0x000E:
                //Ex9E - SKP Vx
                //Skip next instruction if key with the value of Vx is pressed
                //TODO
                break;
            case 0x0001:
                //ExA1 - SKNP Vx
                //Skip next instruction if key with the value of Vx is not pressed
                //TODO
                break;
        }
    }

    handle_0xF(opcode) {
        switch (opcode & 0x00FF) {
            case 0x0007:
                //Fx07 - LD Vx, DT
                //Set Vx = delay timer value
                this.V[(opcode & 0x0F00) >> 8] = this.delayTimer;
                this.PC += 2;
                break;
            case 0x000A:
                //Fx0A - LD Vx, K
                //Wait for a key press, store the value of the key in Vx
                //TODO
                break;
            case 0x0015:
                //Fx15 - LD DT, Vx
                //Set delay timer = Vx
                this.delayTimer = this.V[(opcode & 0x0F00) >> 8];
                this.PC += 2;
                break;
            case 0x0018:
                //Fx18 - LD ST, Vx
                //Set sound timer = Vx
                this.soundTimer = this.V[(opcode & 0x0F00) >> 8];
                this.PC += 2;
                break;
            case 0x001E:
                //Fx1E - ADD I, Vx
                //Set I = I + Vx
                this.I += this.V[(opcode & 0x0F00) >> 8];
                this.PC += 2;
                break;
            case 0x0029:
                //Fx29 - LD F, Vx
                //Set I = location of sprite for digit Vx
                this.I = this.memory[this.V[(opcode & 0x0F00) >> 8] * 5];
                this.PC += 2;
                break;
            case 0x0033:
                //Fx33 - LD B, Vx
                //Store BCD representation of Vx in memory locations I, I+1, and I+2
                //TODO
                break;
            case 0x0055:
                //Fx55 - LD [I], Vx
                //Store registers V0 through Vx in memory starting at location I
                //I is set to I + X + 1 after operation
                //TODO
                break;
            case 0x0065:
                //Fx65 - LD Vx, [I]
                //Read registers V0 through Vx from memory starting at location I
                //I is set to I + X + 1 after operation
                //TODO
                break;
        }
    }

};