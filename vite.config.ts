import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const buildId = process.env.GITHUB_SHA?.slice(0, 7) || 'local';

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        demo: resolve(import.meta.dirname, 'demo/index.html')
      }
    }
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
