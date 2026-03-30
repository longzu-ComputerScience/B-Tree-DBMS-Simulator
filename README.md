# B-Tree DBMS Simulator

A full-stack web application that simulates a student-record database system with:
- A **base table** storing actual student records (source of truth)
- An **Order-3 B-Tree index** by Student ID
- An **Order-3 B-Tree index** by Full Name (with bucket support for duplicate names)
- **Per-key cross-highlighting** — hover any individual key in a tree node to highlight the related data across both trees and the base table
- **Visual change tracking** — before/after snapshots for every mutation
- **Smooth animations** for insertions (slide-in + pulse), deletions (flash-out), and hover effects

## Features

- **Add Student** — validates, rejects duplicate IDs, inserts into base table and both B-Tree indexes. New entries animate in with a per-key pulse effect.
- **Delete Student** — removes from all structures, handles bucket cleanup for duplicate names, triggers B-Tree rebalancing (borrow/merge). Deleted rows flash red before disappearing.
- **Search by Student ID** — traverses the ID B-Tree, shows search path with step-by-step traversal visualization
- **Search by Full Name** — traverses the Name B-Tree, returns all matching students
- **Per-Key Cross-Highlighting** — hover any **individual key** inside a tree node or any table row to highlight corresponding entries across all three views (both trees + table). Keys inside multi-key nodes are segmented and independently hoverable.
- **Operation History** — collapsible log with before/after snapshots and B-Tree event details (SPLIT, MERGE, BORROW, ROOT_SHRINK)
- **Demo/Reset** — one-click seed data and reset for classroom presentation
- **Vietnamese Notes** — contextual tips in Vietnamese in the sidebar for quick understanding

## Tech Stack

| Layer | Technology |
|-------|-----------:|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, React Flow |
| Backend | FastAPI, Python 3.10+, Pydantic |
| Persistence | Local JSON file (`backend/data/db_state.json`) |
| Testing | pytest (47 tests) |

## Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Run Both Together (from root)
```bash
npm run dev:all
```
This starts both backend (port 8000) and frontend (port 3000) concurrently.

### Run Tests
```bash
cd backend
python -m pytest tests/ -v
```

## B-Tree Implementation

**Order-3 B-Tree** (2-3 Tree):
- Max 2 keys per node, max 3 children
- Min 1 key for non-root nodes
- **Insertion**: Bottom-up split — insert into leaf, if overflow (3 keys) → split upward promoting the middle key
- **Deletion**: Bottom-up rebalancing — delete from leaf (replacing with predecessor if internal), then rebalance underflowing nodes via borrow-left → borrow-right → merge
- **Name Index**: Each key maps to a bucket `[student_id, ...]` for duplicate name support

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── btree.py       # B-Tree: insert, delete, search, split, borrow, merge
│   │   ├── models.py      # Pydantic schemas
│   │   ├── database.py    # Service layer with dual-index management
│   │   ├── storage.py     # JSON persistence
│   │   ├── routes.py      # FastAPI endpoints
│   │   └── main.py        # App entry point with CORS
│   ├── tests/
│   │   ├── test_btree.py  # 25 B-Tree unit tests
│   │   └── test_database.py # 22 integration tests
│   ├── data/              # JSON persistence directory (auto-created)
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Main page with state management & per-key cross-highlighting
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Dark theme styles, keyframe animations
│   ├── components/
│   │   ├── BTreeVisualization.tsx  # React Flow tree with per-key interactive nodes
│   │   ├── BaseTable.tsx          # Student records table with hover highlighting + delete flash
│   │   ├── OperationPanel.tsx     # Add/Delete/Search forms
│   │   ├── HistoryLog.tsx         # Collapsible operation history
│   │   └── SearchResults.tsx      # Search results with traversal path
│   └── lib/
│       ├── api.ts         # Backend API client
│       └── types.ts       # TypeScript type definitions
├── User Guide/
│   ├── User Guide.docx   # End-user guide (Vietnamese, Word format)
│   └── explain.md         # Technical explanation (Vietnamese)
├── scripts/
│   ├── dev-all.js         # Concurrent backend + frontend dev runner
│   └── gen_docx.py        # Script to regenerate User Guide.docx
├── package.json           # Root scripts (dev, backend:reload, dev:all)
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Current full state |
| POST | `/api/students` | Add student |
| DELETE | `/api/students/{id}` | Delete student |
| GET | `/api/students/search/by-id/{id}` | Search by ID |
| GET | `/api/students/search/by-name?name=` | Search by name |
| POST | `/api/seed` | Load demo data |
| POST | `/api/reset` | Clear everything |
| GET | `/api/history` | Operation log |

## Demo Walkthrough

1. Open the app at http://localhost:3000
2. Click **"Load Demo"** to populate with 7 Vietnamese student records
3. The base table, both B-Tree visualizations, and operation history populate
4. **Hover** any individual key inside a tree node — only that key glows, and corresponding entries highlight across all views
5. Try **adding** a student (e.g., S010, "New Student", Male) — watch the new entry slide in to the table and the key pulse in both trees
6. Watch the B-Trees update — splits are logged in history
7. Try **deleting** a student — the row flashes red before disappearing, and rebalancing events appear in history
8. **Search** by ID or Name — see the search path highlighted in yellow
9. Expand any history entry to see **before/after** table and tree snapshots
10. Click **"Reset All"** to clear everything

## Documentation

- **User Guide/User Guide.docx** — Vietnamese end-user guide with setup instructions, feature walkthrough, and glossary (real Microsoft Word document)
- **User Guide/explain.md** — Vietnamese technical deep-dive covering B-Tree algorithms, data flow, and architecture

## Test Coverage (47 Tests)

**B-Tree Unit Tests (25)**:
Insert (empty, sorted, split, sequential), Search (hit, miss, path), Delete (leaf, internal, borrow-left/right, merge, root-shrink, all-keys), Serialization, Deep copy, Invariant checks after mixed operations

**Database Integration Tests (22)**:
Add/delete CRUD, duplicate ID rejection, duplicate name buckets, consistency verification, seed/reset, history snapshots, full E2E scenario (7 adds + 3 deletes + searches + final consistency check)
