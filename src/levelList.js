import { getProgress } from "./storage.js";

export function renderLevelList(container) {
  const prog = getProgress();
  container.innerHTML = "";

  // Page header
  const pageHeader = document.createElement("div");
  pageHeader.className = "text-center mb-8";
  pageHeader.innerHTML = `
    <h2 class="font-display text-gradient" style="font-size:2rem;font-weight:700;letter-spacing:0.03em;">Select Level</h2>
    <p style="color:var(--text-muted);font-size:0.8rem;margin-top:4px;letter-spacing:0.08em;">Choose a stage to play</p>
    <div style="width:48px;height:2px;background:var(--blue-400);margin:10px auto 0;border-radius:1px;opacity:0.7;"></div>
  `;
  container.appendChild(pageHeader);

  // Stats bar
  // const unlockedCount = prog.unlocked.length;
  // const statsBar = document.createElement("div");
  // statsBar.className = "glass rounded-xl flex items-center justify-center gap-8 py-3 px-6 mb-7 max-w-xs mx-auto";
  // statsBar.innerHTML = `
  //   <div class="text-center">
  //     <div class="font-display font-bold text-accent" style="font-size:1.5rem;">${unlockedCount}</div>
  //     <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;">Unlocked</div>
  //   </div>
  //   <div style="width:1px;height:28px;background:var(--border-subtle);"></div>
  //   <div class="text-center">
  //     <div class="font-display font-bold" style="font-size:1.5rem;color:var(--text-muted);">${10 - unlockedCount}</div>
  //     <div style="font-size:0.62rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;">Locked</div>
  //   </div>
  // `;
  // container.appendChild(statsBar);

  // Grid
  const levelGrid = document.createElement("div");
  levelGrid.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";
  container.appendChild(levelGrid);

  for (let i = 1; i <= 10; i++) {
    const unlocked = prog.unlocked.includes(i);
    const card = createLevelCard(i, unlocked);
    levelGrid.appendChild(card);

    if (unlocked) {
      card.addEventListener("click", () => {
        card.style.transform = "scale(0.96)";
        setTimeout(() => { window.location.hash = `level-${i}`; }, 160);
      });
    }
  }
}

function createLevelCard(i, unlocked) {
  const card = document.createElement("div");
  card.style.cssText = `
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid ${unlocked ? "var(--border-subtle)" : "var(--border-faint)"};
    transition: all 0.22s ease;
    cursor: ${unlocked ? "pointer" : "default"};
  `;

  if (unlocked) {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
      card.style.borderColor = "var(--border-strong)";
      card.style.boxShadow = "0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(37,99,235,0.12)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.borderColor = "var(--border-subtle)";
      card.style.boxShadow = "";
    });
  }

  // Thumbnail
  const thumbWrap = document.createElement("div");
  thumbWrap.style.cssText = "position:relative;width:100%;aspect-ratio:1;overflow:hidden;";

  const thumb = document.createElement("img");
  thumb.src = `/images/level${i}.png`;
  thumb.alt = `Level ${i}`;
  thumb.style.cssText = `
    width:100%;height:100%;object-fit:cover;display:block;
    transition:transform 0.35s ease,filter 0.35s ease;
    filter:${unlocked ? "brightness(0.88) saturate(1.05)" : "brightness(0.18) saturate(0)"};
  `;
  if (unlocked) {
    card.addEventListener("mouseenter", () => { thumb.style.transform = "scale(1.06)"; thumb.style.filter = "brightness(0.95) saturate(1.1)"; });
    card.addEventListener("mouseleave", () => { thumb.style.transform = ""; thumb.style.filter = "brightness(0.88) saturate(1.05)"; });
  }
  thumbWrap.appendChild(thumb);

  // Level number chip
  const chip = document.createElement("div");
  chip.style.cssText = `
    position:absolute;top:6px;left:6px;z-index:2;
    background:rgba(4,13,26,0.72);backdrop-filter:blur(6px);
    border:1px solid ${unlocked ? "rgba(37,99,235,0.4)" : "rgba(37,99,235,0.1)"};
    border-radius:5px;padding:2px 7px;
    font-family:'Space Grotesk',sans-serif;font-size:0.6rem;font-weight:700;letter-spacing:0.06em;
    color:${unlocked ? "var(--blue-200)" : "var(--text-muted)"};
  `;
  chip.textContent = `Lv.${String(i).padStart(2, "0")}`;
  thumbWrap.appendChild(chip);

  // Lock overlay
  if (!unlocked) {
    const lockOverlay = document.createElement("div");
    lockOverlay.style.cssText = `
      position:absolute;inset:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(4,13,26,0.45);
    `;
    lockOverlay.innerHTML = `
      <div style="
        width:38px;height:38px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        background:rgba(11,23,48,0.6);
        border:1px solid rgba(37,99,235,0.15);
      ">
        <i class="fas fa-lock" style="color:var(--text-muted);font-size:0.85rem;"></i>
      </div>
    `;
    thumbWrap.appendChild(lockOverlay);
  } else {
    // Hover play overlay
    const playOverlay = document.createElement("div");
    playOverlay.style.cssText = `
      position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(4,13,26,0.3);opacity:0;transition:opacity 0.25s ease;
    `;
    playOverlay.innerHTML = `
      <div style="
        width:44px;height:44px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        background:rgba(37,99,235,0.25);
        border:2px solid rgba(96,165,250,0.6);
        backdrop-filter:blur(4px);
      ">
        <i class="fas fa-play" style="color:#fff;font-size:0.9rem;margin-left:3px;"></i>
      </div>
    `;
    thumbWrap.appendChild(playOverlay);
    card.addEventListener("mouseenter", () => { playOverlay.style.opacity = "1"; });
    card.addEventListener("mouseleave", () => { playOverlay.style.opacity = "0"; });
  }

  card.appendChild(thumbWrap);

  // Card info row
  const info = document.createElement("div");
  info.style.cssText = "padding:8px 10px;display:flex;justify-content:space-between;align-items:center;";

  const name = document.createElement("span");
  name.style.cssText = `
    font-family:'Space Grotesk',sans-serif;font-size:0.72rem;font-weight:600;
    color:${unlocked ? "var(--text-primary)" : "var(--text-muted)"};
  `;
  name.textContent = `Level ${i}`;

  const badge = document.createElement("span");
  badge.style.cssText = unlocked
    ? `font-size:0.58rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
       padding:2px 6px;border-radius:4px;
       background:rgba(37,99,235,0.14);border:1px solid rgba(37,99,235,0.3);color:var(--blue-200);`
    : `font-size:0.58rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;
       padding:2px 6px;border-radius:4px;
       background:rgba(37,99,235,0.05);border:1px solid rgba(37,99,235,0.08);color:var(--text-muted);`;
  badge.textContent = unlocked ? "PLAY" : "LOCKED";

  info.appendChild(name);
  info.appendChild(badge);
  card.appendChild(info);

  return card;
}
