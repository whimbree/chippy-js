'use strict';

let chip8 = new Chip8();

window.addEventListener('keydown', chip8.keyboard.isDown.bind(chip8.keyboard));
window.addEventListener('keyup', chip8.keyboard.isUp.bind(chip8.keyboard));

// Set up rom loading form.
let romSelect = document.getElementById('rom-selector');
let opt = document.createElement('option');
opt.hidden = true;
opt.selected = true;
opt.disabled = true;
let defaultString = 'Select a ROM!';
opt.text = defaultString;
romSelect.appendChild(opt);
let romList = [
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
  'OPCODE_TEST',
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
romList.forEach(i => {
  let opt = document.createElement('option');
  opt.textContent = i;
  opt.value = i;
  romSelect.appendChild(opt);
});
chip8.canvasRender.render(chip8.display);

let emuInterval = null;
let fps = 60;
let interval_time_ms = (1 / fps) * 1000;

function startEmu() {
  stopEmu();
  let rom_name =
    romSelect.value || romSelect.options[romSelect.selectedIndex].value;
  console.log(rom_name);
  if (rom_name == defaultString) {
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
    emuInterval = setInterval(runCycle, interval_time_ms);
  }
}

function stopEmu() {
  clearInterval(emuInterval);
}

// Set up start button
let startBtn = document.getElementById('start-btn');
startBtn.onclick = startEmu;

// Set up stop button
let stopBtn = document.getElementById('stop-btn');
stopBtn.onclick = stopEmu;

// while (false) {}
