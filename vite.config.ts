// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"]
        }
      }
    }
  }
});
