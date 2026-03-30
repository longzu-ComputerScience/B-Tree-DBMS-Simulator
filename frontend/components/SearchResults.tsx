"use client";

import React from "react";
import type { SearchResult as SearchResultType } from "@/lib/types";

interface SearchResultsProps {
  result: SearchResultType | null;
}

export default function SearchResults({ result }: SearchResultsProps) {
  if (!result) return null;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur overflow-hidden animate-slide-in-top panel-card">
      <div className="px-4 py-2.5 border-b border-slate-700/80 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" style={{ boxShadow: "0 0 8px rgba(245,158,11,0.4)" }} />
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Search Results</h3>
      </div>
      <div className="p-4">
        <p className={`text-sm mb-3 flex items-center gap-2 ${result.found ? "text-emerald-400" : "text-red-400"}`}>
          <span className="text-base">{result.found ? "✓" : "✕"}</span>
          {result.message}
        </p>

        {result.search_path.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Traversal Path
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              {result.search_path.map((step, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-600 text-xs">→</span>}
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-300 ${
                      step.found
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                        : "bg-slate-700/60 text-slate-300 border border-slate-600/40"
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    [{step.keys.join(", ")}]
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {result.found && result.students.length > 0 && (
          <div className="rounded-lg border border-slate-700/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="text-left px-3 py-1.5 text-slate-400 font-medium text-xs">ID</th>
                  <th className="text-left px-3 py-1.5 text-slate-400 font-medium text-xs">Name</th>
                  <th className="text-left px-3 py-1.5 text-slate-400 font-medium text-xs">Gender</th>
                </tr>
              </thead>
              <tbody>
                {result.students.map((s) => (
                  <tr key={s.student_id} className="border-t border-slate-800/60">
                    <td className="px-3 py-1.5 font-mono text-xs text-amber-300">{s.student_id}</td>
                    <td className="px-3 py-1.5 text-slate-200">{s.full_name}</td>
                    <td className="px-3 py-1.5 text-slate-300">{s.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
