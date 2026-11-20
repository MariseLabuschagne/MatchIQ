import { cpSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Shown on the home screen, as in Court Order: version (major.minor, two-digit minor) and build day,
// so you can tell which deploy a phone has. package.json 3.0.0 shows as v3.00.
const [major, minor] = pkg.version.split(".");
const APP_VERSION = `${major}.${String(minor).padStart(2, "0")}`;

/** Publishes the v2 app at ./legacy/ next to v3 (softball lives there until it is redesigned). */
function legacyApp(): Plugin {
  return {
    name: "matchiq-legacy",
    apply: "build",
    closeBundle() {
      cpSync("legacy", "dist/legacy", { recursive: true });
    }
  };
}

// base "./" so the build works from any folder or sub-path (GitHub Pages, Firebase Hosting).
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  plugins: [
    react(),
    legacyApp(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["matchiq-logo.jpeg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "MatchIQ",
        short_name: "MatchIQ",
        description: "Tap-based match capture and insights for school sport.",
        start_url: ".",
        display: "standalone",
        background_color: "#020617",
        theme_color: "#020617",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpeg,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // The old app at ./legacy/ is its own site: never cache it here or answer its pages with v3.
        globIgnores: ["legacy/**"],
        navigateFallbackDenylist: [/\/legacy\//]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: { manualChunks: (id) => (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase") ? "firebase" : undefined) }
    }
  },
  test: {
    environment: "node"
  }
});
