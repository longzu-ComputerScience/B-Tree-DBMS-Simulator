"""Generate User Guide/User Guide.docx — a professional Vietnamese Word document."""

import os
from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "User Guide")
OUT_FILE = os.path.join(OUT_DIR, "User Guide.docx")

os.makedirs(OUT_DIR, exist_ok=True)

doc = Document()

# ── Style setup ──
style = doc.styles["Normal"]
font = style.font
font.name = "Calibri"
font.size = Pt(11)
font.color.rgb = RGBColor(0x2D, 0x2D, 0x2D)

for level in range(1, 5):
    hs = doc.styles[f"Heading {level}"]
    hf = hs.font
    hf.name = "Calibri"
    hf.color.rgb = RGBColor(0x1A, 0x1A, 0x5E)
    if level == 1:
        hf.size = Pt(20)
        hf.bold = True
    elif level == 2:
        hf.size = Pt(16)
        hf.bold = True
    elif level == 3:
        hf.size = Pt(13)
        hf.bold = True

def add_note(text, color=RGBColor(0x15, 0x60, 0x82)):
    """Add a styled note/tip block."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(1)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(f"💡 {text}")
    run.font.size = Pt(10)
    run.font.italic = True
    run.font.color.rgb = color

def add_table_row(table, cells_text, bold=False):
    row = table.add_row()
    for i, txt in enumerate(cells_text):
        cell = row.cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        run = p.add_run(str(txt))
        run.font.size = Pt(10)
        run.font.name = "Calibri"
        if bold:
            run.font.bold = True

# ═══════════════════════════════════════════
# TITLE PAGE
# ═══════════════════════════════════════════

for _ in range(6):
    doc.add_paragraph("")

title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run("B-TREE DBMS SIMULATOR")
run.font.size = Pt(28)
run.font.bold = True
run.font.color.rgb = RGBColor(0x1A, 0x1A, 0x5E)

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle.add_run("Hướng Dẫn Sử Dụng")
run.font.size = Pt(18)
run.font.color.rgb = RGBColor(0x4B, 0x4B, 0x9E)

doc.add_paragraph("")

info = doc.add_paragraph()
info.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = info.add_run("Mô phỏng Hệ Quản Trị Cơ Sở Dữ Liệu với chỉ mục B-Tree Bậc 3")
run.font.size = Pt(12)
run.font.italic = True
run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

doc.add_paragraph("")
doc.add_paragraph("")

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = meta.add_run("Môn: Cấu Trúc Dữ Liệu và Giải Thuật Nâng Cao\nHọc kỳ 4")
run.font.size = Pt(11)
run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

doc.add_page_break()

# ═══════════════════════════════════════════
# MỤC LỤC
# ═══════════════════════════════════════════

doc.add_heading("Mục Lục", level=1)
toc_items = [
    "1. Giới thiệu dự án",
    "2. Mô tả tính năng",
    "3. Giao diện tổng quan",
    "4. Hướng dẫn sử dụng chi tiết",
    "   4.1 Thêm sinh viên",
    "   4.2 Xoá sinh viên",
    "   4.3 Tìm kiếm theo mã sinh viên",
    "   4.4 Tìm kiếm theo họ tên",
    "   4.5 Tải dữ liệu mẫu",
    "   4.6 Xoá toàn bộ dữ liệu",
    "   4.7 Xem lịch sử thao tác",
    "5. Hiểu về B-Tree trong ứng dụng",
    "6. Tương tác nâng cao: highlight, hover, animation",
    "7. Triển khai trực tuyến",
    "8. Cài đặt và chạy ở máy cục bộ",
    "9. Xử lý sự cố",
    "10. Bảng thuật ngữ",
]
for item in toc_items:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)

doc.add_page_break()

# ═══════════════════════════════════════════
# 1. GIỚI THIỆU
# ═══════════════════════════════════════════

doc.add_heading("1. Giới Thiệu Dự Án", level=1)

doc.add_paragraph(
    "B-Tree DBMS Simulator là ứng dụng web full-stack giúp trực quan hoá cách "
    "một hệ quản trị cơ sở dữ liệu (DBMS) tổ chức dữ liệu bằng chỉ mục cây B-Tree. "
    "Ứng dụng mô phỏng một bảng dữ liệu sinh viên với hai chỉ mục B-Tree bậc 3 (Order-3): "
    "một theo Mã Sinh Viên (Student ID) và một theo Họ Tên (Full Name)."
)

doc.add_paragraph(
    "Người dùng có thể thêm, xoá, tìm kiếm sinh viên và quan sát trực tiếp cách "
    "cây B-Tree thay đổi: tách nút (split), mượn nút (borrow), gộp nút (merge), thu gọn "
    "gốc (root shrink). Mọi thao tác đều được ghi lại dưới dạng lịch sử có ảnh chụp "
    "trước/sau để so sánh."
)

add_note("Ứng dụng được xây dựng cho mục đích học tập và trình bày trong môn CTDL&GTT nâng cao.")

# ═══════════════════════════════════════════
# 2. TÍNH NĂNG
# ═══════════════════════════════════════════

doc.add_heading("2. Mô Tả Tính Năng", level=1)

features = [
    ("Thêm sinh viên", "Chèn bản ghi mới vào bảng gốc và cả hai cây B-Tree. Nếu cây tràn sẽ tự động tách nút."),
    ("Xoá sinh viên", "Xoá khỏi bảng gốc và cả hai chỉ mục, cây tự cân bằng bằng mượn hoặc gộp nút."),
    ("Tìm theo mã SV", "Duyệt cây ID B-Tree, hiển thị đường đi tìm kiếm từng bước."),
    ("Tìm theo họ tên", "Duyệt cây Tên B-Tree, trả về tất cả sinh viên trùng tên (bucket)."),
    ("Cross-highlight", "Di chuột vào từng key trong cây hoặc dòng trong bảng → highlight tương ứng ở cả 3 thành phần."),
    ("Lịch sử thao tác", "Mỗi thao tác được ghi nhận với ảnh chụp trước/sau và danh sách sự kiện B-Tree."),
    ("Dữ liệu mẫu / Reset", "Tải nhanh 7 bản ghi mẫu hoặc xoá sạch để bắt đầu lại."),
]

table = doc.add_table(rows=1, cols=2)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
table.style = "Light Shading Accent 1"
hdr = table.rows[0].cells
hdr[0].text = "Tính năng"
hdr[1].text = "Mô tả"
for name, desc in features:
    add_table_row(table, [name, desc])

# ═══════════════════════════════════════════
# 3. GIAO DIỆN TỔNG QUAN
# ═══════════════════════════════════════════

doc.add_heading("3. Giao Diện Tổng Quan", level=1)

doc.add_paragraph(
    "Giao diện chia thành các phần chính:"
)

areas = [
    ("Thanh tiêu đề (Header)", "Hiển thị tên ứng dụng, số bản ghi hiện tại, và số thao tác đã thực hiện."),
    ("Bảng điều khiển trái", "Gồm 3 tab: Thêm/Xoá/Tìm kiếm. Bên dưới có nút Tải Mẫu và Xoá Sạch."),
    ("Kết quả tìm kiếm", "Hiện bên dưới bảng điều khiển khi tìm kiếm, gồm đường đi tìm kiếm và bản ghi tìm thấy."),
    ("Ghi chú tiếng Việt", "Các mẹo ngắn về cách tương tác, nằm ở cuối cột trái."),
    ("Bảng gốc (Base Table)", "Bảng dữ liệu sinh viên thực tế, hiển thị STT, mã SV, họ tên, giới tính."),
    ("Cây ID B-Tree", "Trực quan hoá chỉ mục B-Tree sắp xếp theo mã sinh viên."),
    ("Cây Tên B-Tree", "Trực quan hoá chỉ mục B-Tree sắp xếp theo họ tên (hỗ trợ tên trùng bằng bucket)."),
    ("Lịch sử thao tác", "Danh sách chronological các thao tác ADD/DELETE, bấm mở rộng để xem chi tiết."),
]

for name, desc in areas:
    p = doc.add_paragraph()
    run_b = p.add_run(f"• {name}: ")
    run_b.bold = True
    run_b.font.size = Pt(11)
    p.add_run(desc).font.size = Pt(11)

# ═══════════════════════════════════════════
# 4. HƯỚNG DẪN CHI TIẾT
# ═══════════════════════════════════════════

doc.add_heading("4. Hướng Dẫn Sử Dụng Chi Tiết", level=1)

# 4.1
doc.add_heading("4.1 Thêm sinh viên", level=2)
steps = [
    'Chọn tab "＋ Add" ở bảng điều khiển bên trái.',
    "Nhập Mã Sinh Viên (ví dụ: S010) — phải là mã chưa tồn tại.",
    'Nhập Họ Tên (ví dụ: "Nguyen Van A").',
    "Chọn Giới tính (Male / Female / Other).",
    'Bấm "Add Student".',
    "Kết quả: dòng mới trượt vào bảng kèm hiệu ứng xanh; key mới sáng lên trong cả hai cây.",
]
for i, s in enumerate(steps, 1):
    doc.add_paragraph(f"{i}. {s}")
add_note("Nếu mã SV đã tồn tại, thao tác sẽ bị từ chối và hiện lỗi màu đỏ.")

# 4.2
doc.add_heading("4.2 Xoá sinh viên", level=2)
steps = [
    'Chuyển sang tab "− Delete".',
    "Nhập Mã Sinh Viên cần xoá.",
    'Bấm "Delete Student".',
    "Dòng trong bảng sẽ nháy đỏ rồi biến mất; cây B-Tree cập nhật tức thì.",
    "Nếu cây bị mất cân bằng, sự kiện BORROW hoặc MERGE sẽ được ghi trong lịch sử.",
]
for i, s in enumerate(steps, 1):
    doc.add_paragraph(f"{i}. {s}")

# 4.3
doc.add_heading("4.3 Tìm kiếm theo mã sinh viên", level=2)
steps = [
    'Chuyển sang tab "⌕ Search".',
    'Ở phần "Search by Student ID", nhập mã SV (ví dụ: S001).',
    'Bấm "Search".',
    "Kết quả hiện bên dưới: đường đi tìm kiếm, bản ghi tìm thấy, và cả hai cây highlight key liên quan.",
]
for i, s in enumerate(steps, 1):
    doc.add_paragraph(f"{i}. {s}")

# 4.4
doc.add_heading("4.4 Tìm kiếm theo họ tên", level=2)
steps = [
    'Ở phần "Search by Full Name", nhập họ tên (ví dụ: Nguyen Van A).',
    'Bấm "Search".',
    "Nếu tên tồn tại, tất cả sinh viên trùng tên sẽ hiển thị (do cơ chế bucket).",
]
for i, s in enumerate(steps, 1):
    doc.add_paragraph(f"{i}. {s}")

# 4.5
doc.add_heading("4.5 Tải dữ liệu mẫu", level=2)
doc.add_paragraph('Bấm nút "🎲 Load Demo" ở cuối bảng điều khiển. 7 bản ghi sinh viên mẫu sẽ được thêm tự động, bao gồm cả trường hợp tên trùng để minh hoạ bucket.')

# 4.6
doc.add_heading("4.6 Xoá toàn bộ dữ liệu", level=2)
doc.add_paragraph('Bấm nút "↺ Reset All" để xoá sạch bảng dữ liệu, cả hai cây B-Tree, và lịch sử thao tác. Ứng dụng trở về trạng thái ban đầu.')

# 4.7
doc.add_heading("4.7 Xem lịch sử thao tác", level=2)
doc.add_paragraph(
    "Cuộn xuống phần \"Operation History\". Mỗi mục hiển thị loại thao tác (ADD/DELETE), "
    "mã SV, và badge \"rebalance\" nếu cây bị tái cân bằng. Bấm vào mục để mở rộng xem:"
)
doc.add_paragraph("• Danh sách sự kiện B-Tree (INSERTED, SPLIT, MERGE, BORROW, ROOT_SHRINK, BUCKET_UPDATE...)")
doc.add_paragraph("• Bảng gốc trước và sau thao tác (so sánh side-by-side)")
doc.add_paragraph("• Cây ID B-Tree trước và sau thao tác")

# ═══════════════════════════════════════════
# 5. HIỂU VỀ B-TREE
# ═══════════════════════════════════════════

doc.add_heading("5. Hiểu Về B-Tree Trong Ứng Dụng", level=1)

doc.add_paragraph(
    "Ứng dụng sử dụng B-Tree bậc 3 (Order-3), còn gọi là cây 2-3:"
)

props = [
    ("Bậc (Order)", "3"),
    ("Số key tối đa mỗi nút", "2 (= bậc − 1)"),
    ("Số con tối đa mỗi nút", "3"),
    ("Số key tối thiểu (không phải gốc)", "1"),
    ("Tất cả lá", "Cùng độ sâu (balanced)"),
]

table2 = doc.add_table(rows=1, cols=2)
table2.style = "Light Shading Accent 1"
hdr = table2.rows[0].cells
hdr[0].text = "Thuộc tính"
hdr[1].text = "Giá trị"
for name, val in props:
    add_table_row(table2, [name, val])

doc.add_paragraph("")
doc.add_paragraph(
    "Chèn (Insert): Chèn key vào lá, nếu lá tràn (3 key) → tách nút, đẩy key giữa lên cha. "
    "Quá trình lặp lại cho đến khi không còn tràn hoặc tạo gốc mới."
)
doc.add_paragraph(
    "Xoá (Delete): Xoá key khỏi lá (nếu key ở nút nội bộ, thay bằng predecessor). "
    "Nếu nút thiếu key → mượn từ anh em (borrow) hoặc gộp (merge). "
    "Nếu gốc trống → thu gọn gốc (root shrink)."
)
doc.add_paragraph(
    "Chỉ mục Tên với bucket: Cây Tên lưu mỗi key là một họ tên, value là danh sách "
    "mã SV có cùng tên. Khi thêm SV trùng tên, chỉ cập nhật bucket mà không thay đổi cấu trúc cây."
)

# ═══════════════════════════════════════════
# 6. TƯƠNG TÁC NÂNG CAO
# ═══════════════════════════════════════════

doc.add_heading("6. Tương Tác Nâng Cao", level=1)

doc.add_heading("Cross-Highlighting (Per-Key Hover)", level=2)
doc.add_paragraph(
    "Di chuột vào từng key riêng lẻ trong một nút cây (không phải cả nút). "
    "Chỉ key đó sáng lên, và ứng dụng sẽ highlight:"
)
doc.add_paragraph("• Dòng tương ứng trong bảng gốc")
doc.add_paragraph("• Key liên quan trong cây còn lại")
doc.add_paragraph(
    "Ví dụ: hover key \"S002\" trong cây ID → dòng S002 trong bảng gốc sáng lên, "
    "đồng thời key \"Tran Thi B\" trong cây Tên cũng sáng."
)
doc.add_paragraph(
    "Tương tự, hover từ bảng gốc hoặc từ cây Tên cũng hoạt động đầy đủ."
)

doc.add_heading("Animation khi thêm/xoá", level=2)
doc.add_paragraph(
    "Khi thêm: dòng mới trượt vào từ trái (slide-in) kèm nháy xanh; "
    "key mới trong cây có hiệu ứng pulse sáng lên trong vài giây."
)
doc.add_paragraph(
    "Khi xoá: dòng bị xoá nháy đỏ (flash) trước khi biến mất, "
    "giúp người dùng nhận biết rõ ràng bản ghi nào vừa bị xoá."
)

doc.add_heading("Search Path Visualization", level=2)
doc.add_paragraph(
    "Sau khi tìm kiếm, đường đi duyệt cây hiển thị dưới dạng chuỗi nút "
    "(màu vàng cho nút đã duyệt, màu xanh cho nút tìm thấy). "
    "Các node trên cây cũng highlight tương ứng."
)

# ═══════════════════════════════════════════
# 7. TRIỂN KHAI
# ═══════════════════════════════════════════

doc.add_heading("7. Triển Khai Trực Tuyến", level=1)
doc.add_paragraph(
    "Ứng dụng được thiết kế để triển khai trên Vercel (frontend) và một server Python (backend). "
    "URL triển khai sẽ phụ thuộc vào cấu hình Vercel của người dùng. "
    "Nếu chưa triển khai, hãy sử dụng chế độ chạy cục bộ (mục 8)."
)
add_note("Tệp cấu hình vercel.json chưa có sẵn trong repo. Cần tạo riêng nếu muốn deploy.")

# ═══════════════════════════════════════════
# 8. CÀI ĐẶT CỤC BỘ
# ═══════════════════════════════════════════

doc.add_heading("8. Cài Đặt và Chạy Ở Máy Cục Bộ", level=1)

doc.add_heading("Yêu cầu", level=2)
doc.add_paragraph("• Python 3.10 trở lên")
doc.add_paragraph("• Node.js 18 trở lên")
doc.add_paragraph("• npm")

doc.add_heading("Clone repository", level=2)
p = doc.add_paragraph()
run = p.add_run("git clone <url-repository>\ncd B-Tree-DBMS-Simulator")
run.font.name = "Consolas"
run.font.size = Pt(10)

doc.add_heading("Khởi động backend", level=2)
p = doc.add_paragraph()
run = p.add_run("cd backend\npip install -r requirements.txt\nuvicorn app.main:app --reload --port 8000")
run.font.name = "Consolas"
run.font.size = Pt(10)

doc.add_heading("Khởi động frontend", level=2)
p = doc.add_paragraph()
run = p.add_run("cd frontend\nnpm install\nnpm run dev")
run.font.name = "Consolas"
run.font.size = Pt(10)
doc.add_paragraph("Truy cập http://localhost:3000 trên trình duyệt.")

doc.add_heading("Chạy cả hai cùng lúc (từ thư mục gốc)", level=2)
p = doc.add_paragraph()
run = p.add_run("npm run dev:all")
run.font.name = "Consolas"
run.font.size = Pt(10)
doc.add_paragraph("Lệnh này khởi động cả backend (port 8000) và frontend (port 3000) đồng thời.")

doc.add_heading("Chạy kiểm thử", level=2)
p = doc.add_paragraph()
run = p.add_run("cd backend\npython -m pytest tests/ -v")
run.font.name = "Consolas"
run.font.size = Pt(10)
doc.add_paragraph("Hiện có 47 test cases (25 B-Tree unit tests + 22 integration tests).")

# ═══════════════════════════════════════════
# 9. XỬ LÝ SỰ CỐ
# ═══════════════════════════════════════════

doc.add_heading("9. Xử Lý Sự Cố", level=1)

issues = [
    ("Trang trắng hoặc lỗi kết nối", "Kiểm tra backend đã chạy trên port 8000 chưa."),
    ("Lỗi \"Add failed\"", "Mã SV có thể đã tồn tại, hoặc trường bắt buộc bị bỏ trống."),
    ("Cây chồng chéo", "Zoom out bằng scroll hoặc kéo (pan) trong vùng cây."),
    ("Backend không khởi động", "Chạy: pip install -r requirements.txt"),
    ("Frontend không khởi động", "Chạy: cd frontend && npm install"),
    ("Port 3000 bị chiếm", "Tắt tiến trình đang dùng port 3000 hoặc frontend sẽ tự chuyển sang port tiếp theo."),
]

table3 = doc.add_table(rows=1, cols=2)
table3.style = "Light Shading Accent 1"
hdr = table3.rows[0].cells
hdr[0].text = "Lỗi thường gặp"
hdr[1].text = "Cách khắc phục"
for issue, fix in issues:
    add_table_row(table3, [issue, fix])

# ═══════════════════════════════════════════
# 10. THUẬT NGỮ
# ═══════════════════════════════════════════

doc.add_heading("10. Bảng Thuật Ngữ", level=1)

glossary = [
    ("B-Tree", "Cấu trúc cây cân bằng dùng trong cơ sở dữ liệu để tìm kiếm, chèn, xoá hiệu quả."),
    ("Order-3 (Bậc 3)", "Mỗi nút tối đa 3 con, 2 key."),
    ("Leaf (Lá)", "Nút ở tầng dưới cùng, không có con."),
    ("Internal (Nội bộ)", "Nút có ít nhất một con."),
    ("Split (Tách)", "Khi nút tràn (>2 key), tách thành 2 và đẩy key giữa lên cha."),
    ("Merge (Gộp)", "Khi nút thiếu key và không mượn được, gộp với anh em qua key của cha."),
    ("Borrow (Mượn)", "Lấy key từ anh em thông qua cha để cân bằng nút bị thiếu."),
    ("Root Shrink", "Khi gốc trống sau merge, con duy nhất trở thành gốc mới."),
    ("Bucket", "Danh sách mã SV cùng tên, dùng trong chỉ mục Tên để xử lý tên trùng."),
    ("Base Table", "Bảng dữ liệu gốc chứa các bản ghi sinh viên — nguồn sự thật duy nhất."),
    ("Cross-highlight", "Di chuột vào một thành phần, các thành phần liên quan sáng lên."),
]

table4 = doc.add_table(rows=1, cols=2)
table4.style = "Light Shading Accent 1"
hdr = table4.rows[0].cells
hdr[0].text = "Thuật ngữ"
hdr[1].text = "Giải thích"
for term, defn in glossary:
    add_table_row(table4, [term, defn])

# ── Footer ──
doc.add_paragraph("")
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("— Hết —")
run.font.size = Pt(10)
run.font.italic = True
run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

# ── Save ──
doc.save(OUT_FILE)
print(f"✓ Created: {OUT_FILE}")
