import "./style.css";
import { renderLevelList } from "./levelList.js";
import { renderLevel } from "./level.js";

const GAME_TITLE = "Brainrot Puzzle";
const GAME_VERSION = "1.0.0";

function initializeApp() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const appContainer = document.createElement("div");
  appContainer.className =
    "min-h-screen bg-gradient-to-br from-gray-500 to-gray-900 transition-all duration-500";
  app.appendChild(appContainer);

  const header = createHeader();
  appContainer.appendChild(header);

  const mainContent = document.createElement("div");
  mainContent.id = "main-content";
  mainContent.className = "container mx-auto px-4 py-6 fade-in";
  appContainer.appendChild(mainContent);

  const footer = createFooter();
  appContainer.appendChild(footer);

  handleRouting(mainContent);

  document.body.classList.add("transition-opacity", "duration-700");
  setTimeout(() => {
    document.body.classList.add("opacity-100");
  }, 100);

  return mainContent;
}

function createHeader() {
  const header = document.createElement("header");
  header.className =
    "bg-gradient-to-r from-gray-400 to-black-400 shadow-lg backdrop-blur-sm transition-all duration-300 sticky top-0 z-50";

  const headerContent = document.createElement("div");
  headerContent.className =
    "container mx-auto px-2 py-2 flex justify-between items-center";

  const logoArea = document.createElement("div");
  logoArea.className = "flex items-center group cursor-pointer";
  logoArea.addEventListener("click", () => {
    window.location.hash = "";
  });

  const logo = document.createElement("img");
  logo.className =
    "h-10 w-10 mr-3 group-hover:scale-110 transition-transform duration-300";
  logo.src = "/logo.png";
  logo.alt = GAME_TITLE;

  const title = document.createElement("h1");
  title.className = "text-2xl font-extrabold text-white tracking-wider";
  title.innerHTML = `<span class="bg-clip-text text-transparent bg-white">${GAME_TITLE}</span>`;

  logoArea.appendChild(logo);
  logoArea.appendChild(title);

  const nav = document.createElement("nav");
  nav.className = "flex space-x-3";

  const resetLink = document.createElement("button");
  resetLink.className =
    "text-black hover:text-white bg-gray-200 hover:bg-gray-400 transition-all px-4 py-2 rounded-2xl text-sm font-medium flex items-center shadow hover:shadow-lg";
  resetLink.innerHTML = `
    <i class="fa-solid fa-rotate mr-2"></i>
    Reset Progress
  `;
  resetLink.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all game progress?")) {
      localStorage.removeItem("puzzle_progress");
      window.location.hash = "";
      location.reload();
    }
  });

  nav.appendChild(resetLink);

  headerContent.appendChild(logoArea);
  headerContent.appendChild(nav);
  header.appendChild(headerContent);

  return header;
}

function createFooter() {
  const footer = document.createElement("footer");
  footer.className = "bg-gray-600 text-white py-6 mt-auto";

  const footerContent = document.createElement("div");
  footerContent.className =
    "container mx-auto px-6 flex flex-col md:flex-row justify-between items-center";

  const copyright = document.createElement("div");
  copyright.className = "mb-6 md:mb-0 text-center md:text-left";
  copyright.innerHTML = `
    <p class="text-xl font-bold bg-clip-text text-transparent bg-white">${GAME_TITLE}</p>
    <p class="text-sm text-white mt-2">Version <small><small>${GAME_VERSION}</small></small> &copy; ${new Date().getFullYear()}</p>
    <p class="text-xs text-white mt-2">All image rights belong to their respective owners</p>
  `;

  const links = document.createElement("div");
  links.className = "flex space-x-8";

  const socialLinks = [
    {
      name: "GitHub",
      icon: "fa-brands fa-github",
      url: "https://github.com/wrdnika",
    },
    {
      name: "Instagram",
      icon: "fa-brands fa-instagram",
      url: "https://www.instagram.com/wrdnika",
    },
    {
      name: "TikTok",
      icon: "fa-brands fa-tiktok",
      url: "https://www.tiktok.com/@wrdnika.dev",
    },
  ];

  socialLinks.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.className =
      "text-white hover:text-blue-200 transition-colors transform hover:scale-125 duration-300";
    link.setAttribute("aria-label", item.name);
    link.innerHTML = `
      <i class="${item.icon} text-xl"></i>
    `;
    links.appendChild(link);
  });

  footerContent.appendChild(copyright);
  footerContent.appendChild(links);
  footer.appendChild(footerContent);

  return footer;
}

function pageTransition(callback) {
  const mainContent = document.getElementById("main-content");
  mainContent.classList.add(
    "opacity-0",
    "transform",
    "scale-95",
    "transition-all",
    "duration-500"
  );

  setTimeout(() => {
    callback();
    setTimeout(() => {
      mainContent.classList.remove("opacity-0", "scale-95");
      mainContent.classList.add("scale-100");
    }, 50);
  }, 500);
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
        lvlContainer.className = "max-w-6xl mx-auto";
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
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
  document.head.appendChild(link);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadFontAwesome();
    initializeApp();
  });
} else {
  loadFontAwesome();
  initializeApp();
}
