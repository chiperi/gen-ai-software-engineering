import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend calls `/api/*`; Vite proxies to the FastAPI backend on :3000,
// stripping the `/api` prefix so no CORS setup or hardcoded host is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
