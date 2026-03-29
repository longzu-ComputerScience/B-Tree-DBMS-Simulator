"use client";

import React from "react";
import type { Student, SearchResult as SearchResultType } from "@/lib/types";

interface SearchResultsProps {
  result: SearchResultType | null;
}

export default function SearchResults({ result }: SearchResultsProps) {
  if (!result) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <h3 className="text-sm font-semibold text-slate-200">Search Results</h3>
      </div>
      <div className="p-4">
        <p className={`text-sm mb-3 ${result.found ? "text-emerald-400" : "text-red-400"}`}>
          {result.message}
        </p>

        {result.search_path.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs text-slate-400 font-medium mb-1">Search Path</h4>
            <div className="flex items-center gap-1 flex-wrap">
              {result.search_path.map((step, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-600 text-xs">→</span>}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
                      step.found
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    [{step.keys.join(", ")}]
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {result.found && result.students.length > 0 && (
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
                <tr key={s.student_id} className="border-t border-slate-800">
                  <td className="px-3 py-1.5 font-mono text-xs text-amber-300">{s.student_id}</td>
                  <td className="px-3 py-1.5 text-slate-200">{s.full_name}</td>
                  <td className="px-3 py-1.5 text-slate-300">{s.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
