import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('favicon integration', () => {
  it('declares a base-aware svg favicon in index.html', () => {
    const html = readFileSync('index.html', 'utf8');

    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />');
  });

  it('ships a game-themed svg favicon asset', () => {
    expect(existsSync('public/favicon.svg')).toBe(true);

    const svg = readFileSync('public/favicon.svg', 'utf8');
    expect(svg).toContain('aria-label="PaperShoot favicon"');
    expect(svg).toContain('paperBall');
    expect(svg).toContain('trashBin');
    expect(svg).toContain('throwArc');
  });
});
