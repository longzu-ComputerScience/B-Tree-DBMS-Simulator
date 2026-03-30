"use client";

import React, { useCallback } from "react";
import type { Student } from "@/lib/types";

interface BaseTableProps {
  students: Student[];
  highlightIds?: string[];
  hoveredIds?: string[];
  recentlyAddedIds?: string[];
  deletedIds?: string[];
  onRowHover?: (studentId: string) => void;
  onRowHoverEnd?: () => void;
}

export default function BaseTable({
  students,
  highlightIds = [],
  hoveredIds = [],
  recentlyAddedIds = [],
  deletedIds = [],
  onRowHover,
  onRowHoverEnd,
}: BaseTableProps) {
  const highlightSet = new Set(highlightIds);
  const hoveredSet = new Set(hoveredIds);
  const recentSet = new Set(recentlyAddedIds);
  const deletedSet = new Set(deletedIds);

  const handleRowEnter = useCallback(
    (sid: string) => {
      onRowHover?.(sid);
    },
    [onRowHover]
  );

  const handleRowLeave = useCallback(() => {
    onRowHoverEnd?.();
  }, [onRowHoverEnd]);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur overflow-hidden panel-card">
      <div className="px-4 py-2.5 border-b border-slate-700/80 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 8px rgba(16,185,129,0.4)" }} />
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Base Table</h3>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {students.length} record{students.length !== 1 ? "s" : ""}
        </span>
      </div>
      {students.length === 0 ? (
        <div className="h-24 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
          <svg className="w-7 h-7 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="italic">No records — table is empty</span>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/90 sticky top-0 z-10">
              <tr>
                <th className="text-center px-3 py-2 text-slate-400 font-medium text-xs w-10">#</th>
                <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Student ID</th>
                <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Full Name</th>
                <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Gender</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const isHighlighted = highlightSet.has(s.student_id);
                const isHovered = hoveredSet.has(s.student_id);
                const isRecent = recentSet.has(s.student_id);
                const isDeleted = deletedSet.has(s.student_id);

                let rowClass = "border-t border-slate-800/60 transition-all duration-200 ";
                if (isDeleted) {
                  rowClass += "animate-row-delete bg-red-500/20 text-red-300 ";
                } else if (isHighlighted) {
                  rowClass += "bg-emerald-500/15 text-emerald-200 ";
                } else if (isHovered) {
                  rowClass += "cross-highlight-row text-indigo-200 ";
                } else {
                  rowClass += "hover:bg-slate-800/40 text-slate-300 ";
                }

                if (isRecent) {
                  rowClass += "animate-slide-in-row animate-flash-new ";
                }

                // Alternating subtle background
                if (!isHighlighted && !isHovered && !isDeleted) {
                  rowClass += idx % 2 === 0 ? "bg-slate-900/30 " : "bg-slate-800/10 ";
                }

                return (
                  <tr
                    key={s.student_id}
                    className={rowClass}
                    onMouseEnter={() => handleRowEnter(s.student_id)}
                    onMouseLeave={handleRowLeave}
                    style={{ cursor: "default" }}
                  >
                    <td className="text-center px-3 py-2 text-slate-500 text-xs font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                        isDeleted
                          ? "bg-red-500/20"
                          : isHighlighted
                          ? "bg-emerald-500/20"
                          : isHovered
                          ? "bg-indigo-500/20"
                          : "bg-slate-800/60"
                      }`}>
                        {s.student_id}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{s.full_name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.gender === "Male"
                            ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                            : s.gender === "Female"
                            ? "bg-pink-500/15 text-pink-300 border border-pink-500/20"
                            : "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                        }`}
                      >
                        {s.gender}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
