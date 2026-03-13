import { Howl } from "howler";
import { unlockLevel } from "./storage.js";
import { renderLevelList } from "./levelList.js";

const SIZE = 3;
const TILE_COUNT = SIZE * SIZE;

let backgroundSound = null;
let soundEnabled = true;

export function renderLevel(n, container) {
  container.innerHTML = "";

  if (backgroundSound) { backgroundSound.stop(); backgroundSound = null; }

  backgroundSound = new Howl({ src: [`/sounds/level${n}.mp3`], loop: true, volume: 0.6 });
  if (soundEnabled) backgroundSound.play();

  // ── TOP BAR ─────────────────────────────────────────────
  const topBar = document.createElement("div");
  topBar.style.cssText = `
    display:flex;justify-content:space-between;align-items:center;
    margin-bottom:18px;padding:10px 14px;border-radius:11px;
    background:var(--bg-card);
    border:1px solid var(--border-subtle);
  `;

  const levelLabel = document.createElement("div");
  levelLabel.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="
        width:4px;height:28px;border-radius:2px;
        background:var(--blue-400);
        box-shadow:0 0 8px rgba(37,99,235,0.5);
      "></div>
      <div>
        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:0.14em;text-transform:uppercase;">Stage</div>
        <div class="font-display font-bold text-gradient" style="font-size:1.2rem;line-height:1;">
          ${String(n).padStart(2, "0")}
        </div>
      </div>
    </div>
  `;

  const btnGroup = document.createElement("div");
  btnGroup.style.cssText = "display:flex;gap:7px;";

  const backBtn = document.createElement("button");
  backBtn.id = "backBtn";
  backBtn.className = "btn btn-ghost";
  backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i><span class="hidden sm:inline">Back</span>`;

  const restartBtn = document.createElement("button");
  restartBtn.id = "restartBtn";
  restartBtn.className = "btn btn-muted";
  restartBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i><span class="hidden sm:inline">Restart</span>`;

  const soundBtn = document.createElement("button");
  soundBtn.id = "soundBtn";
  soundBtn.className = "btn btn-muted";
  soundBtn.innerHTML = soundEnabled
    ? `<i class="fa-solid fa-volume-high"></i>`
    : `<i class="fa-solid fa-volume-xmark"></i>`;

  btnGroup.appendChild(backBtn);
  btnGroup.appendChild(restartBtn);
  btnGroup.appendChild(soundBtn);

  topBar.appendChild(levelLabel);
  topBar.appendChild(btnGroup);
  container.appendChild(topBar);

  // ── GAME AREA ────────────────────────────────────────────
  const gameArea = document.createElement("div");
  gameArea.className = "flex flex-col sm:flex-row justify-center items-center sm:items-start gap-6";
  container.appendChild(gameArea);

  // ── PREVIEW PANEL ────────────────────────────────────────
  const previewPanel = document.createElement("div");
  previewPanel.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:10px;";

  const previewLabel = document.createElement("div");
  previewLabel.style.cssText = "font-size:0.6rem;letter-spacing:0.16em;color:var(--text-muted);text-transform:uppercase;";
  previewLabel.textContent = "Target";

  const previewBorder = document.createElement("div");
  previewBorder.style.cssText = `
    padding:2px;border-radius:10px;
    background:linear-gradient(135deg,var(--blue-400),var(--blue-600),var(--blue-300));
    box-shadow:0 0 14px rgba(37,99,235,0.25);
  `;

  const previewImg = document.createElement("img");
  previewImg.src = `/images/level${n}.png`;
  previewImg.alt = `Puzzle Level ${n}`;
  previewImg.style.cssText = "width:128px;height:128px;object-fit:cover;border-radius:8px;display:block;filter:brightness(0.9);";

  previewBorder.appendChild(previewImg);
  previewPanel.appendChild(previewLabel);
  previewPanel.appendChild(previewBorder);

  // Move counter
  let moveCount = 0;
  const moveBox = document.createElement("div");
  moveBox.style.cssText = `
    text-align:center;padding:8px 20px;min-width:110px;border-radius:9px;
    background:var(--bg-card);border:1px solid var(--border-subtle);
  `;
  moveBox.innerHTML = `
    <div id="moveCounter" class="font-display font-bold text-accent" style="font-size:1.4rem;letter-spacing:0.04em;">000</div>
    <div style="font-size:0.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;">Moves</div>
  `;
  previewPanel.appendChild(moveBox);

  gameArea.appendChild(previewPanel);

  // ── PUZZLE GRID ──────────────────────────────────────────
  const gridWrap = document.createElement("div");
  gridWrap.className = "puzzle-grid-wrap";

  const gridInner = document.createElement("div");
  gridInner.className = "puzzle-grid-inner";

  const grid = document.createElement("div");
  grid.id = "puzzleGrid";
  grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:3px;width:288px;height:288px;border-radius:8px;overflow:hidden;";

  gridInner.appendChild(grid);
  gridWrap.appendChild(gridInner);
  gameArea.appendChild(gridWrap);

  // ── LOGIC ────────────────────────────────────────────────
  let tiles = Array.from({ length: TILE_COUNT }, (_, i) => i);
  const fullImage = new Image();
  fullImage.src = `/images/level${n}.png`;
  fullImage.onload = () => {
    shuffle(tiles);
    renderImageTiles(tiles, grid, fullImage);
    if (!isSolvable(tiles)) {
      const i1 = tiles.findIndex((t) => t !== 0);
      const i2 = tiles.findIndex((t, i) => t !== 0 && i !== i1);
      [tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
      renderImageTiles(tiles, grid, fullImage);
    }
  };

  soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundBtn.innerHTML = soundEnabled
      ? `<i class="fa-solid fa-volume-high"></i>`
      : `<i class="fa-solid fa-volume-xmark"></i>`;
    if (soundEnabled) { if (backgroundSound) backgroundSound.play(); }
    else              { if (backgroundSound) backgroundSound.pause(); }
  });

  grid.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-idx]");
    if (!tile) return;
    const idx = parseInt(tile.dataset.idx);
    if (isNaN(idx)) return;
    const emptyIdx = tiles.indexOf(0);
    if (isNeighbor(idx, emptyIdx)) {
      if (soundEnabled) new Howl({ src: ["/src/assets/sounds/move.mp3"], volume: 0.4 }).play();
      [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
      moveCount++;
      const counter = document.getElementById("moveCounter");
      if (counter) counter.textContent = String(moveCount).padStart(3, "0");
      renderImageTiles(tiles, grid, fullImage);
      if (isSolved(tiles)) onSolved();
    }
  });

  restartBtn.addEventListener("click", () => {
    moveCount = 0;
    const counter = document.getElementById("moveCounter");
    if (counter) counter.textContent = "000";
    shuffle(tiles);
    if (!isSolvable(tiles)) {
      const i1 = tiles.findIndex((t) => t !== 0);
      const i2 = tiles.findIndex((t, i) => t !== 0 && i !== i1);
      [tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
    }
    renderImageTiles(tiles, grid, fullImage);
  });

  backBtn.addEventListener("click", () => {
    if (backgroundSound) { backgroundSound.stop(); backgroundSound = null; }
    window.location.hash = "";
  });

  // ── WIN OVERLAY ──────────────────────────────────────────
  function onSolved() {
    if (backgroundSound) { backgroundSound.stop(); backgroundSound = null; }
    if (soundEnabled) new Howl({ src: ["/sounds/victory.mp3"], volume: 0.7 }).play();

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:100;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
      background:rgba(4,13,26,0.9);backdrop-filter:blur(14px);
      animation:fadeUp 0.3s ease;
    `;

    const imgWrap = document.createElement("div");
    imgWrap.style.cssText = `
      padding:3px;border-radius:14px;
      background:linear-gradient(135deg,var(--blue-300),var(--blue-500),var(--blue-400));
      box-shadow:0 0 30px rgba(37,99,235,0.4),0 0 60px rgba(37,99,235,0.15);
      animation:float 2.5s ease-in-out infinite;
    `;
    const completedImg = document.createElement("img");
    completedImg.src = `/images/level${n}.png`;
    completedImg.style.cssText = "width:172px;height:172px;object-fit:cover;border-radius:11px;display:block;";
    imgWrap.appendChild(completedImg);
    overlay.appendChild(imgWrap);

    const textBlock = document.createElement("div");
    textBlock.style.cssText = "text-align:center;";
    textBlock.innerHTML = `
      <div class="font-display font-bold text-gradient" style="font-size:2rem;letter-spacing:0.04em;margin-bottom:6px;">Puzzle Solved!</div>
      <div style="color:var(--text-secondary);font-size:0.83rem;">
        Level <strong style="color:var(--blue-200);">${n}</strong> cleared in
        <strong style="color:var(--blue-300);">${moveCount}</strong> moves
      </div>
    `;
    overlay.appendChild(textBlock);

    const continueBtn = document.createElement("button");
    continueBtn.className = "btn btn-primary";
    continueBtn.style.cssText = "padding:10px 28px;font-size:0.9rem;border-radius:10px;";
    continueBtn.innerHTML = `<i class="fa-solid fa-forward"></i> Continue`;
    overlay.appendChild(continueBtn);

    document.body.appendChild(overlay);

    continueBtn.addEventListener("click", () => {
      overlay.style.transition = "opacity 0.3s ease";
      overlay.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (n < 10) unlockLevel(n + 1);
        window.location.hash = "";
      }, 300);
    });
  }
}

// ── HELPERS ──────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isSolvable(tiles) {
  let inv = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === 0) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] === 0) continue;
      if (tiles[i] > tiles[j]) inv++;
    }
  }
  const blankRow = Math.floor(tiles.indexOf(0) / SIZE);
  const N = SIZE - blankRow;
  return (N % 2 === 1 && inv % 2 === 0) || (N % 2 === 0 && inv % 2 === 1);
}

function renderImageTiles(tiles, grid, fullImage) {
  grid.innerHTML = "";
  const tileSize = fullImage.width / SIZE;

  tiles.forEach((val, i) => {
    const tile = document.createElement("div");
    tile.dataset.idx = i;
    tile.dataset.val = val;
    tile.style.cssText = "width:100%;height:100%;position:relative;border-radius:3px;overflow:hidden;";

    if (val === 0) {
      tile.style.background = "var(--bg-surface)";
      tile.style.border = "1px dashed rgba(37,99,235,0.2)";
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = tileSize;
      canvas.height = tileSize;
      const ctx = canvas.getContext("2d");
      const srcX = ((val - 1) % SIZE) * tileSize;
      const srcY = Math.floor((val - 1) / SIZE) * tileSize;
      ctx.drawImage(fullImage, srcX, srcY, tileSize, tileSize, 0, 0, tileSize, tileSize);
      ctx.strokeStyle = "rgba(37,99,235,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, tileSize, tileSize);

      tile.style.backgroundImage = `url(${canvas.toDataURL()})`;
      tile.style.backgroundSize = "cover";
      tile.style.cursor = "pointer";
      tile.classList.add("tile-hover");
    }
    grid.appendChild(tile);
  });
}

function isNeighbor(idx, emptyIdx) {
  const x1 = idx % SIZE, y1 = Math.floor(idx / SIZE);
  const x2 = emptyIdx % SIZE, y2 = Math.floor(emptyIdx / SIZE);
  return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
}

function isSolved(tiles) {
  for (let i = 0; i < TILE_COUNT - 1; i++) if (tiles[i] !== i + 1) return false;
  return tiles[TILE_COUNT - 1] === 0;
}
