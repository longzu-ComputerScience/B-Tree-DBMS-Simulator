"use client";

import React, { useState } from "react";
import type { OperationRecord } from "@/lib/types";
import BTreeVisualization from "./BTreeVisualization";
import BaseTable from "./BaseTable";

interface HistoryLogProps {
  history: OperationRecord[];
}

function EventBadge({ event }: { event: string }) {
  let color = "bg-slate-700 text-slate-300";
  if (event.includes("SPLIT") || event.includes("ROOT_SPLIT")) {
    color = "bg-orange-500/20 text-orange-300";
  } else if (event.includes("MERGE")) {
    color = "bg-red-500/20 text-red-300";
  } else if (event.includes("BORROW")) {
    color = "bg-blue-500/20 text-blue-300";
  } else if (event.includes("ROOT_SHRINK")) {
    color = "bg-purple-500/20 text-purple-300";
  } else if (event.includes("REPLACE")) {
    color = "bg-cyan-500/20 text-cyan-300";
  } else if (event.includes("INSERTED") || event.includes("DELETED")) {
    color = "bg-emerald-500/20 text-emerald-300";
  } else if (event.includes("BUCKET")) {
    color = "bg-amber-500/20 text-amber-300";
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${color}`}>
      {event}
    </span>
  );
}

function HistoryEntry({ record, index }: { record: OperationRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const isAdd = record.operation === "ADD";
  const opColor = isAdd ? "text-emerald-400" : "text-red-400";
  const opBg = isAdd ? "bg-emerald-500/10" : "bg-red-500/10";
  const opBorder = isAdd ? "border-emerald-500/30" : "border-red-500/30";

  return (
    <div className={`rounded-lg border ${opBorder} ${opBg} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-xs text-slate-500 font-mono w-6">#{index + 1}</span>
        <span className={`text-sm font-semibold ${opColor}`}>{record.operation}</span>
        <span className="text-xs text-slate-400 truncate flex-1">
          {isAdd
            ? `${record.input_data.student_id} — ${record.input_data.full_name}`
            : `${record.input_data.student_id}`}
        </span>
        <span className="text-xs text-slate-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
          {/* Events */}
          <div className="pt-2">
            <h4 className="text-xs text-slate-400 font-medium mb-1.5">Events</h4>
            <div className="flex flex-wrap gap-1">
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
                    isAdd
                      ? [record.input_data.student_id]
                      : []
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
                accentColor="#6366f1"
              />
            </div>
            <div>
              <h4 className="text-xs text-slate-400 font-medium mb-1.5">ID Tree — After</h4>
              <BTreeVisualization
                tree={record.after.id_tree}
                title=""
                accentColor="#6366f1"
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
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <h3 className="text-sm font-semibold text-slate-200">Operation History</h3>
        <span className="ml-auto text-xs text-slate-500">{history.length} operations</span>
      </div>
      {history.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-slate-500 text-sm italic">
          No operations yet
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
