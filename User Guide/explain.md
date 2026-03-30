# B-Tree DBMS Simulator — Giải Thích Kỹ Thuật

## Tổng Quan

Tài liệu này giải thích chi tiết các khía cạnh kỹ thuật của ứng dụng B-Tree DBMS Simulator, bao gồm kiến trúc hệ thống, thuật toán B-Tree bậc 3, luồng dữ liệu, và trách nhiệm của từng thành phần.

---

## Mục lục

1. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
2. [B-Tree Bậc 3 (Cây 2-3)](#b-tree-bậc-3-cây-2-3)
3. [Thuật toán chèn (Insert)](#thuật-toán-chèn-insert)
4. [Thuật toán xoá (Delete)](#thuật-toán-xoá-delete)
5. [Chỉ mục Tên với Bucket trùng tên](#chỉ-mục-tên-với-bucket-trùng-tên)
6. [Luồng dữ liệu: Backend → Frontend](#luồng-dữ-liệu)
7. [Trách nhiệm các tệp Backend](#trách-nhiệm-các-tệp-backend)
8. [Kiến trúc Frontend](#kiến-trúc-frontend)
9. [Thiết kế Cross-Highlighting](#thiết-kế-cross-highlighting)

---

## Kiến Trúc Hệ Thống

Hệ thống gồm 3 tầng:

```
┌───────────────────────────────────────────────────┐
│                   Frontend                        │
│  Next.js 16 + React 19 + React Flow              │
│  ┌────────────────────────────────────────────┐   │
│  │ page.tsx (quản lý state, hover logic)      │   │
│  │ ┌──────────┬──────────┬──────────────────┐ │   │
│  │ │BaseTable │ID Tree   │Name Tree         │ │   │
│  │ │          │Viz       │Viz               │ │   │
│  │ └──────────┴──────────┴──────────────────┘ │   │
│  │ OperationPanel  │  HistoryLog              │   │
│  └────────────────────────────────────────────┘   │
│              ↕ HTTP (JSON)                        │
├───────────────────────────────────────────────────┤
│                   Backend                         │
│  FastAPI + Python                                 │
│  ┌────────────────────────────────────────────┐   │
│  │ routes.py (API endpoints)                  │   │
│  │ database.py (tầng điều phối)               │   │
│  │ ┌──────────────┬──────────────────────┐    │   │
│  │ │ ID BTree     │ Name BTree           │    │   │
│  │ │ (btree.py)   │ (btree.py)           │    │   │
│  │ └──────────────┴──────────────────────┘    │   │
│  │ storage.py (lưu trữ JSON)                 │   │
│  └────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────┤
│              Tầng Lưu Trữ                         │
│  backend/data/db_state.json                       │
└───────────────────────────────────────────────────┘
```

**Nguồn sự thật**: Từ điển `base_table` trong `database.py`. Cả hai chỉ mục B-Tree đều được đồng bộ từ bảng này.

---

## B-Tree Bậc 3 (Cây 2-3)

### Các Bất Biến (Invariants)

| Thuộc tính | Giá trị |
|------------|---------|
| Bậc (số con tối đa) | 3 |
| Số key tối đa mỗi nút | 2 (= bậc − 1) |
| Số key tối thiểu (nút không phải gốc) | 1 (= ⌈bậc/2⌉ − 1) |
| Số key tối thiểu (gốc) | 1 (hoặc 0 nếu cây rỗng) |
| Tất cả lá | Cùng độ sâu |

### Cấu trúc Nút

Mỗi `BTreeNode` chứa:
- `keys: list[str]` — Danh sách key đã sắp xếp
- `values: list[Any]` — Giá trị tương ứng (cùng chỉ mục với keys)
- `children: list[BTreeNode]` — Con trỏ tới nút con (rỗng nếu là lá)
- `leaf: bool` — Có phải nút lá hay không

Với nút nội bộ có `n` key, có đúng `n + 1` con:
- `children[0]`: chứa tất cả key nhỏ hơn `keys[0]`
- `children[i]`: chứa key nằm giữa `keys[i-1]` và `keys[i]`
- `children[n]`: chứa tất cả key lớn hơn `keys[n-1]`

---

## Thuật Toán Chèn (Insert)

Sử dụng chiến lược **tách từ dưới lên (bottom-up split)**:

### Các bước

1. **Tìm vị trí chèn**: Đi từ gốc xuống lá bằng cách so sánh key.

2. **Chèn vào lá**: Chèn cặp key-value vào đúng vị trí sắp xếp trong lá.

3. **Kiểm tra tràn**: Nếu lá có hơn `MAX_KEYS` (2) key → tràn.

4. **Tách (nếu cần)**: Tách nút tràn:
   - Nút có 3 key sau khi chèn: `[k0, k1, k2]`
   - Key giữa `k1` được **đẩy lên cha**
   - Nửa trái `[k0]` giữ nguyên ở nút cũ
   - Nửa phải `[k2]` chuyển sang nút mới
   - Nếu nút nội bộ, con cũng được phân phối tương ứng

5. **Lan truyền lên**: Cha nhận thêm 1 key. Nếu cha cũng tràn, tách tiếp.

6. **Tách gốc**: Nếu gốc tràn, tạo **gốc mới** gồm:
   - Key giữa được đẩy lên
   - Hai con: nửa trái và nửa phải của gốc cũ
   - Đây là thao tác duy nhất làm tăng chiều cao cây

### Ví dụ: Chèn S001, S002, S003, S004

```
Chèn S001:  [S001]                         (1 lá)
Chèn S002:  [S001, S002]                   (2 key = MAX, chưa tràn)
Chèn S003:  [S001, S002, S003]             (tràn! 3 key)
  → Tách:         [S002]                    (gốc mới)
                  /     \
             [S001]     [S003]              (2 lá)

Chèn S004:  [S003, S004]?                  (2 key = MAX, chưa tràn)
            → Không tách.
            Kết quả:     [S002]
                        /     \
                   [S001]     [S003, S004]
```

### Đường dẫn mã nguồn

```python
BTree.insert(key, value)
  → _insert_recursive(root, key, value, events)
    → Tìm lá, chèn vào đúng vị trí
    → Trả về; cha kiểm tra con có tràn không
    → Nếu tràn: _split_child(parent, idx, events)
  → Sau đệ quy: nếu gốc tràn, tách gốc
```

---

## Thuật Toán Xoá (Delete)

Sử dụng chiến lược **tái cân bằng từ dưới lên (bottom-up rebalancing)** với thay thế predecessor cho key nút nội bộ:

### Các bước

1. **Tìm key**: Đi từ gốc xuống để tìm key.

2. **Nếu key ở nút nội bộ**:
   - Tìm **predecessor theo thứ tự** (key lớn nhất ở cây con bên trái)
   - Thay key nội bộ bằng predecessor
   - Đệ quy xoá predecessor từ lá

3. **Nếu key ở lá**: Xoá trực tiếp.

4. **Kiểm tra thiếu key**: Nếu nút có ít hơn `MIN_KEYS` (1) key → thiếu.

5. **Tái cân bằng**: Thử theo thứ tự:
   - **Mượn trái (Borrow left)**: Nếu anh em trái có thừa key:
     - Đưa key phân cách của cha xuống nút thiếu
     - Đưa key cuối của anh em lên cha
     - Chuyển con bên phải nhất của anh em sang nút thiếu (nếu nội bộ)
   - **Mượn phải (Borrow right)**: Tương tự nhưng ngược hướng
   - **Gộp (Merge)**: Nếu không mượn được:
     - Kết hợp nút thiếu + key phân cách của cha + anh em thành 1 nút
     - Cha mất 1 key (đã dùng làm phân cách)
     - Nếu cha thiếu → tái cân bằng đệ quy

6. **Thu gọn gốc (Root shrink)**: Nếu gốc trống (0 key) sau merge và có 1 con, con đó trở thành gốc mới.

### Ví dụ Mượn Trái

```
Trước:                   [S004]
                        /       \
                  [S002]         []  ← thiếu key (0 key)
                 /      \
            [S001]    [S003]

Sau mượn:                [S002]            (key cha thay đổi)
                        /       \
                  [S001]         [S004]     (key phân cách đưa xuống)
```

### Ví dụ Gộp

```
Trước:         [S004]
               /       \
          [S002]        []  ← thiếu key

Sau gộp:    [S002, S004]    (1 nút, gốc thu gọn)
```

---

## Chỉ Mục Tên Với Bucket Trùng Tên

Cây ID B-Tree lưu `key=mã_sv, value=mã_sv` (1:1 đơn giản). Cây Tên B-Tree lưu `key=họ_tên, value=[mã_sv_1, mã_sv_2, ...]` — một **bucket**.

### Thêm SV có tên trùng

1. Tìm key tên trong cây → tìm thấy → lấy tham chiếu bucket
2. Thêm mã SV mới vào bucket hiện có
3. Không chèn key mới vào cây → cấu trúc cây không thay đổi
4. Sự kiện: `BUCKET_UPDATE: Added 'S005' to existing bucket for name 'Nguyen Van A'`

### Xoá SV có tên dùng chung

1. Tìm bucket tên trong cây
2. Xoá mã SV khỏi bucket
3. Nếu bucket vẫn còn phần tử → cây không thay đổi
4. Nếu bucket rỗng → **xoá key tên** khỏi cây → có thể kích hoạt tái cân bằng

### Ví dụ

```
Trạng thái cây Tên với 2 SV tên "Nguyen Van A":
  Key: "Nguyen Van A" → Value: ["S001", "S005"]

Xoá S005:
  Bucket: ["S001"]  → vẫn còn, cây không đổi

Xoá S001:
  Bucket: []  → rỗng! → xoá key "Nguyen Van A" khỏi cây
  → Có thể kích hoạt MERGE/BORROW nếu nút thiếu key
```

---

## Luồng Dữ Liệu

### Thêm Sinh Viên (end-to-end)

```
Frontend                    Backend
────────                    ───────
Người dùng điền form
  → api.addStudent(id, name, gender)
        → POST /api/students
              → routes.add_student()
                → db.add_student(id, name, gender)
                  1. Kiểm tra mã SV trùng trong base_table
                  2. Chụp snapshot "trước"
                  3. Chèn vào base_table dict
                  4. Chèn vào ID B-Tree (có thể SPLIT)
                  5. Chèn/cập nhật bucket trong Name B-Tree
                  6. Chụp snapshot "sau"
                  7. Tạo OperationRecord
                  8. Thêm vào history
                  → Trả về (success, message, events, record)
              → storage.save_state() (lưu xuống JSON)
              → Trả về MutationResponse (state + operation)
        ← JSON response
  ← setState(res.state)
  ← setHighlightIds, setRecentlyAddedIds
  ← UI render lại với dữ liệu mới
  ← Animation kích hoạt trên key mới
```

### Tìm Kiếm Theo ID (end-to-end)

```
Frontend                    Backend
────────                    ───────
Người dùng nhập S001
  → api.searchById("S001")
        → GET /api/students/search/by-id/S001
              → routes.search_by_id()
                → db.search_by_id("S001")
                  1. id_index.get_search_path("S001") → path
                  2. id_index.search("S001") → value
                  3. Tra base_table[value] → Student
                  → Trả về (student, path)
              → Trả về SearchResult
        ← JSON response
  ← setSearchResult(res)
  ← setHighlightIdKeys(["S001"]), setHighlightNameKeys([student.full_name])
  ← Cây ID hiển thị search path (vàng), nút tìm thấy (xanh)
  ← Dòng bảng và nút cây Tên highlight tạm thời
```

---

## Trách Nhiệm Các Tệp Backend

### `btree.py` — Cấu Trúc Dữ Liệu B-Tree

| Thành phần | Chức năng |
|------------|-----------|
| `BTreeNode` | Lưu trữ nút: keys, values, children, leaf flag |
| `BTree.search()` | Tra cứu key, trả về value hoặc None |
| `BTree.get_search_path()` | Trả về danh sách nút đã duyệt (cho visualization) |
| `BTree.insert()` | Chèn với bottom-up split, trả về event list |
| `BTree._split_child()` | Tách nút con tràn |
| `BTree.delete()` | Xoá với bottom-up rebalance, trả về event list |
| `BTree._rebalance()` | Điều phối mượn-trái → mượn-phải → gộp |
| `BTree._borrow_from_left/right()` | Xoay qua key phân cách của cha |
| `BTree._merge()` | Kết hợp hai con với key phân cách của cha |
| `BTree._get_predecessor_leaf()` | Tìm predecessor theo thứ tự cho xoá nội bộ |
| `BTree.serialize()` | Chuyển cây thành dict cho JSON |
| `BTree.deep_copy()` | Tạo bản sao độc lập cho snapshots |
| `BTree.get_all_keys()` | Duyệt in-order để kiểm tra nhất quán |

### `database.py` — Tầng Dịch Vụ

Lớp `Database` điều phối bảng gốc và cả hai chỉ mục:

| Phương thức | Chức năng |
|-------------|-----------|
| `add_student()` | Chèn vào base_table + ID index + Name index (logic bucket), ghi history |
| `delete_student()` | Xoá khỏi cả 3 cấu trúc, dọn bucket, ghi history |
| `search_by_id()` | Tìm trong ID index, trả về student + search path |
| `search_by_name()` | Tìm trong Name index, phân giải bucket thành danh sách student |
| `_snapshot()` | Chụp trạng thái tại thời điểm của cả 3 cấu trúc |
| `seed()` | Reset + chèn 7 SV mẫu |
| `reset()` | Xoá sạch tất cả |
| `check_consistency()` | Xác minh base_table ↔ ID index ↔ Name index đồng bộ |

### `models.py` — Schema Pydantic

Định nghĩa hình dạng dữ liệu trên API:
- `AddStudentRequest` — Xác thực đầu vào với field validators
- `Student` — Bản ghi sinh viên cốt lõi
- `SystemSnapshot` — Trạng thái tại thời điểm (base_table + 2 cây)
- `OperationRecord` — Snapshot trước/sau + danh sách event
- `SystemStateResponse` — State đầy đủ + history
- `MutationResponse` — Thành công/thất bại + state + operation record
- `SearchResult` — Tìm thấy/không + students + search path

### `storage.py` — Lưu Trữ JSON

Xử lý serialization/deserialization sang `backend/data/db_state.json`:
- `save_state()` — Serialize base_table, cả hai cây, và history sang JSON
- `load_state()` — Deserialize JSON ngược thành Database object khi khởi động
- Serialization cây xử lý đệ quy `BTreeNode` ↔ dict

### `routes.py` — API Endpoints

Tầng routing mỏng:
1. Xác thực đầu vào (qua Pydantic models)
2. Gọi phương thức `Database`
3. Lưu state sau mutations
4. Trả HTTP response phù hợp (409 cho trùng, 404 cho không tìm thấy)

### `main.py` — Điểm Khởi Động

- Tạo FastAPI app với lifespan handler
- Load state từ file khi khởi động
- Save state khi tắt
- Cấu hình CORS cho frontend dev server (localhost:3000)

---

## Kiến Trúc Frontend

### Quản Lý State

Toàn bộ state ứng dụng nằm trong `page.tsx` dùng React hooks:

```typescript
// Dữ liệu chính
state: SystemState | null         // State hệ thống đầy đủ từ backend
searchResult: SearchResult | null  // Kết quả tìm kiếm gần nhất

// Highlight theo thao tác (giới hạn thời gian, 3 giây)
highlightIds: string[]            // Dòng bảng cần highlight
highlightIdKeys: string[]         // Key cây ID cần highlight
highlightNameKeys: string[]       // Key cây Tên cần highlight

// Cross-highlighting (tức thì, theo chuột)
hoveredStudentIds: string[]       // Mã SV đang được hover

// Theo dõi animation (giới hạn thời gian, 2.5 giây)
recentlyAddedIds: string[]        // Mã SV vừa thêm

// Animation xoá
deletedIds: string[]              // Mã SV đang bị xoá (flash-out)
```

### Giao Tiếp Giữa Các Component

Các component giao tiếp lên trên qua callbacks và nhận dữ liệu xuống qua props:

- `BaseTable` → `onRowHover(studentId)` → page đặt `hoveredStudentIds`
- `BTreeVisualization` → `onKeyHover(key, treeType)` → page phân giải ra student IDs
- Page tính giá trị dẫn xuất:
  - `hoveredIdKeys` = `hoveredStudentIds` (trực tiếp cho cây ID)
  - `hoveredNameKeys` = tra `idToNameMap` cho mỗi ID hover (phân giải cho cây Tên)

### React Flow Custom Nodes

Component `BTreeVisualization` sử dụng custom React Flow nodes (`BTreeCustomNode`). Mỗi **key** trong nút là một vùng tương tác riêng biệt, cho phép:
- Per-key `onMouseEnter`/`onMouseLeave` → chỉ highlight key đang hover
- Nhiều trạng thái hiển thị: default, highlighted, hovered, recently-inserted, search-visited, search-hit
- Keys được phân tách bằng đường kẻ mỏng trong nút

---

## Thiết Kế Cross-Highlighting

Hệ thống cross-highlighting kết nối 3 view qua state chung `hoveredStudentIds`:

```
Hover key "S002" trong cây ID
  → onKeyHover("S002", "id") kích hoạt
  → setHoveredStudentIds(["S002"])
  → Dẫn xuất: hoveredIdKeys = ["S002"]
  → Dẫn xuất: hoveredNameKeys = [idToNameMap.get("S002")] = ["Tran Thi B"]
  → BaseTable: dòng S002 nhận .cross-highlight-row
  → Cây ID: key "S002" sáng xanh với pulse
  → Cây Tên: key "Tran Thi B" sáng xanh với pulse

Hover key "Nguyen Van A" trong cây Tên
  → onKeyHover("Nguyen Van A", "name") kích hoạt
  → Phân giải: nameToIdsMap.get("Nguyen Van A") = ["S001", "S005"]
  → setHoveredStudentIds(["S001", "S005"])
  → BaseTable: dòng S001 và S005 highlight
  → Cây ID: key S001 và S005 highlight
  → Cây Tên: key "Nguyen Van A" đã highlight do hover
```

Nguyên tắc quan trọng: mọi cross-highlighting đều được trung gian qua danh sách **mã sinh viên**:
- Key cây ID **chính là** mã SV → ánh xạ trực tiếp
- Key cây Tên là họ tên → phân giải sang mã SV qua `nameToIdsMap`
- Dòng bảng được đánh key bằng mã SV → so khớp trực tiếp

Thiết kế này hoạt động nhất quán ngay cả với tên trùng (key "Nguyen Van A" phân giải thành nhiều mã SV, tất cả đều highlight).
