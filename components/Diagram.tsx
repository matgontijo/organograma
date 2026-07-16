'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  type OnNodeDrag,
  type OnSelectionChangeParams,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { CardNode } from './nodes/CardNode';
import { LaneNode } from './nodes/LaneNode';
import { GroupNode } from './nodes/GroupNode';
import { CenterDivider } from './CenterDivider';
import { isFilteringActive, selectHighlightSet, useAppStore } from '@/lib/store';
import { computeLayout } from '@/lib/layout';
import { nodeAccent } from '@/lib/theme';
import type { OrgNodeData } from '@/lib/types';

const nodeTypes = {
  card: CardNode,
  lane: LaneNode,
  group: GroupNode,
};

export function Diagram() {
  const doc = useAppStore((s) => s.doc);
  const engine = useAppStore((s) => s.engine);
  const collapsedLanes = useAppStore((s) => s.collapsedLanes);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const traceEntityId = useAppStore((s) => s.traceEntityId);
  const search = useAppStore((s) => s.search);
  const filters = useAppStore((s) => s.filters);
  const edgeMode = useAppStore((s) => s.edgeMode);
  const viewport = useAppStore((s) => s.viewport);
  const isMobile = viewport.isMobile;

  const moveNode = useAppStore((s) => s.moveNode);
  const setSelection = useAppStore((s) => s.setSelection);
  const connectNodes = useAppStore((s) => s.connectNodes);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { highlightSet, filtering } = useMemo(() => {
    const state = useAppStore.getState();
    return {
      highlightSet: selectHighlightSet(state),
      filtering: isFilteringActive(state),
    };
    // Recompute when any constraint changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, search, filters, traceEntityId]);

  const layout = useMemo(
    () =>
      computeLayout(doc, {
        engine,
        collapsed: new Set(collapsedLanes),
        viewport,
      }),
    [doc, engine, collapsedLanes, viewport],
  );
  const laneRects = layout.lanes;
  const groupRects = layout.groups;
  const laneWidth = laneRects[0]?.width ?? 0;
  const totalHeight = laneRects.reduce((m, l) => Math.max(m, l.y + l.height), 0);

  // Build React Flow nodes (lanes behind, group boxes, cards in front).
  const builtNodes = useMemo<Node[]>(() => {
    const lanes: Node[] = laneRects.map((lane) => ({
      id: `lane-${lane.id}`,
      type: 'lane',
      position: { x: lane.x, y: lane.y },
      data: { laneId: lane.id, titulo: lane.titulo, collapsed: lane.collapsed },
      draggable: false,
      selectable: false,
      focusable: false,
      style: { width: lane.width, height: lane.height, zIndex: -1 },
      zIndex: -1,
    }));

    const groupBoxes: Node[] = groupRects.map((g) => ({
      id: `group-${g.id}`,
      type: 'group',
      position: { x: g.x, y: g.y },
      data: { label: g.label, color: g.color },
      draggable: false,
      selectable: false,
      focusable: false,
      style: { width: g.width, height: g.height, zIndex: 0 },
      zIndex: 0,
    }));

    const cards: Node[] = doc.nodes
      .filter((n) => !n.hidden)
      .map((n) => {
        const classes: string[] = [];
        if (n.id === traceEntityId) classes.push('node-trace');
        else if (filtering)
          classes.push(highlightSet.has(n.id) ? 'node-hit' : 'node-dim');
        return {
          id: n.id,
          type: 'card',
          position: n.position,
          data: n.data as unknown as Record<string, unknown>,
          selected: selectedIds.includes(n.id),
          className: classes.join(' '),
          zIndex: 1,
        };
      });

    return [...lanes, ...groupBoxes, ...cards];
  }, [
    doc.nodes,
    laneRects,
    groupRects,
    selectedIds,
    traceEntityId,
    filtering,
    highlightSet,
  ]);

  // Which nodes are "in focus" — only their connections are drawn (keeps the
  // canvas clean). Marriage edges are always shown.
  const edgeFocus = useMemo<Set<string> | null>(() => {
    if (edgeMode === 'all') return null; // null → draw every edge
    if (filtering) return highlightSet; // search / filter / trace chain
    if (selectedIds.length) return new Set(selectedIds); // a selected card
    return new Set<string>(); // nothing focused → only marriages
  }, [edgeMode, filtering, highlightSet, selectedIds]);

  // Corporate chains *inside the same group box* (RR → Autor → Ativus) are always
  // shown — they are short, clean and define the structure. Long cross-group /
  // cross-lane links (to imóveis, sociedades) only appear on focus.
  const nodeMeta = useMemo(() => {
    const m = new Map<string, { lane?: string; grupo?: string }>();
    for (const n of doc.nodes) m.set(n.id, { lane: n.data.lane, grupo: n.data.grupo });
    return m;
  }, [doc.nodes]);

  const builtEdges = useMemo<Edge[]>(() => {
    const visibleIds = new Set(doc.nodes.filter((n) => !n.hidden).map((n) => n.id));
    const isChain = (e: (typeof doc.edges)[number]) => {
      if (e.kind === 'MARRIAGE') return false;
      const s = nodeMeta.get(e.source);
      const t = nodeMeta.get(e.target);
      return Boolean(s && t && s.grupo && s.grupo === t.grupo && s.lane === t.lane);
    };
    return doc.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .filter((e) => {
        if (e.kind === 'MARRIAGE' || isChain(e)) return true;
        if (edgeFocus === null) return true;
        return edgeFocus.has(e.source) || edgeFocus.has(e.target);
      })
      .map((e) => {
        const marriage = e.kind === 'MARRIAGE';
        const chain = isChain(e);
        const focused = edgeFocus
          ? edgeFocus.has(e.source) || edgeFocus.has(e.target)
          : false;
        const stroke = focused
          ? 'rgb(var(--accent))'
          : chain
            ? 'rgb(var(--ink))'
            : 'rgb(var(--ink-muted))';
        const width = focused ? 2 : chain ? 1.5 : 1;
        const opacity = focused ? 1 : chain ? 0.75 : 0.35;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: focused ? e.label : undefined,
          type: marriage ? 'straight' : 'smoothstep',
          animated: focused && !marriage,
          style: marriage
            ? { stroke: '#0d9488', strokeDasharray: '4 4', strokeWidth: 1.5 }
            : { stroke, strokeWidth: width, opacity },
          markerEnd: marriage
            ? undefined
            : {
                type: MarkerType.ArrowClosed,
                width: focused ? 14 : 11,
                height: focused ? 14 : 11,
                color: stroke,
              },
        } satisfies Edge;
      });
  }, [doc.edges, doc.nodes, edgeFocus, nodeMeta]);

  useEffect(() => setRfNodes(builtNodes), [builtNodes, setRfNodes]);
  useEffect(() => setRfEdges(builtEdges), [builtEdges, setRfEdges]);

  // Re-fit the view when the *structure* changes (engine, collapse, viewport),
  // but not on every data edit — so editing keeps the camera stable.
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = setTimeout(
      () => fitView({ padding: isMobile ? 0.08 : 0.12, duration: 300 }),
      90,
    );
    return () => clearTimeout(t);
  }, [engine, collapsedLanes, viewport, isMobile, fitView]);

  const onNodeDragStop = useCallback<OnNodeDrag<Node>>(
    (_evt, node) => {
      if (node.type === 'lane' || node.type === 'group' || node.type === 'divider')
        return;
      moveNode(node.id, node.position);
    },
    [moveNode],
  );

  const onSelectionChange = useCallback(
    ({ nodes }: OnSelectionChangeParams) => {
      const ids = nodes
        .filter((n) => n.type !== 'lane' && n.type !== 'group' && n.type !== 'divider')
        .map((n) => n.id);
      const current = useAppStore.getState().selectedIds;
      if (ids.length !== current.length || ids.some((id) => !current.includes(id))) {
        setSelection(ids);
      }
    },
    [setSelection],
  );

  return (
    <div className="relative h-full w-full" data-testid="diagram">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onConnect={(c) => c.source && c.target && connectNodes(c.source, c.target)}
        onlyRenderVisibleElements={false}
        deleteKeyCode={null}
        multiSelectionKeyCode={['Meta', 'Shift', 'Control']}
        selectionKeyCode={'Shift'}
        minZoom={0.05}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: isMobile ? 0.08 : 0.15 }}
        panOnScroll
        zoomOnPinch
        panOnDrag
        zoomOnDoubleClick={!isMobile}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgb(var(--line))"
        />
        <Controls
          className="no-export trk-controls"
          showInteractive={false}
          position={isMobile ? 'bottom-right' : 'bottom-left'}
        />
        {!isMobile && (
          <MiniMap
            className="no-export"
            pannable
            zoomable
            nodeStrokeWidth={2}
            nodeColor={(n) =>
              n.type === 'lane'
                ? 'rgba(0,0,0,0.25)'
                : nodeAccent(n.data as unknown as OrgNodeData).color
            }
          />
        )}
      </ReactFlow>
      <CenterDivider laneWidth={laneWidth} totalHeight={totalHeight} />
    </div>
  );
}
