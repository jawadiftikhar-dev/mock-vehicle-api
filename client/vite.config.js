import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy the Task-1 mock API so fetch('/vehicles') and EventSource('/positions')
// work from the dev server without CORS gymnastics.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/vehicles': 'http://localhost:3000',
      '/positions': {
        target: 'http://localhost:3000',
        // SSE requires these
        changeOrigin: true,
        ws: false,
      },
    },
  },
});