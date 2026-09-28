import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'happy-dom',
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      reporter: ['text-summary', 'html', 'lcov'],
    },
  },
});
