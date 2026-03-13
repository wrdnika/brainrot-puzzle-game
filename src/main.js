import "./style.css";
import { renderLevelList } from "./levelList.js";
import { renderLevel } from "./level.js";

const GAME_TITLE = "Brainrot Puzzle";
const GAME_VERSION = "1.0.0";

function initializeApp() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const appContainer = document.createElement("div");
  appContainer.className = "min-h-screen flex flex-col";
  app.appendChild(appContainer);

  appContainer.appendChild(createHeader());

  const mainContent = document.createElement("div");
  mainContent.id = "main-content";
  mainContent.className = "container mx-auto px-4 py-8 fade-in flex-1";
  appContainer.appendChild(mainContent);

  appContainer.appendChild(createFooter());

  handleRouting(mainContent);

  document.body.classList.add("transition-opacity", "duration-500");
  setTimeout(() => document.body.classList.add("opacity-100"), 80);
}

function createHeader() {
  const header = document.createElement("header");
  header.className = "sticky top-0 z-50";
  header.style.cssText = `
    background: rgba(4, 13, 26, 0.85);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(37, 99, 235, 0.18);
    box-shadow: 0 2px 20px rgba(0,0,0,0.5);
  `;

  // Top accent line
  const accentLine = document.createElement("div");
  accentLine.style.cssText = `
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #1a4080 15%, #2563eb 40%, #60a5fa 50%, #2563eb 60%, #1a4080 85%, transparent 100%);
    opacity: 0.8;
  `;
  header.appendChild(accentLine);

  const inner = document.createElement("div");
  inner.className = "container mx-auto px-4 py-3 flex justify-between items-center";

  // Logo
  const logoArea = document.createElement("div");
  logoArea.className = "flex items-center gap-3 cursor-pointer";
  logoArea.addEventListener("click", () => { window.location.hash = ""; });

  const logoBox = document.createElement("div");
  logoBox.style.cssText = `
    width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
    background: rgba(37, 99, 235, 0.15);
    border: 1px solid rgba(37, 99, 235, 0.35);
    transition: all 0.2s ease;
  `;
  logoArea.addEventListener("mouseenter", () => {
    logoBox.style.background = "rgba(37, 99, 235, 0.25)";
    logoBox.style.borderColor = "rgba(59, 130, 246, 0.6)";
    logoBox.style.boxShadow = "0 0 14px rgba(37,99,235,0.3)";
  });
  logoArea.addEventListener("mouseleave", () => {
    logoBox.style.background = "rgba(37, 99, 235, 0.15)";
    logoBox.style.borderColor = "rgba(37,99,235,0.35)";
    logoBox.style.boxShadow = "none";
  });

  // const logo = document.createElement("img");
  // logo.src = "/logo.png";
  // logo.alt = GAME_TITLE;
  // logo.style.cssText = "width: 24px; height: 24px; object-fit: contain;";
  // logoBox.appendChild(logo);
  // logoArea.appendChild(logoBox);

  const titleWrap = document.createElement("div");

  const title = document.createElement("h1");
  title.className = "font-display text-gradient leading-none";
  title.style.cssText = "font-size: 1.15rem; font-weight: 700; letter-spacing: 0.03em;";
  title.textContent = GAME_TITLE;
  titleWrap.appendChild(title);

  const sub = document.createElement("div");
  sub.style.cssText = "font-size: 0.58rem; letter-spacing: 0.18em; color: var(--text-muted); text-transform: uppercase; margin-top: 1px;";
  sub.textContent = "image puzzle";
  titleWrap.appendChild(sub);

  logoArea.appendChild(titleWrap);

  // Action buttons
  const nav = document.createElement("nav");
  nav.className = "flex items-center gap-2";

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn btn-danger";
  resetBtn.innerHTML = `<i class="fa-solid fa-rotate-left"></i><span class="hidden sm:inline">Reset Progress</span>`;
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset semua progress game?")) {
      localStorage.removeItem("puzzle_progress");
      window.location.hash = "";
      location.reload();
    }
  });
  nav.appendChild(resetBtn);

  inner.appendChild(logoArea);
  inner.appendChild(nav);
  header.appendChild(inner);
  return header;
}

function createFooter() {
  const footer = document.createElement("footer");
  footer.style.cssText = `
    background: var(--blue-900);
    border-top: 1px solid var(--border-faint);
    padding: 1.25rem 0;
  `;

  const inner = document.createElement("div");
  inner.className = "container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3";

  const left = document.createElement("div");
  left.innerHTML = `
    <p class="font-display font-semibold" style="color:var(--text-primary);font-size:0.9rem;">${GAME_TITLE}</p>
    <p style="font-size:0.68rem;color:var(--text-muted);margin-top:3px;letter-spacing:0.04em;">
      v${GAME_VERSION} &copy; ${new Date().getFullYear()} &nbsp;&middot;&nbsp; All image rights belong to their respective owners
    </p>
  `;

  const socials = document.createElement("div");
  socials.className = "flex items-center gap-5";

  const links = [
    { name: "GitHub", icon: "fa-brands fa-github", url: "https://github.com/wrdnika" },
    { name: "Instagram", icon: "fa-brands fa-instagram", url: "https://www.instagram.com/wrdnika" },
    { name: "TikTok", icon: "fa-brands fa-tiktok", url: "https://www.tiktok.com/@wrdnika.dev" },
  ];

  links.forEach((item) => {
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", item.name);
    a.style.cssText = "color:var(--text-muted);font-size:1rem;transition:all 0.2s ease;";
    a.innerHTML = `<i class="${item.icon}"></i>`;
    a.addEventListener("mouseenter", () => {
      a.style.color = "var(--blue-200)";
      a.style.transform = "translateY(-2px)";
    });
    a.addEventListener("mouseleave", () => {
      a.style.color = "var(--text-muted)";
      a.style.transform = "";
    });
    socials.appendChild(a);
  });

  inner.appendChild(left);
  inner.appendChild(socials);
  footer.appendChild(inner);
  return footer;
}

function pageTransition(callback) {
  const mc = document.getElementById("main-content");
  mc.style.cssText = "opacity:0;transform:translateY(10px);transition:all 0.3s ease;";
  setTimeout(() => {
    callback();
    setTimeout(() => {
      mc.style.cssText = "opacity:1;transform:none;transition:all 0.3s ease;";
    }, 40);
  }, 300);
}

function handleRouting(contentContainer) {
  const route = () => {
    const match = window.location.hash.match(/level-(\d+)/);
    pageTransition(() => {
      if (match) {
        renderLevel(Number(match[1]), contentContainer);
      } else {
        contentContainer.innerHTML = "";
        const lvlContainer = document.createElement("div");
        lvlContainer.className = "max-w-5xl mx-auto";
        contentContainer.appendChild(lvlContainer);
        renderLevelList(lvlContainer);
      }
    });
  };

  route();
  window.removeEventListener("hashchange", route);
  window.addEventListener("hashchange", route);
}

document.body.classList.add("opacity-0");

function loadFontAwesome() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
  document.head.appendChild(link);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { loadFontAwesome(); initializeApp(); });
} else {
  loadFontAwesome();
  initializeApp();
}
