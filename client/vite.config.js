import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, // Không nén để tiết kiệm RAM
    chunkSizeWarningLimit: 1000, // Tăng giới hạn file
    rollupOptions: {
      output: {
        manualChunks: undefined, // Không chia nhỏ file quá mức
      },
    },
  },
});
