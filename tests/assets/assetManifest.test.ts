import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { assetManifest } from '../../src/game/assets/assetManifest';
import { queueStageArt, resolveAssetUrl } from '../../src/game/assets/loadStageArt';

function readAttribute(tag: string, name: string): string | undefined {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const match = tag.match(new RegExp(`${escaped}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1];
}

function readStyleValue(style: string, property: string): string | undefined {
  const escaped = property.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const match = style.match(new RegExp(`${escaped}\\s*:\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim();
}

function hasZeroAlphaColor(value: string): boolean {
  const v = value.toLowerCase().replace(/\s+/g, '');

  if (v === 'transparent') {
    return true;
  }

  const rgbaMatch = v.match(/^rgba\(([^)]+)\)$/);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',');
    const alpha = Number.parseFloat(parts[3] ?? '1');
    return Number.isFinite(alpha) && alpha <= 0;
  }

  const hslaMatch = v.match(/^hsla\(([^)]+)\)$/);
  if (hslaMatch) {
    const parts = hslaMatch[1].split(',');
    const alpha = Number.parseFloat(parts[3] ?? '1');
    return Number.isFinite(alpha) && alpha <= 0;
  }

  const hex8Match = v.match(/^#([0-9a-f]{8})$/);
  if (hex8Match) {
    return hex8Match[1].slice(6, 8) === '00';
  }

  const hex4Match = v.match(/^#([0-9a-f]{4})$/);
  if (hex4Match) {
    return hex4Match[1][3] === '0';
  }

  return false;
}

function isOpaquePaint(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'none' || hasZeroAlphaColor(normalized)) {
    return false;
  }

  return true;
}

function isZeroOpacity(tag: string): boolean {
  const style = readAttribute(tag, 'style') ?? '';
  const opacityValue =
    readStyleValue(style, 'opacity') ??
    readStyleValue(style, 'fill-opacity') ??
    readAttribute(tag, 'opacity') ??
    readAttribute(tag, 'fill-opacity');

  if (!opacityValue) {
    return false;
  }

  const parsed = Number.parseFloat(opacityValue.trim());
  return Number.isFinite(parsed) && parsed <= 0;
}

function isFullCanvasRect(rectTag: string, svgText: string): boolean {
  const viewBoxMatch = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (!viewBoxMatch) {
    return false;
  }

  const parts = viewBoxMatch[1].trim().split(/\s+/).map((v) => Number.parseFloat(v));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    return false;
  }

  const [, , vbWidth, vbHeight] = parts;
  const x = Number.parseFloat(readAttribute(rectTag, 'x') ?? '0');
  const y = Number.parseFloat(readAttribute(rectTag, 'y') ?? '0');
  const width = Number.parseFloat(readAttribute(rectTag, 'width') ?? 'NaN');
  const height = Number.parseFloat(readAttribute(rectTag, 'height') ?? 'NaN');

  return x === 0 && y === 0 && width === vbWidth && height === vbHeight;
}

function hasOpaqueStyleBackground(svgText: string): boolean {
  const svgTagMatch = svgText.match(/<svg\b[^>]*>/i);
  if (svgTagMatch) {
    const style = readAttribute(svgTagMatch[0], 'style') ?? '';
    const background = readStyleValue(style, 'background') ?? readStyleValue(style, 'background-color');
    if (background && isOpaquePaint(background)) {
      return true;
    }
  }

  const styleBlocks = [...svgText.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  for (const styleBlock of styleBlocks) {
    const css = styleBlock[1];
    const backgroundMatches = [
      ...css.matchAll(/background(?:-color)?\s*:\s*([^;}{]+)/gi),
    ];
    for (const match of backgroundMatches) {
      if (isOpaquePaint(match[1])) {
        return true;
      }
    }
  }

  return false;
}

function hasDisallowedOpaqueBackground(svgText: string): boolean {
  if (hasOpaqueStyleBackground(svgText)) {
    return true;
  }

  const rectTags = [...svgText.matchAll(/<rect\b[^>]*>/gi)].map((match) => match[0]);
  for (const rectTag of rectTags) {
    if (!isFullCanvasRect(rectTag, svgText)) {
      continue;
    }

    if (isZeroOpacity(rectTag)) {
      continue;
    }

    const style = readAttribute(rectTag, 'style') ?? '';
    const fill = readAttribute(rectTag, 'fill') ?? readStyleValue(style, 'fill');
    if (isOpaquePaint(fill)) {
      return true;
    }
  }

  return false;
}

describe('assetManifest', () => {
  it('maps commercial placeholder art with stable named keys and relative paths', () => {
    expect(assetManifest.paper.idle.path).toBe('assets/papershoot/paper/paper-ball.svg');
    expect(assetManifest.bin.main.path).toBe('assets/papershoot/bin/trash-bin.svg');
    expect(assetManifest.fan.main.path).toBe('assets/papershoot/fan/desk-fan.svg');
    expect(assetManifest.props.cup.path).toBe('assets/papershoot/props/cup.svg');
    expect(assetManifest.props.pencilCup.path).toBe('assets/papershoot/props/pencil-cup.svg');

    const paths = [
      assetManifest.paper.idle.path,
      assetManifest.bin.main.path,
      assetManifest.fan.main.path,
      assetManifest.props.cup.path,
      assetManifest.props.pencilCup.path,
    ];
    expect(paths.every((path) => !path.startsWith('/'))).toBe(true);
  });

  it('resolves asset url against base url for subpath deployment', () => {
    expect(resolveAssetUrl('assets/papershoot/paper/paper-ball.svg', '/PaperShoot/')).toBe(
      '/PaperShoot/assets/papershoot/paper/paper-ball.svg',
    );
    expect(resolveAssetUrl('assets/papershoot/paper/paper-ball.svg', '/')).toBe(
      '/assets/papershoot/paper/paper-ball.svg',
    );
  });

  it('queues all commercial placeholder svg keys', () => {
    const calls: Array<{ key: string; path: string; config: { width: number; height: number } }> = [];
    const loader = {
      svg(key: string, path: string, config: { width: number; height: number }) {
        calls.push({ key, path, config });
      },
    };

    queueStageArt(loader as never, '/PaperShoot/');

    expect(calls).toEqual([
      {
        key: 'paper-ball',
        path: '/PaperShoot/assets/papershoot/paper/paper-ball.svg',
        config: { width: 128, height: 128 },
      },
      {
        key: 'trash-bin',
        path: '/PaperShoot/assets/papershoot/bin/trash-bin.svg',
        config: { width: 160, height: 160 },
      },
      {
        key: 'desk-fan',
        path: '/PaperShoot/assets/papershoot/fan/desk-fan.svg',
        config: { width: 180, height: 180 },
      },
      {
        key: 'cup',
        path: '/PaperShoot/assets/papershoot/props/cup.svg',
        config: { width: 120, height: 120 },
      },
      {
        key: 'pencil-cup',
        path: '/PaperShoot/assets/papershoot/props/pencil-cup.svg',
        config: { width: 140, height: 140 },
      },
    ]);
  });

  it('detects opaque background patterns with pragmatic heuristics', () => {
    const opaqueRectSvg = '<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#ffffff"/></svg>';
    const opaqueStyleSvg = '<svg style="background: rgb(255, 255, 255)"></svg>';
    const transparentSvg = '<svg viewBox="0 0 100 100"><rect width="20" height="20" fill="#ffffff"/></svg>';

    expect(hasDisallowedOpaqueBackground(opaqueRectSvg)).toBe(true);
    expect(hasDisallowedOpaqueBackground(opaqueStyleSvg)).toBe(true);
    expect(hasDisallowedOpaqueBackground(transparentSvg)).toBe(false);
  });

  it('keeps placeholder svgs on transparent backgrounds', () => {
    const files = [
      'public/assets/papershoot/paper/paper-ball.svg',
      'public/assets/papershoot/bin/trash-bin.svg',
      'public/assets/papershoot/fan/desk-fan.svg',
      'public/assets/papershoot/props/cup.svg',
      'public/assets/papershoot/props/pencil-cup.svg',
    ];

    for (const file of files) {
      const svg = readFileSync(file, 'utf8');
      expect(hasDisallowedOpaqueBackground(svg)).toBe(false);
    }
  });
});
