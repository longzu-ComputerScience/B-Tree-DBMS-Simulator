"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Position,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TreeNode } from "@/lib/types";

interface BTreeVisualizationProps {
  tree: TreeNode | null;
  title: string;
  highlightKeys?: string[];
  searchPath?: { keys: string[]; found: boolean }[];
  accentColor?: string;
}

interface LayoutNode {
  id: string;
  keys: string[];
  values: (string | string[])[];
  leaf: boolean;
  x: number;
  y: number;
  width: number;
  highlight: boolean;
  searchHit: boolean;
  searchVisited: boolean;
}

function buildLayout(
  treeNode: TreeNode,
  highlightKeys: Set<string>,
  searchPathSet: Set<string>
): { nodes: LayoutNode[]; edges: { source: string; target: string }[] } {
  const layoutNodes: LayoutNode[] = [];
  const edges: { source: string; target: string }[] = [];
  let nodeCounter = 0;

  const NODE_WIDTH_PER_KEY = 60;
  const NODE_MIN_WIDTH = 80;
  const LEVEL_HEIGHT = 100;
  const H_GAP = 20;

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
    const highlight = node.keys.some((k) => highlightKeys.has(k));
    const searchVisited = searchPathSet.has(JSON.stringify(node.keys));
    const searchHit = false; // Will be determined from search path

    layoutNodes.push({
      id,
      keys: node.keys,
      values: node.values,
      leaf: node.leaf,
      x: x + availableWidth / 2 - nodeWidth / 2,
      y,
      width: nodeWidth,
      highlight,
      searchHit,
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

export default function BTreeVisualization({
  tree,
  title,
  highlightKeys = [],
  searchPath = [],
  accentColor = "#6366f1",
}: BTreeVisualizationProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!tree) {
      return { flowNodes: [], flowEdges: [] };
    }

    const highlightSet = new Set(highlightKeys);
    const searchPathSet = new Set(searchPath.map((p) => JSON.stringify(p.keys)));

    const { nodes: layoutNodes, edges: layoutEdges } = buildLayout(tree, highlightSet, searchPathSet);

    const flowNodes: Node[] = layoutNodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: n.keys.join(" | ") || "(empty)" },
      type: "default",
      style: {
        background: n.highlight
          ? accentColor
          : n.searchVisited
          ? "#fbbf24"
          : "#1e293b",
        color: n.highlight || n.searchVisited ? "#0f172a" : "#e2e8f0",
        border: `2px solid ${n.highlight ? accentColor : n.searchVisited ? "#f59e0b" : "#475569"}`,
        borderRadius: "10px",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 600,
        fontFamily: "'Inter', system-ui, sans-serif",
        minWidth: `${n.width}px`,
        textAlign: "center" as const,
        boxShadow: n.highlight
          ? `0 0 16px ${accentColor}40`
          : "0 2px 8px rgba(0,0,0,0.3)",
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const flowEdges: Edge[] = layoutEdges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      style: { stroke: "#64748b", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
    }));

    return { flowNodes, flowEdges };
  }, [tree, highlightKeys, searchPath, accentColor]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur overflow-hidden">
      <div
        className="px-4 py-2 border-b border-slate-700 flex items-center gap-2"
        style={{ borderBottomColor: accentColor + "40" }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      {!tree ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic">
          Empty tree — no data
        </div>
      ) : (
        <div className="h-[300px]">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
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
