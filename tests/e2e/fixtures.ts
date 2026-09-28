import path from 'node:path';
import { chromium, test as base, type BrowserContext } from '@playwright/test';

// Every test runs in a fresh Chromium profile with the built extension
// (dist/chrome, from `pnpm build`) loaded, as a user would have it.

const EXTENSION = path.resolve(import.meta.dirname, '../../dist/chrome');

// Lichess serves its mobile layout to headless Chrome's default user agent.
const DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

export const test = base.extend<{ context: BrowserContext }>({
  viewport: { width: 1366, height: 768 },
  context: async ({ viewport }, use) => {
    // `channel: 'chromium'` is what loads extensions: Playwright's default
    // headless shell drops them without a word.
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      colorScheme: 'dark',
      viewport,
      userAgent: DESKTOP_CHROME,
      args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
