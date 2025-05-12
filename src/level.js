import { Howl, Howler } from "howler";
import { unlockLevel } from "./storage.js";
import { renderLevelList } from "./levelList.js";

const SIZE = 3;
const TILE_COUNT = SIZE * SIZE;

// Audio management
let backgroundSound = null;
let audioContext = null;
let audioUnlocked = false;
let soundEnabled = true;
let currentLevelSound = null; // Track current level sound
let activeAudioSources = []; // Track all active sounds to properly clean up

// Create a single instance of AudioContext
function getAudioContext() {
  if (!audioContext) {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
    } catch (e) {
      console.error("AudioContext not supported:", e);
    }
  }
  return audioContext;
}

// Force release all audio resources
function releaseAllAudio() {
  // Stop all active Howler sounds
  Howler.stop();

  // Clean up our tracked sounds
  if (backgroundSound) {
    backgroundSound.stop();
    backgroundSound.unload();
    backgroundSound = null;
  }

  // Clear all active audio sources
  activeAudioSources.forEach((sound) => {
    if (sound && typeof sound.unload === "function") {
      sound.stop();
      sound.unload();
    }
  });
  activeAudioSources = [];

  // Reset current level sound
  currentLevelSound = null;
}

// Aggressively unlock audio on mobile
function unlockAudio() {
  if (audioUnlocked) return Promise.resolve(true);

  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);

  return new Promise((resolve) => {
    // First make sure context is resumed
    const resumePromise =
      ctx.state === "suspended" ? ctx.resume() : Promise.resolve();

    resumePromise
      .then(() => {
        // Create and play a silent buffer
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.001; // Very quiet but not completely silent (helps on iOS)

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Play the empty sound
        if (typeof source.start === "function") {
          source.start(0);
        } else {
          source.noteOn(0);
        }

        // Also unlock Howler.js specifically
        try {
          Howler.ctx = ctx;
          if (Howler._scratchBuffer) {
            const unlockSource = ctx.createBufferSource();
            unlockSource.buffer = Howler._scratchBuffer;
            unlockSource.connect(ctx.destination);
            unlockSource.start(0);
          }
        } catch (e) {
          console.warn("Howler unlock failed:", e);
        }

        // Confirm audio is unlocked
        audioUnlocked = true;
        console.log("Audio context unlocked:", ctx.state);
        resolve(true);
      })
      .catch((err) => {
        console.error("Failed to resume AudioContext:", err);
        resolve(false);
      });
  });
}

// Setup multiple event listeners for audio unlocking
function setupAudioUnlock() {
  if (audioUnlocked) return;

  // Comprehensive list of events that might unlock audio
  const unlockEvents = [
    "touchstart",
    "touchend",
    "mousedown",
    "mouseup",
    "click",
    "keydown",
    "focus",
    "visibilitychange",
  ];

  const unlockHandler = async () => {
    const success = await unlockAudio();

    if (success) {
      console.log("Audio system fully unlocked for mobile!");

      // Remove all event listeners once audio is unlocked
      unlockEvents.forEach((event) => {
        document.removeEventListener(event, unlockHandler, true);
        document.body.removeEventListener(event, unlockHandler, true);
        window.removeEventListener(event, unlockHandler, true);
      });

      // Start background sound if it exists and should be playing
      if (currentLevelSound && soundEnabled) {
        try {
          startBackgroundMusic(currentLevelSound);
        } catch (e) {
          console.error("Error starting background sound:", e);
        }
      }
    }
  };

  // Add listeners to document, body, and window for maximum coverage
  unlockEvents.forEach((event) => {
    document.addEventListener(event, unlockHandler, true);
    document.body.addEventListener(event, unlockHandler, true);
    window.addEventListener(event, unlockHandler, true);
  });
}

// Create and manage a sound with better error handling and resource tracking
function createSound(src, options = {}) {
  // Ensure the file path is correct and absolute
  if (!src.startsWith("/")) {
    src = "/" + src;
  }

  const defaultOptions = {
    src: [src],
    html5: true, // Use HTML5 Audio for better mobile compatibility
    preload: true,
    volume: options.volume || 0.7,
    format: ["mp3"],
    onloaderror: function (id, err) {
      console.error(`Sound loading error for ${src}:`, err);
    },
    onplayerror: function (id, err) {
      console.error(`Sound play error for ${src}:`, err);

      // Try to recover by unlocking audio again
      unlockAudio().then(() => {
        if (this.state() === "loaded") {
          this.play();
        }
      });
    },
  };

  // Merge options
  const soundOptions = { ...defaultOptions, ...options };

  try {
    const sound = new Howl(soundOptions);

    // Track this sound for cleanup
    activeAudioSources.push(sound);

    return sound;
  } catch (e) {
    console.error("Failed to create sound:", e);
    return null;
  }
}

// Safely play a sound with unlocking attempt
function playSound(sound) {
  if (!sound || !soundEnabled) return;

  // Ensure audio is unlocked first
  unlockAudio().then((success) => {
    if (success && sound) {
      try {
        // For iOS, we create a user gesture triggered playback
        const playPromise = sound.play();

        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err) => {
            console.warn("Sound play promise rejected:", err);

            // Try one more time with delay
            setTimeout(() => {
              unlockAudio().then(() => sound.play());
            }, 100);
          });
        }
      } catch (e) {
        console.error("Error playing sound:", e);
      }
    }
  });
}

// Special function for background music to ensure it loops properly
function startBackgroundMusic(levelNumber) {
  // Clean up previous background sound
  if (backgroundSound) {
    backgroundSound.stop();
    backgroundSound.unload();
    backgroundSound = null;
  }

  // Store current level for reference
  currentLevelSound = levelNumber;

  // Create and configure background sound
  backgroundSound = createSound(`/src/assets/sounds/level${levelNumber}.mp3`, {
    loop: true,
    volume: 0.8,
    html5: true,
    onend: function () {
      // Double-check loop is working - manually restart if needed
      if (backgroundSound && !backgroundSound.playing() && soundEnabled) {
        console.log("Background music ended - manually restarting");
        backgroundSound.play();
      }
    },
  });

  // Add a watchdog timer to ensure looping works
  if (backgroundSound) {
    backgroundSound._watchdogInterval = setInterval(() => {
      if (backgroundSound && soundEnabled && !backgroundSound.playing()) {
        console.log("Watchdog detected stopped background music - restarting");
        backgroundSound.play();
      }
    }, 2000);

    // Play with delay to ensure loading is complete
    setTimeout(() => {
      if (audioUnlocked && soundEnabled && backgroundSound) {
        backgroundSound.play();
      }
    }, 200);
  }
}

// Initialize audio system
function initAudio() {
  // Try to unlock audio immediately
  unlockAudio();

  // Setup event listeners for later unlocking if needed
  setupAudioUnlock();

  // Setup visibility change handling for background/foreground transitions
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Page is now visible - resume audio if needed
      unlockAudio().then(() => {
        if (backgroundSound && soundEnabled && !backgroundSound.playing()) {
          backgroundSound.play();
        }
      });
    }
  });
}

// Call initialization on module load
initAudio();

export function renderLevel(n, container) {
  container.innerHTML = "";

  // Force cleanup of all audio resources from previous level
  releaseAllAudio();

  // Try to unlock audio
  initAudio();

  // Start background music for this level
  startBackgroundMusic(n);

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

  // Sound toggle button with improved handling
  document.getElementById("soundBtn").addEventListener("click", () => {
    // First try to unlock audio
    unlockAudio().then(() => {
      soundEnabled = !soundEnabled;

      if (soundEnabled) {
        document.getElementById("soundBtn").textContent = "🔊 Sound";
        if (backgroundSound && !backgroundSound.playing()) {
          backgroundSound.play();
        } else if (!backgroundSound) {
          // Recreate background sound if it was unloaded
          startBackgroundMusic(n);
        }
      } else {
        document.getElementById("soundBtn").textContent = "🔇 Sound";
        if (backgroundSound) {
          backgroundSound.pause();
        }
      }
    });
  });

  // Pre-create the move sound to avoid delays
  const moveSound = createSound("/src/assets/sounds/move.mp3", { volume: 0.5 });

  // Tile movement handling
  grid.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-idx]");
    if (!tile) return;

    const idx = parseInt(tile.dataset.idx);
    if (isNaN(idx)) return;

    const emptyIdx = tiles.indexOf(0);
    if (isNeighbor(idx, emptyIdx)) {
      // Play move sound - reuse the pre-created sound
      if (moveSound) {
        // Clone the sound to allow overlapping playback
        moveSound.stop();
        playSound(moveSound);
      }

      // Update tiles
      [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
      renderImageTiles(tiles, grid, fullImage, n);

      // Check if puzzle is solved
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
    // Clean up all audio resources properly
    releaseAllAudio();

    container.innerHTML = "";

    const lvlContainer = document.createElement("div");
    lvlContainer.className = "flex flex-wrap justify-center";
    container.appendChild(lvlContainer);

    window.location.hash = "";

    renderLevelList(lvlContainer);
  });

  function onSolved() {
    // Clean up audio resources
    releaseAllAudio();

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

    // Play victory sound with reliable playback
    const victorySound = createSound("/src/assets/sounds/victory.mp3", {
      volume: 0.7,
      onend: function () {
        // Remove this sound from active tracking when it's done
        const index = activeAudioSources.indexOf(this);
        if (index >= 0) {
          activeAudioSources.splice(index, 1);
        }
      },
    });

    // Use timeout to ensure audio context is ready
    setTimeout(() => playSound(victorySound), 100);

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
