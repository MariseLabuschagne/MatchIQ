import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base "./" so the build works from any folder or sub-path (GitHub Pages, Firebase Hosting).
export default defineConfig({
  base: "./",
  plugins: [
    react(),
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
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
