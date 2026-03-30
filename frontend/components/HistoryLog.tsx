"use client";

import React, { useState } from "react";
import type { OperationRecord } from "@/lib/types";
import BTreeVisualization from "./BTreeVisualization";
import BaseTable from "./BaseTable";

interface HistoryLogProps {
  history: OperationRecord[];
}

function EventBadge({ event }: { event: string }) {
  let color = "bg-slate-700/60 text-slate-300 border-slate-600/40";
  if (event.includes("SPLIT") || event.includes("ROOT_SPLIT")) {
    color = "bg-orange-500/15 text-orange-300 border-orange-500/25";
  } else if (event.includes("MERGE")) {
    color = "bg-red-500/15 text-red-300 border-red-500/25";
  } else if (event.includes("BORROW")) {
    color = "bg-blue-500/15 text-blue-300 border-blue-500/25";
  } else if (event.includes("ROOT_SHRINK")) {
    color = "bg-purple-500/15 text-purple-300 border-purple-500/25";
  } else if (event.includes("REPLACE")) {
    color = "bg-cyan-500/15 text-cyan-300 border-cyan-500/25";
  } else if (event.includes("INSERTED") || event.includes("DELETED")) {
    color = "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
  } else if (event.includes("BUCKET")) {
    color = "bg-amber-500/15 text-amber-300 border-amber-500/25";
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-mono border ${color}`}>
      {event}
    </span>
  );
}

function HistoryEntry({ record, index }: { record: OperationRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const isAdd = record.operation === "ADD";
  const opColor = isAdd ? "text-emerald-400" : "text-red-400";
  const opBg = isAdd ? "bg-emerald-500/5" : "bg-red-500/5";
  const opBorder = isAdd ? "border-emerald-500/20" : "border-red-500/20";
  const opIcon = isAdd ? "＋" : "−";

  return (
    <div className={`rounded-lg border ${opBorder} ${opBg} overflow-hidden transition-all duration-200`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors group"
      >
        <span className="text-xs text-slate-500 font-mono w-7 text-right">#{index + 1}</span>
        <span className={`text-xs font-bold ${opColor} flex items-center gap-1`}>
          <span className="text-base leading-none">{opIcon}</span>
          {record.operation}
        </span>
        <span className="text-xs text-slate-400 truncate flex-1">
          {isAdd
            ? `${record.input_data.student_id} — ${record.input_data.full_name}`
            : `${record.input_data.student_id}`}
        </span>
        {record.events.some(e => e.includes("SPLIT") || e.includes("MERGE") || e.includes("BORROW") || e.includes("ROOT_SHRINK")) && (
          <span className="text-[9px] text-amber-400/70 font-medium uppercase tracking-wider">rebalance</span>
        )}
        <span className={`text-xs text-slate-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/30 animate-expand">
          {/* Events */}
          <div className="pt-2.5">
            <h4 className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Events
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {record.events.map((e, i) => (
                <EventBadge key={i} event={e} />
              ))}
            </div>
          </div>

          {/* Before / After comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs text-slate-400 font-medium mb-1.5">
                Before ({record.before.base_table.length} records)
              </h4>
              <div className="text-xs">
                <BaseTable students={record.before.base_table} />
              </div>
            </div>
            <div>
              <h4 className="text-xs text-slate-400 font-medium mb-1.5">
                After ({record.after.base_table.length} records)
              </h4>
              <div className="text-xs">
                <BaseTable
                  students={record.after.base_table}
                  highlightIds={
                    isAdd ? [record.input_data.student_id] : []
                  }
                />
              </div>
            </div>
          </div>

          {/* Tree diffs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs text-slate-400 font-medium mb-1.5">ID Tree — Before</h4>
              <BTreeVisualization
                tree={record.before.id_tree}
                title=""
                treeType="id"
                accentColor="#6366f1"
                compact
              />
            </div>
            <div>
              <h4 className="text-xs text-slate-400 font-medium mb-1.5">ID Tree — After</h4>
              <BTreeVisualization
                tree={record.after.id_tree}
                title=""
                treeType="id"
                accentColor="#6366f1"
                highlightKeys={isAdd ? [record.input_data.student_id] : []}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryLog({ history }: HistoryLogProps) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur overflow-hidden panel-card">
      <div className="px-4 py-2.5 border-b border-slate-700/80 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" style={{ boxShadow: "0 0 8px rgba(245,158,11,0.4)" }} />
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Operation History</h3>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {history.length} operation{history.length !== 1 ? "s" : ""}
        </span>
      </div>
      {history.length === 0 ? (
        <div className="h-24 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
          <svg className="w-7 h-7 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="italic">No operations yet</span>
        </div>
      ) : (
        <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
          {[...history].reverse().map((record, i) => (
            <HistoryEntry key={history.length - 1 - i} record={record} index={history.length - 1 - i} />
          ))}
        </div>
      )}
    </div>
  );
}
