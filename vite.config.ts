import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Port forcé à 3001
    strictPort: true, // Empêche le basculement vers un autre port si 3001 est occupé
    host: true, // Permet l'accès depuis le réseau local
  },
  preview: {
    port: 3001, // Port pour la prévisualisation (npm run preview)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.SUPPRESS_ROUTER_WARNINGS': 'true'
  }
});
