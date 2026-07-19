import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function siteUrlHtmlPlugin(siteUrl: string): Plugin {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return {
    name: "site-url-html",
    transformIndexHtml(html) {
      return html.replace(/%VITE_SITE_URL%/g, normalizedSiteUrl);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_SITE_URL || "";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      siteUrlHtmlPlugin(siteUrl),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
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

            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router/") ||
              id.includes("node_modules/react-router-dom/") ||
              id.includes("node_modules/scheduler/")
            ) {
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
  };
});