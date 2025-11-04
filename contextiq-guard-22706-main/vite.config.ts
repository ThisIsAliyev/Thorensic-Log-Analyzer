import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/proxy/whoisxml": {
        target: "https://www.whoisxmlapi.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/whoisxml/, ""),
      },
      "/proxy/vt": {
        target: "https://www.virustotal.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/vt/, ""),
      },
      "/proxy/abuse": {
        target: "https://api.abuseipdb.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/abuse/, ""),
      },
      "/proxy/shodan": {
        target: "https://api.shodan.io",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/shodan/, ""),
      },
      "/proxy/hibp": {
        target: "https://haveibeenpwned.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/hibp/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
