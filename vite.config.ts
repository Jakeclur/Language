import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Relative base so the same build works on GitHub Pages (/Language/),
// any static host, or a sub-folder.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // registered manually in main.tsx (inside try/catch)
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Leer Afrikaans",
        short_name: "Leer Afrikaans",
        description: "Learn Afrikaans from English: course, exercises and a full dictionary.",
        theme_color: "#047857",
        background_color: "#fffbeb",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/audio\//,
            handler: "CacheFirst",
            options: { cacheName: "audio", expiration: { maxEntries: 5000 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "pipeline/**/*.test.mjs"],
  },
});
