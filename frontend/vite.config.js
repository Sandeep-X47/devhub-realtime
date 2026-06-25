import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api and the socket to the backend in dev so the frontend can use
// same-origin relative URLs and we avoid CORS headaches locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
