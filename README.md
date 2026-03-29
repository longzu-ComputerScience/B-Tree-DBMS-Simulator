# B-Tree DBMS Simulator

A full-stack web application that simulates a student-record database system with:
- A **base table** storing actual student records (source of truth)
- An **Order-3 B-Tree index** by Student ID
- An **Order-3 B-Tree index** by Full Name (with bucket support for duplicate names)
- **Visual change tracking** — before/after snapshots for every mutation

## Features

- **Add Student** — validates, rejects duplicate IDs, inserts into base table and both B-Tree indexes
- **Delete Student** — removes from all structures, handles bucket cleanup for duplicate names, triggers B-Tree rebalancing (borrow/merge)
- **Search by Student ID** — traverses the ID B-Tree, shows search path
- **Search by Full Name** — traverses the Name B-Tree, returns all matching students
- **Operation History** — collapsible log with before/after snapshots and B-Tree event details (SPLIT, MERGE, BORROW, ROOT_SHRINK)
- **Demo/Reset** — one-click seed data and reset for classroom presentation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, React Flow |
| Backend | FastAPI, Python, Pydantic |
| Persistence | Local JSON file |
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
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Main page with state management
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Dark theme styles
│   ├── components/
│   │   ├── BTreeVisualization.tsx  # React Flow tree rendering
│   │   ├── BaseTable.tsx          # Student records table
│   │   ├── OperationPanel.tsx     # Add/Delete/Search forms
│   │   ├── HistoryLog.tsx         # Collapsible operation history
│   │   └── SearchResults.tsx      # Search results with path
│   └── lib/
│       ├── api.ts         # Backend API client
│       └── types.ts       # TypeScript type definitions
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
4. Try **adding** a student (e.g., S010, "New Student", Male)
5. Watch the B-Trees update — splits are logged in history
6. Try **deleting** a student — observe borrow/merge events
7. **Search** by ID or Name — see the search path highlighted
8. Expand any history entry to see **before/after** table and tree snapshots
9. Click **"Reset All"** to clear everything

## Test Coverage (47 Tests)

**B-Tree Unit Tests (25)**:
Insert (empty, sorted, split, sequential), Search (hit, miss, path), Delete (leaf, internal, borrow-left/right, merge, root-shrink, all-keys), Serialization, Deep copy, Invariant checks after mixed operations

**Database Integration Tests (22)**:
Add/delete CRUD, duplicate ID rejection, duplicate name buckets, consistency verification, seed/reset, history snapshots, full E2E scenario (7 adds + 3 deletes + searches + final consistency check)
