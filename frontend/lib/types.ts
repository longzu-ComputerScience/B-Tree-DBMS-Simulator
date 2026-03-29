/* TypeScript types matching the backend Pydantic models */

export interface Student {
  student_id: string;
  full_name: string;
  gender: string;
}

export interface TreeNode {
  keys: string[];
  values: (string | string[])[];
  leaf: boolean;
  children: TreeNode[];
}

export interface SystemSnapshot {
  base_table: Student[];
  id_tree: TreeNode | null;
  name_tree: TreeNode | null;
}

export interface OperationRecord {
  operation: "ADD" | "DELETE";
  input_data: Record<string, string>;
  before: SystemSnapshot;
  after: SystemSnapshot;
  events: string[];
}

export interface SystemState {
  base_table: Student[];
  id_tree: TreeNode | null;
  name_tree: TreeNode | null;
  history: OperationRecord[];
}

export interface MutationResponse {
  success: boolean;
  message: string;
  state: SystemState;
  operation: OperationRecord | null;
}

export interface SearchResult {
  found: boolean;
  students: Student[];
  search_path: { keys: string[]; found: boolean }[];
  message: string;
}
