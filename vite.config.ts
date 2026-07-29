import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "pdfjs-dist"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globIgnores: ["**/*.wasm", "**/ffmpeg/**"],
      },
      manifest: {
        name: "Whisk",
        short_name: "Whisk",
        description: "Personal recipe and converter app",
        theme_color: "#c96b3a",
        background_color: "#e8dfd2",
        display: "standalone",
        icons: [
          {
            src: "/assets/whiskLogoAmber.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
