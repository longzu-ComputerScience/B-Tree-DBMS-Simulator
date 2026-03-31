"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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

  // Operation highlight keys (after add/search — time-limited)
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [highlightIdKeys, setHighlightIdKeys] = useState<string[]>([]);
  const [highlightNameKeys, setHighlightNameKeys] = useState<string[]>([]);

  // Search path visualization (time-limited, separate from searchResult display)
  const [activeSearchPath, setActiveSearchPath] = useState<{ keys: string[]; found: boolean }[]>([]);
  const [searchedKey, setSearchedKey] = useState<string | null>(null);
  const [searchTreeType, setSearchTreeType] = useState<"id" | "name" | null>(null);

  // Cross-highlighting hover state (instantaneous, driven by mouse)
  const [hoveredStudentIds, setHoveredStudentIds] = useState<string[]>([]);

  // Recently added IDs for animation
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);

  // Previous state for delete animation
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // ─── Derived hover keys for each tree ───

  // Build a name→IDs lookup from current state
  const nameToIdsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!state) return map;
    for (const s of state.base_table) {
      const existing = map.get(s.full_name) || [];
      existing.push(s.student_id);
      map.set(s.full_name, existing);
    }
    return map;
  }, [state]);

  // Build an ID→name lookup
  const idToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!state) return map;
    for (const s of state.base_table) {
      map.set(s.student_id, s.full_name);
    }
    return map;
  }, [state]);

  // Derive hovered keys for ID tree (student IDs being hovered)
  const hoveredIdKeys = useMemo(() => hoveredStudentIds, [hoveredStudentIds]);

  // Derive hovered keys for Name tree (names of hovered students)
  const hoveredNameKeys = useMemo(() => {
    const names = new Set<string>();
    for (const sid of hoveredStudentIds) {
      const name = idToNameMap.get(sid);
      if (name) names.add(name);
    }
    return Array.from(names);
  }, [hoveredStudentIds, idToNameMap]);

  // ─── Message auto-clear ───

  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  // ─── Fetch initial state ───

  useEffect(() => {
    api.getState().then(setState).catch((e) => setError(e.message));
  }, []);

  // ─── Highlight timer ───

  const clearHighlights = useCallback(() => {
    setTimeout(() => {
      setHighlightIds([]);
      setHighlightIdKeys([]);
      setHighlightNameKeys([]);
      setActiveSearchPath([]);
      setSearchedKey(null);
      setSearchTreeType(null);
    }, 3000);
  }, []);

  const clearRecentlyAdded = useCallback(() => {
    setTimeout(() => {
      setRecentlyAddedIds([]);
    }, 2500);
  }, []);

  // ─── Cross-highlighting callbacks (per-key, from trees) ───

  const handleKeyHover = useCallback(
    (key: string, treeType: "id" | "name") => {
      if (treeType === "id") {
        // key is a student ID
        setHoveredStudentIds([key]);
      } else {
        // key is a full name — resolve to student IDs
        const ids = nameToIdsMap.get(key) || [];
        setHoveredStudentIds(ids);
      }
    },
    [nameToIdsMap]
  );

  const handleKeyHoverEnd = useCallback(() => {
    setHoveredStudentIds([]);
  }, []);

  const handleRowHover = useCallback(
    (studentId: string) => {
      setHoveredStudentIds([studentId]);
    },
    []
  );

  const handleRowHoverEnd = useCallback(() => {
    setHoveredStudentIds([]);
  }, []);

  // ─── CRUD operations ───

  const handleAdd = useCallback(
    async (id: string, name: string, gender: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      setSearchResult(null);
      setActiveSearchPath([]);
      setSearchedKey(null);
      setSearchTreeType(null);
      try {
        const res = await api.addStudent(id, name, gender);
        setState(res.state);
        setSuccessMsg(res.message);
        setHighlightIds([id]);
        setHighlightIdKeys([id]);
        setHighlightNameKeys([name]);
        setRecentlyAddedIds([id]);
        clearHighlights();
        clearRecentlyAdded();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Add failed");
      } finally {
        setLoading(false);
      }
    },
    [clearHighlights, clearRecentlyAdded]
  );

  const handleDelete = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSearchResult(null);
    setActiveSearchPath([]);
    setSearchedKey(null);
    setSearchTreeType(null);
    try {
      // Mark the ID as deleted for animation before the state updates
      setDeletedIds([id]);
      const res = await api.deleteStudent(id);
      // Small delay so the user sees the flash-out animation
      await new Promise((r) => setTimeout(r, 400));
      setState(res.state);
      setSuccessMsg(res.message);
      setHighlightIds([]);
      setHighlightIdKeys([]);
      setHighlightNameKeys([]);
      setDeletedIds([]);
    } catch (e: unknown) {
      setDeletedIds([]);
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const res = await api.searchById(id);
        setSearchResult(res);
        setActiveSearchPath(res.search_path || []);
        setSearchedKey(id);
        setSearchTreeType("id");
        setHighlightIdKeys([id]);
        setHighlightNameKeys([]);
        if (res.found && res.students.length > 0) {
          setHighlightIds([id]);
          setHighlightNameKeys([res.students[0].full_name]);
        }
        clearHighlights();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [clearHighlights]
  );

  const handleSearchByName = useCallback(
    async (name: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const res = await api.searchByName(name);
        setSearchResult(res);
        setActiveSearchPath(res.search_path || []);
        setSearchedKey(name);
        setSearchTreeType("name");
        setHighlightNameKeys([name]);
        setHighlightIdKeys([]);
        if (res.found && res.students.length > 0) {
          const ids = res.students.map((s) => s.student_id);
          setHighlightIds(ids);
          setHighlightIdKeys(ids);
        }
        clearHighlights();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [clearHighlights]
  );

  const handleSeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearchResult(null);
    setActiveSearchPath([]);
    setSearchedKey(null);
    setSearchTreeType(null);
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
    setActiveSearchPath([]);
    setSearchedKey(null);
    setSearchTreeType(null);
    try {
      const res = await api.reset();
      setState(res);
      setSuccessMsg("All data cleared!");
      setHighlightIds([]);
      setHighlightIdKeys([]);
      setHighlightNameKeys([]);
      setRecentlyAddedIds([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
              BT
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                B-Tree DBMS Simulator
              </h1>
              <p className="text-[11px] text-slate-500 tracking-wide">
                Order-3 · Student Records · Dual Indexes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                Records:{" "}
                <span className="text-slate-300 font-semibold">
                  {state?.base_table.length ?? 0}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>
                Operations:{" "}
                <span className="text-slate-300 font-semibold">
                  {state?.history.length ?? 0}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[320px_1fr] gap-6">
          {/* Left panel — controls + notes */}
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

            {/* Vietnamese notes — fills empty bottom-left space */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-indigo-400 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-slate-400">Ghi chú</span>
              </div>
              <div className="px-4 py-3 space-y-2.5 text-[11px] leading-relaxed text-slate-500">
                <p>
                  <span className="text-indigo-400/80">●</span>{" "}
                  Di chuột vào <span className="text-slate-300">từng dòng</span> trong bảng để highlight các key tương ứng.
                </p>
                <p>
                  <span className="text-violet-400/80">●</span>{" "}
                  Cây ID và cây Tên là hai <span className="text-slate-300">chỉ mục B-Tree</span> độc lập, cùng trỏ về bảng gốc.
                </p>
                <p>
                  <span className="text-emerald-400/80">●</span>{" "}
                  Khi thêm bản ghi, nút mới sẽ <span className="text-slate-300">sáng lên</span> trong vài giây. Nếu cây bị đầy sẽ tự động <span className="text-slate-300">tách nút (split)</span>.
                </p>
                <p>
                  <span className="text-amber-400/80">●</span>{" "}
                  Khi xoá, cây sẽ tự cân bằng bằng cách <span className="text-slate-300">mượn (borrow)</span> hoặc <span className="text-slate-300">gộp (merge)</span> nút.
                </p>
                <p>
                  <span className="text-pink-400/80">●</span>{" "}
                  Tên trùng được lưu theo <span className="text-slate-300">bucket</span> — nhiều mã sinh viên cùng một key tên.
                </p>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="space-y-5">
            {/* Base Table */}
            <BaseTable
              students={state?.base_table ?? []}
              highlightIds={highlightIds}
              hoveredIds={hoveredStudentIds}
              recentlyAddedIds={recentlyAddedIds}
              deletedIds={deletedIds}
              onRowHover={handleRowHover}
              onRowHoverEnd={handleRowHoverEnd}
            />

            {/* B-Tree visualizations */}
            <div className="grid grid-cols-2 gap-5">
              <BTreeVisualization
                tree={state?.id_tree ?? null}
                title="Student ID B-Tree Index"
                treeType="id"
                highlightKeys={highlightIdKeys}
                hoveredKeys={hoveredIdKeys}
                recentKeys={recentlyAddedIds}
                searchPath={searchTreeType === "id" ? activeSearchPath : []}
                searchedKey={searchTreeType === "id" ? searchedKey : null}
                accentColor="#6366f1"
                onKeyHover={handleKeyHover}
                onKeyHoverEnd={handleKeyHoverEnd}
              />
              <BTreeVisualization
                tree={state?.name_tree ?? null}
                title="Full Name B-Tree Index"
                treeType="name"
                highlightKeys={highlightNameKeys}
                hoveredKeys={hoveredNameKeys}
                recentKeys={
                  recentlyAddedIds.length > 0
                    ? recentlyAddedIds
                        .map((id) => idToNameMap.get(id))
                        .filter((n): n is string => !!n)
                    : []
                }
                searchPath={searchTreeType === "name" ? activeSearchPath : []}
                searchedKey={searchTreeType === "name" ? searchedKey : null}
                accentColor="#8b5cf6"
                onKeyHover={handleKeyHover}
                onKeyHoverEnd={handleKeyHoverEnd}
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
