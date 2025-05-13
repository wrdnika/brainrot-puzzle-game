import { Howl } from "howler";
import { unlockLevel } from "./storage.js";
import { renderLevelList } from "./levelList.js";

const SIZE = 3;
const TILE_COUNT = SIZE * SIZE;

let backgroundSound = null;
let soundEnabled = true;

export function renderLevel(n, container) {
  container.innerHTML = "";

  if (backgroundSound) {
    backgroundSound.stop();
    backgroundSound = null;
  }

  backgroundSound = new Howl({
    src: [`/sounds/level${n}.mp3`],
    loop: true,
    volume: 0.8,
  });

  if (soundEnabled) {
    backgroundSound.play();
  }

  const header = document.createElement("div");
  header.className = "flex justify-between items-center mb-4";
  header.innerHTML = `
    <h2 class="text-xl font-semibold">Level ${n}</h2>
    <div>
      <button id="restartBtn" class="text-black hover:text-white bg-yellow-400 hover:bg-gray-400 transition-all px-4 py-2 rounded-2xl text-sm font-medium items-center shadow hover:shadow-lg">Restart</button>
      <button id="backBtn" class="text-black hover:text-white bg-gray-200 hover:bg-gray-400 transition-all px-4 py-2 rounded-2xl text-sm font-medium items-center shadow hover:shadow-lg">Back</button>
      <button id="soundBtn" class="text-black hover:text-white bg-blue-300 hover:bg-blue-400 transition-all px-4 py-2 rounded-2xl text-sm font-medium items-center shadow hover:shadow-lg">${
        soundEnabled ? "🔊 Sound" : "🔇 Sound"
      }</button>
    </div>`;
  container.appendChild(header);

  const mainGameContainer = document.createElement("div");
  mainGameContainer.className =
    "flex flex-col sm:flex-row justify-center items-center sm:items-start gap-4 mb-4";
  container.appendChild(mainGameContainer);

  const previewImg = document.createElement("img");
  previewImg.src = `/images/level${n}.png`;
  previewImg.alt = `Puzzle Level ${n}`;
  previewImg.className =
    "w-36 h-36 object-cover rounded shadow-md border-2 border-gray-300";
  mainGameContainer.appendChild(previewImg);

  const grid = document.createElement("div");
  grid.id = "puzzleGrid";
  grid.className =
    "grid grid-cols-3 gap-1 w-80 h-80 border-2 border-gray-600 rounded p-1 bg-gray-800";
  mainGameContainer.appendChild(grid);

  let tiles = Array.from({ length: TILE_COUNT }, (_, i) => i);

  const fullImage = new Image();
  fullImage.src = `/images/level${n}.png`;
  fullImage.onload = () => {
    shuffle(tiles);
    renderImageTiles(tiles, grid, fullImage, n);

    if (!isSolvable(tiles)) {
      const idx1 = tiles.findIndex((t) => t !== 0);
      const idx2 = tiles.findIndex((t, i) => t !== 0 && i !== idx1);
      [tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]];
      renderImageTiles(tiles, grid, fullImage, n);
    }
  };

  document.getElementById("soundBtn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    document.getElementById("soundBtn").textContent = soundEnabled
      ? "🔊 Sound"
      : "🔇 Sound";

    if (soundEnabled) {
      if (backgroundSound) backgroundSound.play();
    } else {
      if (backgroundSound) backgroundSound.pause();
    }
  });

  grid.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-idx]");
    if (!tile) return;

    const idx = parseInt(tile.dataset.idx);
    if (isNaN(idx)) return;

    const emptyIdx = tiles.indexOf(0);
    if (isNeighbor(idx, emptyIdx)) {
      if (soundEnabled) {
        const moveSound = new Howl({
          src: ["/src/assets/sounds/move.mp3"],
          volume: 0.5,
        });
        moveSound.play();
      }

      [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
      renderImageTiles(tiles, grid, fullImage, n);

      if (isSolved(tiles)) onSolved();
    }
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    shuffle(tiles);
    if (!isSolvable(tiles)) {
      const idx1 = tiles.findIndex((t) => t !== 0);
      const idx2 = tiles.findIndex((t, i) => t !== 0 && i !== idx1);
      [tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]];
    }
    renderImageTiles(tiles, grid, fullImage, n);
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    if (backgroundSound) {
      backgroundSound.stop();
      backgroundSound = null;
    }

    container.innerHTML = "";
    const lvlContainer = document.createElement("div");
    lvlContainer.className = "flex flex-wrap justify-center";
    container.appendChild(lvlContainer);

    window.location.hash = "";

    renderLevelList(lvlContainer);
  });

  function onSolved() {
    if (backgroundSound) {
      backgroundSound.stop();
      backgroundSound = null;
    }

    const celebrationOverlay = document.createElement("div");
    celebrationOverlay.className =
      "fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50";

    const completedImage = document.createElement("img");
    completedImage.src = `/images/level${n}.png`;
    completedImage.className =
      "w-64 h-64 object-cover rounded shadow-lg mb-4 animate-bounce";

    const message = document.createElement("div");
    message.className = "text-white text-2xl font-bold mb-4";
    message.textContent = "Congratulations! Level " + n + " solved!";

    const continueBtn = document.createElement("button");
    continueBtn.className =
      "px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600";
    continueBtn.textContent = "Continue";

    celebrationOverlay.appendChild(completedImage);
    celebrationOverlay.appendChild(message);
    celebrationOverlay.appendChild(continueBtn);
    document.body.appendChild(celebrationOverlay);

    if (soundEnabled) {
      const victorySound = new Howl({
        src: ["/sounds/victory.mp3"],
        volume: 0.7,
      });
      victorySound.play();
    }

    continueBtn.addEventListener("click", () => {
      document.body.removeChild(celebrationOverlay);

      if (n < 10) unlockLevel(n + 1);

      container.innerHTML = "";
      const lvlContainer = document.createElement("div");
      lvlContainer.className = "flex flex-wrap justify-center";
      container.appendChild(lvlContainer);
      renderLevelList(lvlContainer);
    });
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isSolvable(tiles) {
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === 0) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] === 0) continue;
      if (tiles[i] > tiles[j]) inversions++;
    }
  }

  const blankPosition = tiles.indexOf(0);
  const blankRow = Math.floor(blankPosition / SIZE);
  const N = SIZE - blankRow;

  return (
    (N % 2 === 1 && inversions % 2 === 0) ||
    (N % 2 === 0 && inversions % 2 === 1)
  );
}

function renderImageTiles(tiles, grid, fullImage, levelNum) {
  grid.innerHTML = "";
  const tileSize = fullImage.width / SIZE;

  tiles.forEach((val, i) => {
    const tile = document.createElement("div");

    const gridX = i % SIZE;
    const gridY = Math.floor(i / SIZE);

    if (val === 0) {
      tile.className = "w-full h-full bg-gray-200 rounded";
    } else {
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;

      const ctx = tileCanvas.getContext("2d");

      const srcX = ((val - 1) % SIZE) * tileSize;
      const srcY = Math.floor((val - 1) / SIZE) * tileSize;

      ctx.drawImage(
        fullImage,
        srcX,
        srcY,
        tileSize,
        tileSize,
        0,
        0,
        tileSize,
        tileSize
      );

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, tileSize, tileSize);

      tile.style.backgroundImage = `url(${tileCanvas.toDataURL()})`;
      tile.style.backgroundSize = "cover";
      tile.className =
        "w-full h-full cursor-pointer rounded shadow transition-transform hover:scale-105";
    }

    tile.style.width = "100%";
    tile.style.height = "100%";
    tile.dataset.idx = i;
    tile.dataset.val = val;

    grid.appendChild(tile);
  });
}

function isNeighbor(idx, emptyIdx) {
  const x1 = idx % SIZE,
    y1 = Math.floor(idx / SIZE);
  const x2 = emptyIdx % SIZE,
    y2 = Math.floor(emptyIdx / SIZE);
  const dx = Math.abs(x1 - x2),
    dy = Math.abs(y1 - y2);
  return dx + dy === 1;
}

function isSolved(tiles) {
  for (let i = 0; i < TILE_COUNT - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[TILE_COUNT - 1] === 0;
}
