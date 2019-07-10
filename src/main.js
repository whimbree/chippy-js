'use strict';

let chip8 = new Chip8();

window.addEventListener('keydown', chip8.keyboard.isDown.bind(chip8.keyboard));
window.addEventListener('keyup', chip8.keyboard.isUp.bind(chip8.keyboard));

// Set up rom loading form.
let rom_select = document.getElementById('rom-selector');
let opt = document.createElement('option');
opt.hidden = true;
opt.selected = true;
opt.disabled = true;
let default_string = 'Select a ROM!';
opt.text = default_string;
rom_select.appendChild(opt);
let rom_list = [
  '15PUZZLE',
  'BLINKY',
  'BLITZ',
  'BRIX',
  'CONNECT4',
  'GUESS',
  'HIDDEN',
  'INVADERS',
  'KALEID',
  'MAZE',
  'MERLIN',
  'MISSILE',
  'PONG',
  'PONG2',
  'PUZZLE',
  'SYZYGY',
  'TANK',
  'TETRIS',
  'TICTAC',
  'UFO',
  'VBRIX',
  'VERS'
];
rom_list.forEach(i => {
  let opt = document.createElement('option');
  opt.textContent = i;
  opt.value = i;
  rom_select.appendChild(opt);
});
chip8.canvasRender.render(chip8.display);

let emu_interval = null;
let fps = 300;
let interval_time_ms = (1 / fps) * 1000;

function startEmu() {
  stopEmu();
  let rom_name =
    rom_select.value || rom_select.options[rom_select.selectedIndex].value;
  console.log(rom_name);
  if (rom_name == default_string) {
    alert('Please select a ROM');
    return;
  }
  let xhr = new XMLHttpRequest();
  xhr.open('GET', `./roms/${rom_name}`, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = loadAndInit;
  xhr.send();

  function loadAndInit() {
    chip8.init();
    chip8.loadROM(new Uint8Array(xhr.response));
    let runCycle = chip8.runCycle.bind(chip8);
    emu_interval = setInterval(runCycle, interval_time_ms);
  }
}

function stopEmu() {
  clearInterval(emu_interval);
}

// Set up start button
let start_btn = document.getElementById('start-btn');
start_btn.onclick = startEmu;

// Set up stop button
let stop_btn = document.getElementById('stop-btn');
stop_btn.onclick = stopEmu;

// while (false) {}
