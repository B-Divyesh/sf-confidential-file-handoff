import { defineConfig } from 'vite';

const buildId = process.env.GITHUB_SHA?.slice(0, 7) || 'local';

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  build: {
    target: 'es2022'
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
