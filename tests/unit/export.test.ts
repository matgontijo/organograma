import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('html-to-image', () => ({
  toPng: vi.fn(async () => 'data:image/png;base64,AAAA'),
  toSvg: vi.fn(async () => 'data:image/svg+xml;base64,BBBB'),
}));

import { exportJson, exportPng, exportSvg } from '@/lib/export';
import { buildSeedDoc } from '@/lib/seed';

let clicked: { href: string; download: string }[] = [];

beforeEach(() => {
  clicked = [];
  // jsdom doesn't implement object URLs; stub them.
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:mock',
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: () => undefined,
    configurable: true,
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push({ href: this.href, download: this.download });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('export helpers', () => {
  it('exports JSON via a download anchor', () => {
    exportJson(buildSeedDoc(), 'x.json');
    expect(clicked).toHaveLength(1);
    expect(clicked[0]!.download).toBe('x.json');
  });

  it('exports PNG from an element', async () => {
    const el = document.createElement('div');
    await exportPng(el, 'm.png');
    expect(clicked.at(-1)!.download).toBe('m.png');
    expect(clicked.at(-1)!.href).toContain('data:image/png');
  });

  it('exports SVG from an element', async () => {
    const el = document.createElement('div');
    await exportSvg(el, 'm.svg');
    expect(clicked.at(-1)!.download).toBe('m.svg');
    expect(clicked.at(-1)!.href).toContain('data:image/svg');
  });
});
