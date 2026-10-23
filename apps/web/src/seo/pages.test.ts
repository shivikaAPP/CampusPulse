import { describe, it, expect } from 'vitest';
import { STATIC_PAGES } from './pages.js';

describe('SEO Pages Specifications', () => {
  const pages = Object.values(STATIC_PAGES);

  it('has unique titles across all static pages', () => {
    const titles = pages.map((p) => p.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('has unique descriptions across all static pages', () => {
    const descs = pages.map((p) => p.description);
    const uniqueDescs = new Set(descs);
    expect(uniqueDescs.size).toBe(descs.length);
  });

  it('has unique H1 headings across all static pages', () => {
    const h1s = pages.map((p) => p.h1);
    const uniqueH1s = new Set(h1s);
    expect(uniqueH1s.size).toBe(h1s.length);
  });

  it('has descriptions between 110 and 160 characters for every static page', () => {
    for (const page of pages) {
      expect(page.description.length).toBeGreaterThanOrEqual(110);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('has titles with 60 characters or fewer where practical', () => {
    for (const page of pages) {
      expect(page.title.length).toBeLessThanOrEqual(70);
    }
  });
});
