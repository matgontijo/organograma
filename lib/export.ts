/** PNG / SVG / JSON export helpers (browser only). */
import { toPng, toSvg } from 'html-to-image';
import type { PatrimonioDoc } from './types';
import { serializeDoc } from './serialize';

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const FILTER_CLASSES = ['react-flow__minimap', 'react-flow__controls', 'no-export'];

function shouldInclude(node: HTMLElement): boolean {
  if (!(node instanceof HTMLElement)) return true;
  return !FILTER_CLASSES.some((c) => node.classList?.contains(c));
}

const exportOptions = {
  cacheBust: true,
  pixelRatio: 2,
  filter: shouldInclude,
  backgroundColor: 'transparent',
};

export interface ExportTransform {
  width: number;
  height: number;
  style: Record<string, string>;
  pixelRatio: number;
}

/** Export the given element (the React Flow viewport) as a high-res PNG. */
export async function exportPng(
  element: HTMLElement,
  filename = 'mapa-trk.png',
  extra: Partial<ExportTransform> = {},
): Promise<void> {
  const dataUrl = await toPng(element, { ...exportOptions, pixelRatio: 2, ...extra });
  triggerDownload(dataUrl, filename);
}

/** Export the given element as SVG. */
export async function exportSvg(
  element: HTMLElement,
  filename = 'mapa-trk.svg',
  extra: Partial<ExportTransform> = {},
): Promise<void> {
  const dataUrl = await toSvg(element, { ...exportOptions, ...extra });
  triggerDownload(dataUrl, filename);
}

/** Export the document model as a JSON file. */
export function exportJson(doc: PatrimonioDoc, filename = 'mapa-trk.json'): void {
  const blob = new Blob([serializeDoc(doc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
