"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { SystemState, SearchResult as SearchResultType } from "@/lib/types";
import OperationPanel from "@/components/OperationPanel";
import BaseTable from "@/components/BaseTable";
import BTreeVisualization from "@/components/BTreeVisualization";
import HistoryLog from "@/components/HistoryLog";
import SearchResults from "@/components/SearchResults";

export default function Home() {
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResultType | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [highlightIdKeys, setHighlightIdKeys] = useState<string[]>([]);
  const [highlightNameKeys, setHighlightNameKeys] = useState<string[]>([]);

  // Clear messages after delay
  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  // Fetch initial state
  useEffect(() => {
    api.getState().then(setState).catch((e) => setError(e.message));
  }, []);

  const clearHighlights = useCallback(() => {
    setTimeout(() => {
      setHighlightIds([]);
      setHighlightIdKeys([]);
      setHighlightNameKeys([]);
    }, 3000);
  }, []);

  const handleAdd = useCallback(async (id: string, name: string, gender: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSearchResult(null);
    try {
      const res = await api.addStudent(id, name, gender);
      setState(res.state);
      setSuccessMsg(res.message);
      setHighlightIds([id]);
      setHighlightIdKeys([id]);
      setHighlightNameKeys([name]);
      clearHighlights();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setLoading(false);
    }
  }, [clearHighlights]);

  const handleDelete = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSearchResult(null);
    try {
      const res = await api.deleteStudent(id);
      setState(res.state);
      setSuccessMsg(res.message);
      setHighlightIds([]);
      setHighlightIdKeys([]);
      setHighlightNameKeys([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.searchById(id);
      setSearchResult(res);
      setHighlightIdKeys([id]);
      setHighlightNameKeys([]);
      clearHighlights();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [clearHighlights]);

  const handleSearchByName = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.searchByName(name);
      setSearchResult(res);
      setHighlightNameKeys([name]);
      setHighlightIdKeys([]);
      clearHighlights();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [clearHighlights]);

  const handleSeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const res = await api.seed();
      setState(res);
      setSuccessMsg("Demo data loaded!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const res = await api.reset();
      setState(res);
      setSuccessMsg("All data cleared!");
      setHighlightIds([]);
      setHighlightIdKeys([]);
      setHighlightNameKeys([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              BT
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                B-Tree DBMS Simulator
              </h1>
              <p className="text-xs text-slate-500">Order-3 · Student Records · Dual Indexes</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Records: <span className="text-slate-300 font-medium">{state?.base_table.length ?? 0}</span>
            </span>
            <span>
              Operations: <span className="text-slate-300 font-medium">{state?.history.length ?? 0}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[320px_1fr] gap-6">
          {/* Left panel — controls */}
          <div className="space-y-4">
            <OperationPanel
              onAdd={handleAdd}
              onDelete={handleDelete}
              onSearchById={handleSearchById}
              onSearchByName={handleSearchByName}
              onSeed={handleSeed}
              onReset={handleReset}
              loading={loading}
              error={error}
              successMsg={successMsg}
            />
            {searchResult && <SearchResults result={searchResult} />}
          </div>

          {/* Main content area */}
          <div className="space-y-5">
            {/* Base Table */}
            <BaseTable
              students={state?.base_table ?? []}
              highlightIds={highlightIds}
            />

            {/* B-Tree visualizations */}
            <div className="grid grid-cols-2 gap-5">
              <BTreeVisualization
                tree={state?.id_tree ?? null}
                title="Student ID B-Tree Index"
                highlightKeys={highlightIdKeys}
                accentColor="#6366f1"
              />
              <BTreeVisualization
                tree={state?.name_tree ?? null}
                title="Full Name B-Tree Index"
                highlightKeys={highlightNameKeys}
                accentColor="#8b5cf6"
              />
            </div>

            {/* History */}
            <HistoryLog history={state?.history ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
