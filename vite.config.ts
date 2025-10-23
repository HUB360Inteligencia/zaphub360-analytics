import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    // Temporarily disable componentTagger to avoid Babel TSX parsing errors during development
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "date-fns",
      "zod",
      "xlsx",
      "sonner",
      "next-themes",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
  },
}));
