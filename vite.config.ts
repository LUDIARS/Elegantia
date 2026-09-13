import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { injectedHosts } from './src/runtime/allowed-hosts.js';

const ludiarsHosts = injectedHosts(process.env.LUDIARS_ALLOWED_HOSTS);

export default defineConfig({
  root: 'web',
  plugins: [react(), tailwind()],
  server: { ...(ludiarsHosts.length > 0 ? { allowedHosts: ludiarsHosts } : {}) },
  build: { outDir: 'dist', emptyOutDir: true },
});
