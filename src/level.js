// src/level.js
import { Howl } from "howler";
import { unlockLevel } from "./storage.js";
import { renderLevelList } from "./levelList.js";

const SIZE = 3; // ukuran grid 3×3
const TILE_COUNT = SIZE * SIZE;

export function renderLevel(n, container) {
  container.innerHTML = "";

  // ─── BACKGROUND SOUND ──────────────────────────────────
  const sound = new Howl({
    src: [`/src/assets/sounds/level${n}.mp3`],
    loop: true,
  });
  sound.play();

  // ─── HEADER ────────────────────────────────────────────
  const header = document.createElement("div");
  header.className = "flex justify-between items-center mb-4";
  header.innerHTML = `
    <h2 class="text-xl font-semibold">Level ${n}</h2>
    <div>
      <button id="restartBtn" class="px-3 py-1 bg-yellow-400 rounded mr-2">Restart</button>
      <button id="backBtn" class="px-3 py-1 bg-gray-300 rounded">Back</button>
    </div>`;
  container.appendChild(header);

  // ─── PREVIEW IMAGE (MINI) ────────────────────────────────
  const previewContainer = document.createElement("div");
  previewContainer.className = "flex justify-center mb-4";

  const previewImg = document.createElement("img");
  previewImg.src = `/images/level${n}.png`;
  previewImg.alt = `Puzzle Level ${n}`;
  previewImg.className =
    "w-32 h-32 object-cover rounded shadow-md border-2 border-gray-300";
  previewContainer.appendChild(previewImg);
  container.appendChild(previewContainer);

  // ─── GRID CONTAINER ───────────────────────────────────
  const grid = document.createElement("div");
  grid.id = "puzzleGrid";
  grid.className =
    "grid grid-cols-3 gap-1 mx-auto w-72 h-72 border-2 border-gray-600 rounded p-1 bg-gray-800";
  container.appendChild(grid);

  // Definisikan tiles di sini agar bisa diakses oleh semua fungsi dalam renderLevel
  let tiles = Array.from({ length: TILE_COUNT }, (_, i) => i);

  // ─── PRELOAD IMAGE FOR TILES ─────────────────────────
  const fullImage = new Image();
  fullImage.src = `/images/level${n}.png`;
  fullImage.onload = () => {
    // ─── SETUP TILES ───────────────────────────────────────
    shuffle(tiles);
    renderImageTiles(tiles, grid, fullImage, n);

    // Make sure puzzle is solvable
    if (!isSolvable(tiles)) {
      // If not solvable, swap any two non-empty tiles
      const idx1 = tiles.findIndex((t) => t !== 0);
      const idx2 = tiles.findIndex((t, i) => t !== 0 && i !== idx1);
      [tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]];
      renderImageTiles(tiles, grid, fullImage, n);
    }
  };

  // ─── EVENT LISTENERS ───────────────────────────────────
  grid.addEventListener("click", (e) => {
    // Find the closest tile if the click is on a child element
    const tile = e.target.closest("[data-idx]");
    if (!tile) return;

    const idx = parseInt(tile.dataset.idx);
    if (isNaN(idx)) return;

    const emptyIdx = tiles.indexOf(0);
    if (isNeighbor(idx, emptyIdx)) {
      // Play move sound (if exists)
      try {
        const moveSound = new Howl({
          src: ["/src/assets/sounds/move.mp3"],
          volume: 0.5,
        });
        moveSound.play();
      } catch (error) {
        console.log("Move sound not available");
      }

      // Swap tiles
      [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
      renderImageTiles(tiles, grid, fullImage, n);

      // Check if solved
      if (isSolved(tiles)) onSolved();
    }
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    shuffle(tiles);
    // Ensure puzzle is solvable after shuffle
    if (!isSolvable(tiles)) {
      const idx1 = tiles.findIndex((t) => t !== 0);
      const idx2 = tiles.findIndex((t, i) => t !== 0 && i !== idx1);
      [tiles[idx1], tiles[idx2]] = [tiles[idx2], tiles[idx1]];
    }
    renderImageTiles(tiles, grid, fullImage, n);
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    sound.stop();
    container.innerHTML = "";
    const lvlContainer = document.createElement("div");
    lvlContainer.className = "flex flex-wrap justify-center";
    container.appendChild(lvlContainer);
    renderLevelList(lvlContainer);
  });

  // ─── HELPERS ───────────────────────────────────────────
  function onSolved() {
    sound.stop();

    // Show complete image with celebration effect
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

    continueBtn.addEventListener("click", () => {
      document.body.removeChild(celebrationOverlay);

      // Unlock next level
      if (n < 10) unlockLevel(n + 1);

      // Back to level list
      container.innerHTML = "";
      const lvlContainer = document.createElement("div");
      lvlContainer.className = "flex flex-wrap justify-center";
      container.appendChild(lvlContainer);
      renderLevelList(lvlContainer);
    });
  }
}

// Fisher–Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Check if the puzzle is solvable
function isSolvable(tiles) {
  // Count inversions
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === 0) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] === 0) continue;
      if (tiles[i] > tiles[j]) inversions++;
    }
  }

  // For 3x3 puzzles with blank at position N from the end, the puzzle is solvable if:
  // - N is odd and inversions is even, or
  // - N is even and inversions is odd
  const blankPosition = tiles.indexOf(0);
  const blankRow = Math.floor(blankPosition / SIZE);
  const N = SIZE - blankRow;

  return (
    (N % 2 === 1 && inversions % 2 === 0) ||
    (N % 2 === 0 && inversions % 2 === 1)
  );
}

// render tiap tile sebagai potongan gambar
function renderImageTiles(tiles, grid, fullImage, levelNum) {
  grid.innerHTML = "";
  const tileSize = fullImage.width / SIZE;

  tiles.forEach((val, i) => {
    const tile = document.createElement("div");

    // Position in the grid
    const gridX = i % SIZE;
    const gridY = Math.floor(i / SIZE);

    if (val === 0) {
      // Empty tile
      tile.className = "w-full h-full bg-gray-200 rounded";
    } else {
      // Image tile
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;

      const ctx = tileCanvas.getContext("2d");

      // Calculate position in original image
      const srcX = ((val - 1) % SIZE) * tileSize;
      const srcY = Math.floor((val - 1) / SIZE) * tileSize;

      // Draw piece of the image
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

      // Add border to image
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, tileSize, tileSize);

      tile.style.backgroundImage = `url(${tileCanvas.toDataURL()})`;
      tile.style.backgroundSize = "cover";
      tile.className =
        "w-full h-full cursor-pointer rounded shadow transition-transform hover:scale-105";
    }

    // Common properties
    tile.style.width = "100%";
    tile.style.height = "100%";
    tile.dataset.idx = i;
    tile.dataset.val = val;

    grid.appendChild(tile);
  });
}

// cek neighbor (bergerak hanya ke posisi kosong)
function isNeighbor(idx, emptyIdx) {
  const x1 = idx % SIZE,
    y1 = Math.floor(idx / SIZE);
  const x2 = emptyIdx % SIZE,
    y2 = Math.floor(emptyIdx / SIZE);
  const dx = Math.abs(x1 - x2),
    dy = Math.abs(y1 - y2);
  return dx + dy === 1;
}

// cek solved (urut 1…8, then 0)
function isSolved(tiles) {
  for (let i = 0; i < TILE_COUNT - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[TILE_COUNT - 1] === 0;
}
