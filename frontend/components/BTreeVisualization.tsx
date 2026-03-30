"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Position,
  MarkerType,
  Handle,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TreeNode } from "@/lib/types";

/* ─── Props ─── */

interface BTreeVisualizationProps {
  tree: TreeNode | null;
  title: string;
  treeType: "id" | "name";
  highlightKeys?: string[];
  hoveredKeys?: string[];
  recentKeys?: string[];
  searchPath?: { keys: string[]; found: boolean }[];
  accentColor?: string;
  onKeyHover?: (key: string, treeType: "id" | "name") => void;
  onKeyHoverEnd?: () => void;
  compact?: boolean;
}

/* ─── Layout ─── */

interface LayoutNode {
  id: string;
  keys: string[];
  values: (string | string[])[];
  leaf: boolean;
  x: number;
  y: number;
  width: number;
  searchVisited: boolean;
}

function buildLayout(
  treeNode: TreeNode,
  searchPathSet: Set<string>
): { nodes: LayoutNode[]; edges: { source: string; target: string }[] } {
  const layoutNodes: LayoutNode[] = [];
  const edges: { source: string; target: string }[] = [];
  let nodeCounter = 0;

  const NODE_WIDTH_PER_KEY = 100;
  const NODE_MIN_WIDTH = 88;
  const LEVEL_HEIGHT = 110;
  const H_GAP = 28;

  function getSubtreeWidth(node: TreeNode): number {
    if (node.leaf || node.children.length === 0) {
      return Math.max(NODE_MIN_WIDTH, node.keys.length * NODE_WIDTH_PER_KEY);
    }
    let totalChildWidth = 0;
    for (const child of node.children) {
      totalChildWidth += getSubtreeWidth(child);
    }
    totalChildWidth += (node.children.length - 1) * H_GAP;
    const selfWidth = Math.max(NODE_MIN_WIDTH, node.keys.length * NODE_WIDTH_PER_KEY);
    return Math.max(selfWidth, totalChildWidth);
  }

  function layout(node: TreeNode, x: number, y: number, availableWidth: number): string {
    const id = `node-${nodeCounter++}`;
    const nodeWidth = Math.max(NODE_MIN_WIDTH, node.keys.length * NODE_WIDTH_PER_KEY);
    const searchVisited = searchPathSet.has(JSON.stringify(node.keys));

    layoutNodes.push({
      id,
      keys: node.keys,
      values: node.values,
      leaf: node.leaf,
      x: x + availableWidth / 2 - nodeWidth / 2,
      y,
      width: nodeWidth,
      searchVisited,
    });

    if (!node.leaf && node.children.length > 0) {
      const childWidths = node.children.map((c) => getSubtreeWidth(c));
      const totalChildWidth = childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * H_GAP;
      let childX = x + (availableWidth - totalChildWidth) / 2;

      for (let i = 0; i < node.children.length; i++) {
        const childId = layout(node.children[i], childX, y + LEVEL_HEIGHT, childWidths[i]);
        edges.push({ source: id, target: childId });
        childX += childWidths[i] + H_GAP;
      }
    }

    return id;
  }

  const totalWidth = getSubtreeWidth(treeNode);
  layout(treeNode, 0, 0, totalWidth);

  return { nodes: layoutNodes, edges };
}

/* ─── Custom Node Component ─── */

interface BTreeNodeData {
  keys: string[];
  values: (string | string[])[];
  leaf: boolean;
  highlightKeys: string[];
  hoveredKeys: string[];
  recentKeys: string[];
  searchHitKeys: string[];
  searchVisited: boolean;
  accentColor: string;
  nodeWidth: number;
  treeType: "id" | "name";
  onKeyHover?: (key: string, treeType: "id" | "name") => void;
  onKeyHoverEnd?: () => void;
  label: string;
  [key: string]: unknown;
}

function BTreeCustomNode({ data }: NodeProps<Node<BTreeNodeData>>) {
  const {
    keys,
    highlightKeys: hlKeys,
    hoveredKeys: hvKeys,
    recentKeys: rcKeys,
    searchHitKeys: shKeys,
    searchVisited,
    accentColor,
    nodeWidth,
    treeType,
    onKeyHover,
    onKeyHoverEnd,
  } = data;

  const highlightSet = useMemo(() => new Set(hlKeys), [hlKeys]);
  const hoveredSet = useMemo(() => new Set(hvKeys), [hvKeys]);
  const recentSet = useMemo(() => new Set(rcKeys), [rcKeys]);
  const searchHitSet = useMemo(() => new Set(shKeys), [shKeys]);

  // Any key-level state active?
  const anyKeyHighlighted = keys.some((k) => highlightSet.has(k));
  const anyKeyHovered = keys.some((k) => hoveredSet.has(k));
  const anyKeySearchHit = keys.some((k) => searchHitSet.has(k));

  // Node-level border/shadow
  let borderColor = "#475569";
  let nodeShadow = "0 2px 8px rgba(0,0,0,0.3)";
  let nodeBg = "#1e293b";

  if (anyKeySearchHit || (searchVisited && anyKeySearchHit)) {
    borderColor = "#10b981";
    nodeShadow = "0 0 16px rgba(16,185,129,0.3)";
    nodeBg = "#0c3a2a";
  } else if (searchVisited) {
    borderColor = "#f59e0b";
    nodeShadow = "0 0 10px rgba(245,158,11,0.2)";
    nodeBg = "#2a1f0a";
  } else if (anyKeyHighlighted) {
    borderColor = accentColor;
    nodeShadow = `0 0 16px ${accentColor}40`;
    nodeBg = "#1a1a3e";
  } else if (anyKeyHovered) {
    borderColor = "#818cf8";
    nodeShadow = "0 0 14px rgba(99,102,241,0.3)";
    nodeBg = "#1a1a35";
  }

  return (
    <div
      className="relative cursor-default select-none"
      style={{
        background: nodeBg,
        border: `2px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "6px 6px",
        fontFamily: "'Inter', 'Geist', system-ui, sans-serif",
        minWidth: `${nodeWidth}px`,
        textAlign: "center",
        boxShadow: nodeShadow,
        transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 0, height: 0 }} />

      {/* Per-key rendering */}
      <div className="flex items-stretch justify-center">
        {keys.map((key, i) => {
          const isHL = highlightSet.has(key);
          const isHV = hoveredSet.has(key);
          const isRC = recentSet.has(key);
          const isSH = searchHitSet.has(key);

          // Per-key colors
          let keyBg = "transparent";
          let keyText = "#cbd5e1";
          let keyGlow = "none";
          let keyAnim = "";

          if (isSH) {
            keyBg = "rgba(16,185,129,0.25)";
            keyText = "#d1fae5";
            keyGlow = "0 0 10px rgba(16,185,129,0.4)";
          } else if (isHL) {
            keyBg = `${accentColor}30`;
            keyText = "#ffffff";
            keyGlow = `0 0 10px ${accentColor}50`;
            if (isRC) keyAnim = "animate-key-pulse";
          } else if (isHV) {
            keyBg = "rgba(99,102,241,0.18)";
            keyText = "#c7d2fe";
            keyGlow = "0 0 8px rgba(99,102,241,0.35)";
          } else if (searchVisited) {
            keyBg = "rgba(245,158,11,0.12)";
            keyText = "#fef3c7";
          }

          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  className="self-stretch flex items-center"
                  style={{ width: "1px", background: "#475569", opacity: 0.4, margin: "2px 0" }}
                />
              )}
              <div
                className={`relative flex items-center justify-center cursor-pointer ${keyAnim}`}
                style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  background: keyBg,
                  boxShadow: keyGlow,
                  transition: "all 0.15s ease-out",
                  flex: 1,
                  minWidth: 0,
                }}
                onMouseEnter={() => onKeyHover?.(key, treeType)}
                onMouseLeave={() => onKeyHoverEnd?.()}
              >
                <span
                  className="font-mono text-[12px] font-semibold tracking-tight whitespace-nowrap"
                  style={{ color: keyText, transition: "color 0.15s" }}
                >
                  {key}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 0, height: 0 }} />
    </div>
  );
}

const nodeTypes = {
  btreeNode: BTreeCustomNode,
};

/* ─── Main Component ─── */

export default function BTreeVisualization({
  tree,
  title,
  treeType,
  highlightKeys = [],
  hoveredKeys = [],
  recentKeys = [],
  searchPath = [],
  accentColor = "#6366f1",
  onKeyHover,
  onKeyHoverEnd,
  compact = false,
}: BTreeVisualizationProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!tree) {
      return { flowNodes: [], flowEdges: [] };
    }

    const searchPathSet = new Set(searchPath.map((p) => JSON.stringify(p.keys)));
    const searchHitKeys: string[] = [];
    for (const p of searchPath) {
      if (p.found) searchHitKeys.push(...p.keys);
    }

    const { nodes: layoutNodes, edges: layoutEdges } = buildLayout(tree, searchPathSet);

    const flowNodes: Node[] = layoutNodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      type: "btreeNode",
      data: {
        label: n.keys.join(" | ") || "(empty)",
        keys: n.keys,
        values: n.values,
        leaf: n.leaf,
        highlightKeys,
        hoveredKeys,
        recentKeys,
        searchHitKeys,
        searchVisited: n.searchVisited,
        accentColor,
        nodeWidth: n.width,
        treeType,
        onKeyHover,
        onKeyHoverEnd,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    // Pre-compute which layout nodes contain highlighted/hovered keys for edges
    const highlightSet = new Set(highlightKeys);
    const hoveredSet = new Set(hoveredKeys);

    const flowEdges: Edge[] = layoutEdges.map((e, i) => {
      const sourceNode = layoutNodes.find((n) => n.id === e.source);
      const targetNode = layoutNodes.find((n) => n.id === e.target);
      const srcHL = sourceNode?.keys.some((k) => highlightSet.has(k));
      const tgtHL = targetNode?.keys.some((k) => highlightSet.has(k));
      const srcHV = sourceNode?.keys.some((k) => hoveredSet.has(k));
      const tgtHV = targetNode?.keys.some((k) => hoveredSet.has(k));
      const srcSV = sourceNode?.searchVisited;
      const tgtSV = targetNode?.searchVisited;
      const isHighlighted = (srcHL && tgtHL) || (srcSV && tgtSV);
      const isHovered = srcHV && tgtHV;

      return {
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        style: {
          stroke: isHighlighted
            ? accentColor
            : isHovered
            ? "#818cf8"
            : "#475569",
          strokeWidth: isHighlighted || isHovered ? 2.5 : 1.5,
          opacity: isHighlighted || isHovered ? 1 : 0.6,
          transition: "all 0.2s ease-out",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? accentColor : isHovered ? "#818cf8" : "#475569",
          width: 16,
          height: 12,
        },
      };
    });

    return { flowNodes, flowEdges };
  }, [tree, highlightKeys, hoveredKeys, recentKeys, searchPath, accentColor, treeType, onKeyHover, onKeyHoverEnd]);

  const containerHeight = compact ? "h-[200px]" : "h-[320px]";

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur overflow-hidden panel-card">
      {title && (
        <div
          className="px-4 py-2.5 border-b flex items-center gap-2.5"
          style={{ borderBottomColor: accentColor + "30" }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}50` }}
          />
          <h3 className="text-sm font-semibold text-slate-200 tracking-tight">{title}</h3>
          {tree && (
            <span className="ml-auto text-[10px] text-slate-500 font-mono">
              {treeType === "id" ? "ID Index" : "Name Index"}
            </span>
          )}
        </div>
      )}
      {!tree ? (
        <div className={`${containerHeight} flex flex-col items-center justify-center text-slate-500 text-sm gap-2`}>
          <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="italic">Empty tree — no data</span>
        </div>
      ) : (
        <div className={containerHeight}>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={true}
            zoomOnScroll={true}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={2}
          />
        </div>
      )}
    </div>
  );
}
