import { defineConfig } from 'vitest/config';

// The extension's tests run in happy-dom; the build and release scripts' in Node.
export default defineConfig({
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    projects: [
      {
        extends: true,
        test: { name: 'extension', include: ['src/**/*.test.ts'], environment: 'happy-dom' },
      },
      {
        extends: true,
        test: { name: 'scripts', include: ['scripts/**/*.test.ts'], environment: 'node' },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/**/*.ts'],
      exclude: ['**/*.test.ts', '**/fixtures/**'],
      reporter: ['text-summary', 'html', 'lcov'],
    },
  },
});
