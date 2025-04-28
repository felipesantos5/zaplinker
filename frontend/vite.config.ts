import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    global: {},
  },
  resolve: {
    alias: {
      crypto: "crypto-browserify",
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
