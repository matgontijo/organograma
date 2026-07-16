'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { isValidHttpUrl } from '@/lib/qa/rules';
import type { LaneId, NodeType, Owner } from '@/lib/types';

const NODE_TYPE_OPTIONS: NodeType[] = [
  'PESSOA',
  'CONJUGE',
  'EMPRESA_PATRIMONIAL',
  'EMPRESA_OPERACIONAL',
  'EMPRESA_PARTICIPACAO',
  'IMOVEL',
  'CARRO',
  'SEGURO',
];
const OWNER_OPTIONS: Owner[] = ['RAFAEL', 'TARIK', 'SOCIEDADE'];
const LANE_OPTIONS: LaneId[] = ['PESSOAS', 'EMPRESAS', 'IMOVEIS', 'CARROS', 'SEGUROS'];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs text-ink outline-none focus:border-accent';

export function Inspector({ onClose }: { onClose?: () => void }) {
  const selectedIds = useAppStore((s) => s.selectedIds);
  const doc = useAppStore((s) => s.doc);
  const update = useAppStore((s) => s.updateNodeData);
  const batch = useAppStore((s) => s.batchUpdate);
  const addSocio = useAppStore((s) => s.addSocio);
  const updateSocio = useAppStore((s) => s.updateSocio);
  const removeSocio = useAppStore((s) => s.removeSocio);
  const addLink = useAppStore((s) => s.addLink);
  const updateLink = useAppStore((s) => s.updateLink);
  const removeLink = useAppStore((s) => s.removeLink);
  const removeNodes = useAppStore((s) => s.removeNodes);
  const duplicateNode = useAppStore((s) => s.duplicateNode);

  const node = useMemo(
    () =>
      selectedIds.length === 1
        ? doc.nodes.find((n) => n.id === selectedIds[0])
        : undefined,
    [selectedIds, doc.nodes],
  );

  if (selectedIds.length === 0) {
    return (
      <Panel onClose={onClose} title="Inspetor">
        <p className="px-1 text-xs text-ink-muted">
          Selecione um card para editar. Use <kbd className="kbd">Shift</kbd> + clique
          para multi-seleção e edição em lote.
        </p>
      </Panel>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <Panel onClose={onClose} title={`Edição em lote · ${selectedIds.length} cards`}>
        <div className="space-y-3">
          <div>
            <Label>Dono (aplica a todos)</Label>
            <select
              className={inputClass}
              defaultValue=""
              onChange={(e) =>
                e.target.value && batch(selectedIds, { owner: e.target.value as Owner })
              }
            >
              <option value="">—</option>
              {OWNER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Faixa (aplica a todos)</Label>
            <select
              className={inputClass}
              defaultValue=""
              onChange={(e) =>
                e.target.value && batch(selectedIds, { lane: e.target.value as LaneId })
              }
            >
              <option value="">—</option>
              {LANE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ColorField
              label="Fundo"
              onChange={(v) => batch(selectedIds, { cor: v })}
            />
            <ColorField
              label="Borda"
              onChange={(v) => batch(selectedIds, { corBorda: v })}
            />
            <ColorField
              label="Texto"
              onChange={(v) => batch(selectedIds, { corTexto: v })}
            />
          </div>
          <button
            type="button"
            onClick={() => removeNodes(selectedIds)}
            className="w-full rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Remover {selectedIds.length} cards
          </button>
        </div>
      </Panel>
    );
  }

  if (!node) return null;
  const d = node.data;

  return (
    <Panel onClose={onClose} title="Inspetor">
      <div className="space-y-3">
        <div>
          <Label>Título</Label>
          <input
            data-testid="inspector-title"
            className={inputClass}
            value={d.titulo}
            onChange={(e) => update(node.id, { titulo: e.target.value })}
          />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <input
            className={inputClass}
            value={d.subtitulo ?? ''}
            onChange={(e) => update(node.id, { subtitulo: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Tipo</Label>
            <select
              className={inputClass}
              value={d.type}
              onChange={(e) => update(node.id, { type: e.target.value as NodeType })}
            >
              {NODE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Dono</Label>
            <select
              className={inputClass}
              value={d.owner}
              onChange={(e) => update(node.id, { owner: e.target.value as Owner })}
            >
              {OWNER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Faixa</Label>
            <select
              className={inputClass}
              value={d.lane ?? ''}
              onChange={(e) => update(node.id, { lane: e.target.value as LaneId })}
            >
              {LANE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Grupo</Label>
            <input
              className={inputClass}
              value={d.grupo ?? ''}
              onChange={(e) => update(node.id, { grupo: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Balanço / status</Label>
          <input
            className={inputClass}
            value={d.balanco ?? ''}
            onChange={(e) => update(node.id, { balanco: e.target.value })}
          />
        </div>

        {/* Sócios */}
        <section>
          <div className="mb-1 flex items-center justify-between">
            <Label>Sócios</Label>
            <button
              type="button"
              className="btn-mini"
              onClick={() => addSocio(node.id)}
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-1.5">
            {(d.socios ?? []).map((socio, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  className={`${inputClass} flex-1`}
                  value={socio.nome}
                  placeholder="Nome"
                  onChange={(e) => updateSocio(node.id, i, { nome: e.target.value })}
                />
                <input
                  className={`${inputClass} w-16`}
                  type="number"
                  step="0.01"
                  value={socio.percentual}
                  onChange={(e) =>
                    updateSocio(node.id, i, { percentual: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  aria-label="Remover sócio"
                  className="btn-mini-danger"
                  onClick={() => removeSocio(node.id, i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        <section>
          <div className="mb-1 flex items-center justify-between">
            <Label>Links</Label>
            <button
              type="button"
              data-testid="inspector-add-link"
              className="btn-mini"
              onClick={() => addLink(node.id)}
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {(d.links ?? []).map((link) => {
              const valid = isValidHttpUrl(link.url);
              return (
                <div key={link.id} className="rounded-md border border-line p-2">
                  <div className="mb-1 flex items-center gap-1">
                    <input
                      className={`${inputClass} flex-1`}
                      value={link.label}
                      placeholder="Rótulo"
                      onChange={(e) =>
                        updateLink(node.id, link.id, { label: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remover link"
                      className="btn-mini-danger"
                      onClick={() => removeLink(node.id, link.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className={`${inputClass} ${valid ? '' : 'border-red-500'}`}
                    value={link.url}
                    placeholder="https://..."
                    onChange={(e) =>
                      updateLink(node.id, link.id, { url: e.target.value })
                    }
                  />
                  {!valid && (
                    <p className="mt-0.5 text-[10px] text-red-500">
                      URL inválida (use http/https)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Notas */}
        <div>
          <Label>Notas</Label>
          <textarea
            className={`${inputClass} h-16 resize-none`}
            value={d.notas ?? ''}
            onChange={(e) => update(node.id, { notas: e.target.value })}
          />
        </div>

        {/* Cores */}
        <div className="grid grid-cols-3 gap-2">
          <ColorField
            label="Fundo"
            value={d.cor}
            onChange={(v) => update(node.id, { cor: v })}
          />
          <ColorField
            label="Borda"
            value={d.corBorda}
            onChange={(v) => update(node.id, { corBorda: v })}
          />
          <ColorField
            label="Texto"
            value={d.corTexto}
            onChange={(v) => update(node.id, { corTexto: v })}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => duplicateNode(node.id)}
          >
            Duplicar
          </button>
          <button
            type="button"
            className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            onClick={() => removeNodes([node.id])}
          >
            Remover
          </button>
        </div>
      </div>
    </Panel>
  );
}

function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {onClose && (
          <button
            type="button"
            className="btn-mini md:hidden"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        )}
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="color"
        className="h-8 w-full cursor-pointer rounded-md border border-line bg-surface-2"
        value={value ?? '#888888'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
