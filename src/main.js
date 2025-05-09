import "./style.css";
import { renderLevelList } from "./levelList.js";
import { renderLevel } from "./level.js";

// Game configuration
const GAME_TITLE = "Brainrot Puzzle";
const GAME_VERSION = "1.0.0";

// Initialize app
function initializeApp() {
  // Create app structure
  const app = document.getElementById("app");
  app.innerHTML = "";

  // Create app container with proper styling
  const appContainer = document.createElement("div");
  appContainer.className =
    "min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 pb-12";
  app.appendChild(appContainer);

  // Create header
  const header = createHeader();
  appContainer.appendChild(header);

  // Create main content container
  const mainContent = document.createElement("div");
  mainContent.id = "main-content";
  mainContent.className = "container mx-auto px-4 py-6";
  appContainer.appendChild(mainContent);

  // Create footer
  const footer = createFooter();
  appContainer.appendChild(footer);

  // Route to correct view
  handleRouting(mainContent);

  // Add loading animation classes
  document.body.classList.add("transition-opacity", "duration-500");
  setTimeout(() => {
    document.body.classList.add("opacity-100");
  }, 100);

  // Return the content container for routing
  return mainContent;
}

// Create header component
function createHeader() {
  const header = document.createElement("header");
  header.className = "bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg";

  const headerContent = document.createElement("div");
  headerContent.className =
    "container mx-auto px-4 py-4 flex justify-between items-center";

  // Logo/Title area
  const logoArea = document.createElement("div");
  logoArea.className = "flex items-center";

  const logo = document.createElement("div");
  logo.className = "mr-3 text-white";
  logo.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  `;

  const title = document.createElement("h1");
  title.className = "text-xl font-bold text-white";
  title.textContent = GAME_TITLE;

  logoArea.appendChild(logo);
  logoArea.appendChild(title);

  // Navigation
  const nav = document.createElement("nav");

  const homeLink = document.createElement("a");
  homeLink.href = "#";
  homeLink.className =
    "text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md text-sm font-medium";

  const resetLink = document.createElement("button");
  resetLink.className =
    "text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md text-sm font-medium";
  resetLink.textContent = "Reset Progress";
  resetLink.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all game progress?")) {
      localStorage.removeItem("puzzle_progress");
      window.location.hash = "";
      location.reload();
    }
  });

  nav.appendChild(homeLink);
  nav.appendChild(resetLink);

  // Assemble header
  headerContent.appendChild(logoArea);
  headerContent.appendChild(nav);
  header.appendChild(headerContent);

  // Add home link functionality
  logoArea.style.cursor = "pointer";
  logoArea.addEventListener("click", () => {
    window.location.hash = "";
  });

  return header;
}

// Create footer component
function createFooter() {
  const footer = document.createElement("footer");
  footer.className = "bg-gray-800 text-gray-300 py-6 mt-auto";

  const footerContent = document.createElement("div");
  footerContent.className =
    "container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center";

  const copyright = document.createElement("div");
  copyright.className = "mb-4 sm:mb-0";
  copyright.innerHTML = `
    <p>&copy; ${new Date().getFullYear()} ${GAME_TITLE} v${GAME_VERSION}</p>
    <p class="text-xs text-gray-400 mt-1">All image rights belong to their respective owners</p>
  `;

  const links = document.createElement("div");
  links.className = "flex space-x-4";

  // Siapkan dummy links, nanti bisa kamu ubah ke URL sesungguhnya
  const icons = [
    {
      name: "GitHub",
      icon: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
      url: "#",
    },
    {
      name: "Instagram",
      icon: "M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm4.75-.75a1 1 0 110 2 1 1 0 010-2z",
      url: "#",
    },
    {
      name: "TikTok",
      icon: "M9 2a7 7 0 006.998 7H15v4a5 5 0 11-5-5V2z",
      url: "#",
    },
  ];

  icons.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.className = "text-gray-400 hover:text-white transition-colors mx-2";
    link.setAttribute("aria-label", item.name);
    link.innerHTML = `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fill-rule="evenodd" d="${item.icon}" clip-rule="evenodd" />
    </svg>
  `;
    links.appendChild(link);
  });

  footerContent.appendChild(copyright);
  footerContent.appendChild(links);
  footer.appendChild(footerContent);

  return footer;
}

// Page transition effect
function pageTransition(callback) {
  const mainContent = document.getElementById("main-content");
  mainContent.classList.add("opacity-0", "transition-opacity", "duration-300");

  setTimeout(() => {
    callback();
    setTimeout(() => {
      mainContent.classList.remove("opacity-0");
    }, 50);
  }, 300);
}

// Handle routing
function handleRouting(contentContainer) {
  const route = () => {
    const match = window.location.hash.match(/level-(\d+)/);

    pageTransition(() => {
      if (match) {
        // Render specific level
        renderLevel(Number(match[1]), contentContainer);
      } else {
        // Render level selection screen
        contentContainer.innerHTML = "";
        const lvlContainer = document.createElement("div");
        lvlContainer.className = "max-w-6xl mx-auto";
        contentContainer.appendChild(lvlContainer);
        renderLevelList(lvlContainer);
      }
    });
  };

  // Initial route
  route();

  // Listen for route changes
  window.removeEventListener("hashchange", route);
  window.addEventListener("hashchange", route);
}

// Add loading effect to body
document.body.classList.add("opacity-0");

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
