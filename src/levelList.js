import { getProgress } from "./storage.js";

export function renderLevelList(container) {
  const prog = getProgress();
  container.innerHTML = "";

  const header = document.createElement("div");
  header.className = "w-full text-center mb-1";
  header.innerHTML = `
    <p class="text-white">Select a level to play</p>
  `;
  container.appendChild(header);

  const levelGrid = document.createElement("div");
  levelGrid.className =
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto";
  container.appendChild(levelGrid);

  for (let i = 1; i <= 10; i++) {
    const unlocked = prog.unlocked.includes(i);

    const levelCard = document.createElement("div");
    levelCard.className = unlocked
      ? "relative bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
      : "relative bg-gray-100 rounded-lg shadow overflow-hidden grayscale transition-transform";

    const thumbnailContainer = document.createElement("div");
    thumbnailContainer.className = "w-full h-24 overflow-hidden relative";

    const thumbnail = document.createElement("img");
    thumbnail.src = `/images/level${i}.png`;
    thumbnail.alt = `Level ${i} Thumbnail`;
    thumbnail.className = "w-full h-full object-cover";
    thumbnailContainer.appendChild(thumbnail);

    if (!unlocked) {
      const lockOverlay = document.createElement("div");
      lockOverlay.className =
        "absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center";

      const lockIcon = document.createElement("i");
      lockIcon.className = "fas fa-lock text-white text-3xl";
      lockOverlay.appendChild(lockIcon);
      thumbnailContainer.appendChild(lockOverlay);
    }

    levelCard.appendChild(thumbnailContainer);

    const levelInfo = document.createElement("div");
    levelInfo.className = "p-3 text-center";

    const levelNumber = document.createElement("h3");
    levelNumber.className = unlocked
      ? "font-bold text-lg text-blue-600"
      : "font-bold text-lg text-gray-500";
    levelNumber.textContent = `Level ${i}`;
    levelInfo.appendChild(levelNumber);

    const statusBadge = document.createElement("div");
    statusBadge.className = unlocked
      ? "text-xs font-medium bg-green-100 text-green-800 rounded-full px-2 py-1 mt-1 inline-block"
      : "text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-1 mt-1 inline-block";
    statusBadge.textContent = unlocked ? "Unlocked" : "Locked";
    levelInfo.appendChild(statusBadge);

    levelCard.appendChild(levelInfo);

    levelGrid.appendChild(levelCard);

    if (unlocked) {
      levelCard.addEventListener("click", () => {
        levelCard.classList.add("scale-95");
        setTimeout(() => {
          levelCard.classList.remove("scale-95");
          window.location.hash = `level-${i}`;
        }, 200);
      });
    }
  }
}
