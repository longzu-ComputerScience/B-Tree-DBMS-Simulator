/* API client for the FastAPI backend */

import type { SystemState, MutationResponse, SearchResult } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "" // In production without a configured backend URL, API calls will fail gracefully
    : "http://localhost:8000/api");

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      "Backend not available. This deployment is frontend-only. Please run the project locally with: npm run dev:all"
    );
  }
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getState: () => fetchJSON<SystemState>(`${API_BASE}/state`),

  addStudent: (student_id: string, full_name: string, gender: string) =>
    fetchJSON<MutationResponse>(`${API_BASE}/students`, {
      method: "POST",
      body: JSON.stringify({ student_id, full_name, gender }),
    }),

  deleteStudent: (student_id: string) =>
    fetchJSON<MutationResponse>(`${API_BASE}/students/${encodeURIComponent(student_id)}`, {
      method: "DELETE",
    }),

  searchById: (student_id: string) =>
    fetchJSON<SearchResult>(
      `${API_BASE}/students/search/by-id/${encodeURIComponent(student_id)}`
    ),

  searchByName: (name: string) =>
    fetchJSON<SearchResult>(
      `${API_BASE}/students/search/by-name?name=${encodeURIComponent(name)}`
    ),

  seed: () => fetchJSON<SystemState>(`${API_BASE}/seed`, { method: "POST" }),

  reset: () => fetchJSON<SystemState>(`${API_BASE}/reset`, { method: "POST" }),
};
