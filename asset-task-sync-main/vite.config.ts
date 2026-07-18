import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("react-dom") || id.includes("react-router")) {
            return "react-vendor";
          }
          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }
          if (id.includes("@tanstack/react-query")) {
            return "query";
          }
          if (id.includes("date-fns") || id.includes("react-day-picker")) {
            return "date";
          }
          if (id.includes("axios")) {
            return "axios";
          }
        },
      },
    },
  },
}));
