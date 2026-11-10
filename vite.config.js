import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project at https://najf8.github.io/carbon/
// Override with VITE_BASE=/ for a custom domain / root deployment.
export default defineConfig({
  base: process.env.VITE_BASE || '/carbon/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react';
          if (id.includes('node_modules/firebase')) return 'firebase';
        },
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
