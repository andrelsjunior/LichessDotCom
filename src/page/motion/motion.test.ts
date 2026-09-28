import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/mini';
import { queryAll } from '#shared/dom.ts';
import { motion } from './index.ts';
import { rewriteRules, unreducedQuery } from './queries.ts';
import { copyStylesheets } from './sheets.ts';
// The queries and sheets as the original rewrote them.
import legacyJson from './fixtures/legacy.json' with { type: 'json' };

const legacy = z
  .object({
    queries: z.array(z.object({ query: z.string(), rewritten: z.string() })),
    sheets: z.array(
      z.object({ css: z.string(), hit: z.boolean(), rewritten: z.array(z.string()) }),
    ),
  })
  .parse(legacyJson);

describe('unreducedQuery', () => {
  it.each(legacy.queries)('rewrites "$query" as the original did', ({ query, rewritten }) => {
    expect(unreducedQuery(query)).toBe(rewritten);
  });
});

describe('motion', () => {
  it('has matchMedia answer the rewritten query', () => {
    const native = window.matchMedia.bind(window);
    const asked: string[] = [];
    window.matchMedia = query => {
      asked.push(query);
      return native(query);
    };
    motion.start();
    window.matchMedia('(min-width: 800px) and (prefers-reduced-motion: reduce)');
    window.matchMedia = native;
    expect(asked).toEqual(['(min-width: 800px) and (width < 0)']);
  });
});

describe('rewriteRules', () => {
  it.each(legacy.sheets)('rewrites $css as the original did', ({ css, hit, rewritten }) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    expect(rewriteRules(sheet.cssRules)).toBe(hit);
    expect([...sheet.cssRules].map(rule => rule.cssText)).toEqual(rewritten);
  });
});

const REDUCED = 'data:text/css,@media (prefers-reduced-motion: reduce) { a { animation: none } }';
const PLAIN = 'data:text/css,a { color: red }';

const links = (): HTMLLinkElement[] => queryAll(document, 'link', HTMLLinkElement);
const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 50));

function addLink(href: string, attrs: Record<string, string> = {}): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  for (const [name, value] of Object.entries(attrs)) link.setAttribute(name, value);
  link.href = href;
  document.head.append(link);
  return link;
}

describe('copyStylesheets', () => {
  afterEach(() => {
    for (const link of links()) link.remove();
  });

  it('loads each sheet again with CORS, and switches the original off for the rewritten copy', async () => {
    const original = addLink(REDUCED, { media: 'screen' });
    const plain = addLink(PLAIN);
    const unnamed = document.createElement('link');
    unnamed.rel = 'stylesheet';
    document.head.append(unnamed);
    copyStylesheets();
    const copy = original.nextElementSibling;
    expect(copy?.outerHTML).toBe(
      `<link rel="stylesheet" crossorigin="anonymous" media="screen" href="${REDUCED}">`,
    );
    await settle();
    expect(original.disabled).toBe(true);
    expect(copy?.isConnected).toBe(true);
    // Nothing to rewrite: the copy goes, the original stays on.
    expect(plain.disabled).not.toBe(true);
    expect(links()).toHaveLength(4);
    expect(unnamed.nextElementSibling).toBeNull();
  });

  it('follows the sheets Lichess adds and removes', async () => {
    const later = addLink(REDUCED);
    await settle();
    const copy = later.nextElementSibling;
    expect(copy?.getAttribute('crossorigin')).toBe('anonymous');
    later.remove();
    await settle();
    expect(copy?.isConnected).toBe(false);
  });

  it('drops a copy that fails to load', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = addLink('data:text/plain;base64,!!!');
    await settle();
    expect(broken.disabled).not.toBe(true);
    expect(links()).toEqual([broken]);
    warn.mockRestore();
  });
});
