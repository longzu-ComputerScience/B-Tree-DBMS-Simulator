"use client";

import React, { useState } from "react";

interface OperationPanelProps {
  onAdd: (id: string, name: string, gender: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSearchById: (id: string) => Promise<void>;
  onSearchByName: (name: string) => Promise<void>;
  onSeed: () => Promise<void>;
  onReset: () => Promise<void>;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
}

export default function OperationPanel({
  onAdd,
  onDelete,
  onSearchById,
  onSearchByName,
  onSeed,
  onReset,
  loading,
  error,
  successMsg,
}: OperationPanelProps) {
  const [addId, setAddId] = useState("");
  const [addName, setAddName] = useState("");
  const [addGender, setAddGender] = useState("Male");
  const [deleteId, setDeleteId] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [activeTab, setActiveTab] = useState<"add" | "delete" | "search">("add");

  const tabs = [
    { key: "add" as const, label: "Add", icon: "＋" },
    { key: "delete" as const, label: "Delete", icon: "−" },
    { key: "search" as const, label: "Search", icon: "⌕" },
  ];


  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur overflow-hidden panel-card">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-700/80">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-slate-800/80 text-white border-b-2 border-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <span className="mr-1.5 text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* Add Student */}
        {activeTab === "add" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAdd(addId.trim(), addName.trim(), addGender);
            }}
            className="space-y-3 animate-in"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Student ID</label>
              <input
                type="text"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                placeholder="e.g. S001"
                className="w-full bg-slate-800/80 border border-slate-600/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Full Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Nguyen Van A"
                className="w-full bg-slate-800/80 border border-slate-600/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Gender</label>
              <select
                value={addGender}
                onChange={(e) => setAddGender(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-600/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200 hover:border-slate-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98]"
            >
              {loading ? "Adding..." : "Add Student"}
            </button>
          </form>
        )}

        {/* Delete Student */}
        {activeTab === "delete" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onDelete(deleteId.trim());
            }}
            className="space-y-3 animate-in"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Student ID to Delete</label>
              <input
                type="text"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                placeholder="e.g. S001"
                className="w-full bg-slate-800/80 border border-slate-600/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98]"
            >
              {loading ? "Deleting..." : "Delete Student"}
            </button>
          </form>
        )}

        {/* Search */}
        {activeTab === "search" && (
          <div className="space-y-4 animate-in">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchById(searchId.trim());
              }}
              className="space-y-2"
            >
              <label className="block text-xs text-slate-400 font-medium">Search by Student ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g. S001"
                  className="flex-1 bg-slate-800/80 border border-slate-600/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all duration-200 hover:border-slate-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-amber-500/10 active:scale-[0.98]"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="border-t border-slate-700/60" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchByName(searchName.trim());
              }}
              className="space-y-2"
            >
              <label className="block text-xs text-slate-400 font-medium">Search by Full Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. Nguyen Van A"
                  className="flex-1 bg-slate-800/80 border border-slate-600/80 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all duration-200 hover:border-slate-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-teal-500/10 active:scale-[0.98]"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5 text-sm text-red-300 animate-slide-in-top flex items-center gap-2">
            <span className="text-red-400 text-base">✕</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2.5 text-sm text-emerald-300 animate-slide-in-top flex items-center gap-2">
            <span className="text-emerald-400 text-base">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Seed / Reset */}
        <div className="border-t border-slate-700/60 pt-3 flex gap-2">
          <button
            onClick={onSeed}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-violet-600/80 to-violet-500/80 hover:from-violet-500 hover:to-violet-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 shadow-sm active:scale-[0.97]"
          >
            🎲 Load Demo
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="flex-1 bg-slate-700/60 hover:bg-slate-600/80 disabled:bg-slate-800/50 text-slate-300 font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 border border-slate-600/40 active:scale-[0.97]"
          >
            ↺ Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
