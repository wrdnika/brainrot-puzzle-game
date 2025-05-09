// src/levelList.js
import { getProgress } from "./storage.js";

export function renderLevelList(container) {
  const prog = getProgress();
  container.innerHTML = "";

  // Create header
  const header = document.createElement("div");
  header.className = "w-full text-center mb-8";
  header.innerHTML = `
    <p class="text-gray-600">Select a level to play</p>
  `;
  container.appendChild(header);

  // Create level grid container
  const levelGrid = document.createElement("div");
  levelGrid.className =
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto";
  container.appendChild(levelGrid);

  // Create level cards
  for (let i = 1; i <= 10; i++) {
    const unlocked = prog.unlocked.includes(i);

    // Create level card
    const levelCard = document.createElement("div");
    levelCard.className = unlocked
      ? "relative bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
      : "relative bg-gray-100 rounded-lg shadow overflow-hidden grayscale transition-transform";

    // Create thumbnail container
    const thumbnailContainer = document.createElement("div");
    thumbnailContainer.className = "w-full h-24 overflow-hidden relative";

    // Create thumbnail
    const thumbnail = document.createElement("img");
    thumbnail.src = `/images/level${i}.png`;
    thumbnail.alt = `Level ${i} Thumbnail`;
    thumbnail.className = "w-full h-full object-cover";
    thumbnailContainer.appendChild(thumbnail);

    // Add lock overlay for locked levels
    if (!unlocked) {
      const lockOverlay = document.createElement("div");
      lockOverlay.className =
        "absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center";

      // Create lock icon
      const lockIcon = document.createElement("div");
      lockIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      `;
      lockOverlay.appendChild(lockIcon);
      thumbnailContainer.appendChild(lockOverlay);
    }

    levelCard.appendChild(thumbnailContainer);

    // Create level info
    const levelInfo = document.createElement("div");
    levelInfo.className = "p-3 text-center";

    // Level number
    const levelNumber = document.createElement("h3");
    levelNumber.className = unlocked
      ? "font-bold text-lg text-blue-600"
      : "font-bold text-lg text-gray-500";
    levelNumber.textContent = `Level ${i}`;
    levelInfo.appendChild(levelNumber);

    // Status badge
    const statusBadge = document.createElement("div");
    statusBadge.className = unlocked
      ? "text-xs font-medium bg-green-100 text-green-800 rounded-full px-2 py-1 mt-1 inline-block"
      : "text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-1 mt-1 inline-block";
    statusBadge.textContent = unlocked ? "Unlocked" : "Locked";
    levelInfo.appendChild(statusBadge);

    levelCard.appendChild(levelInfo);

    // Add level card to grid
    levelGrid.appendChild(levelCard);

    // Add click event only if level is unlocked
    if (unlocked) {
      levelCard.addEventListener("click", () => {
        // Add click animation
        levelCard.classList.add("scale-95");
        setTimeout(() => {
          levelCard.classList.remove("scale-95");
          window.location.hash = `level-${i}`;
        }, 200);
      });
    }
  }
}
