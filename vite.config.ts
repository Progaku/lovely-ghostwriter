/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    server: {
      deps: {
        inline: [
          '@mui/material',
          '@mui/icons-material',
          'react-transition-group',
        ],
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
