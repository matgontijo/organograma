'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { THEME_LABELS } from '@/lib/theme';
import type { ThemeName } from '@/lib/types';

const THEMES: ThemeName[] = ['claro', 'escuro', 'corporativo'];

export function ThemeControls() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const accent = useAppStore((s) => s.accent);
  const setAccent = useAppStore((s) => s.setAccent);
  const presets = useAppStore((s) => s.presets);
  const savePreset = useAppStore((s) => s.savePreset);
  const applyPreset = useAppStore((s) => s.applyPreset);
  const [presetName, setPresetName] = useState('');

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Tema"
        className="rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
      >
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {THEME_LABELS[t]}
          </option>
        ))}
      </select>
      <input
        type="color"
        aria-label="Cor de destaque"
        title="Cor de destaque"
        className="h-8 w-9 cursor-pointer rounded-md border border-line bg-surface-2"
        value={accent}
        onChange={(e) => setAccent(e.target.value)}
      />
      <select
        aria-label="Aplicar preset"
        className="rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs"
        value=""
        onChange={(e) => e.target.value && applyPreset(e.target.value)}
      >
        <option value="">Presets…</option>
        {presets.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="hidden items-center gap-1 lg:flex">
        <input
          placeholder="Novo preset"
          className="w-24 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
        />
        <button
          type="button"
          className="btn-mini"
          disabled={!presetName.trim()}
          onClick={() => {
            savePreset(presetName.trim());
            setPresetName('');
          }}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
