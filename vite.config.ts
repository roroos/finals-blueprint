/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content-Security-Policy of the built page: local files only. The app makes no network requests in v1.
// Not in development: Vite's hot reload needs inline scripts.
const CSP = [
  "default-src 'self' file:",
  "script-src 'self' file:",
  "style-src 'self' file: 'unsafe-inline'",
  "img-src 'self' file: data:",
  "connect-src 'self' file:",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ');

const contentSecurityPolicy = (): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  base: './',
  server: {
    // 5174, not Vite's 5173: Deadlock Blueprint's dev server uses 5173 and both can run side by side
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
