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
                // Split heavy vendor libs into separately cached chunks
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['recharts'],
                    radix: [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-select',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-tooltip',
                    ],
                    query: ['@tanstack/react-query'],
                },
            },
        },
    },
  };
});