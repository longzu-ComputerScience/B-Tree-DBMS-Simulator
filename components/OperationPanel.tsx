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
    { key: "add" as const, label: "Add", icon: "+" },
    { key: "delete" as const, label: "Delete", icon: "−" },
    { key: "search" as const, label: "Search", icon: "🔍" },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-800 text-white border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
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
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1">Student ID</label>
              <input
                type="text"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                placeholder="e.g. S001"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Nguyen Van A"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gender</label>
              <select
                value={addGender}
                onChange={(e) => setAddGender(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
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
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1">Student ID to Delete</label>
              <input
                type="text"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                placeholder="e.g. S001"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {loading ? "Deleting..." : "Delete Student"}
            </button>
          </form>
        )}

        {/* Search */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchById(searchId.trim());
              }}
              className="space-y-2"
            >
              <label className="block text-xs text-slate-400">Search by Student ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g. S001"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="border-t border-slate-700" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchByName(searchName.trim());
              }}
              className="space-y-2"
            >
              <label className="block text-xs text-slate-400">Search by Full Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. Nguyen Van A"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300 animate-in fade-in">
            ✕ {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-emerald-300 animate-in fade-in">
            ✓ {successMsg}
          </div>
        )}

        {/* Seed / Reset */}
        <div className="border-t border-slate-700 pt-3 flex gap-2">
          <button
            onClick={onSeed}
            disabled={loading}
            className="flex-1 bg-violet-600/80 hover:bg-violet-500 disabled:bg-slate-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-colors"
          >
            🎲 Load Demo
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg text-xs transition-colors"
          >
            ↺ Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
