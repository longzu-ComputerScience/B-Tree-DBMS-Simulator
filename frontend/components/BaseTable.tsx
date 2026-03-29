"use client";

import React from "react";
import type { Student } from "@/lib/types";

interface BaseTableProps {
  students: Student[];
  highlightIds?: string[];
}

export default function BaseTable({ students, highlightIds = [] }: BaseTableProps) {
  const highlightSet = new Set(highlightIds);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-200">Base Table</h3>
        <span className="ml-auto text-xs text-slate-500">{students.length} records</span>
      </div>
      {students.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-slate-500 text-sm italic">
          No records — table is empty
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-2 text-slate-400 font-medium">Student ID</th>
                <th className="text-left px-4 py-2 text-slate-400 font-medium">Full Name</th>
                <th className="text-left px-4 py-2 text-slate-400 font-medium">Gender</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.student_id}
                  className={`border-t border-slate-800 transition-colors ${
                    highlightSet.has(s.student_id)
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-xs">{s.student_id}</td>
                  <td className="px-4 py-2">{s.full_name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.gender === "Male"
                          ? "bg-blue-500/20 text-blue-300"
                          : s.gender === "Female"
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-purple-500/20 text-purple-300"
                      }`}
                    >
                      {s.gender}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
