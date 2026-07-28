import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this app from /musical-note-trainer/, but the dev server
  // serves it from the root — only prefix the base for production builds.
  base: command === "build" ? "/musical-note-trainer/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
  },
}));
