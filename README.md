# 📸 InstaCheck Pro - Mini App Check Live Instagram & Lượt Theo Dõi

Ứng dụng mini tốc độ cao dùng để kiểm tra trạng thái hoạt động (**LIVE** hoặc **DIE / Bị khóa / Không tồn tại**), thống kê **số lượt người theo dõi (Followers)**, **đang theo dõi (Following)**, **số bài viết (Posts)** và ảnh đại diện (Avatar) của các tài khoản Instagram theo thời gian thực.

---

## 🌟 Tính Năng Nổi Bật Mới Nhất

1. **🔄 Tự động cập nhật liên tục (Auto-Loop Check - 1 phút / lần):**
   - Chế độ giám sát tự động theo chu kỳ: **1 phút / lần (mặc định)**, 2 phút, 5 phút, 10 phút, 30 phút.
   - **Đồng hồ đếm ngược trực quan**: hiển thị chính xác thời gian còn lại trước lượt quét kế tiếp (`59s... 58s...`).
   - Cập nhật số liệu tại chỗ (in-place update) không làm chớp giật bảng dữ liệu.
   - Nút **"Quét ngay lập tức"** cho phép kích hoạt quét tức thì mà không cần chờ hết thời gian đếm ngược.
   - Thống kê **Số vòng đã quét** (`#1, #2, #3...`) và **Thời gian cập nhật gần nhất**.

2. **📈 Theo dõi biến động người theo dõi (Followers Growth/Loss Tracking):**
   - So sánh trực tiếp số lượng Followers giữa các vòng quét liên tiếp.
   - Huy hiệu trực quan:
     - 🟢 **Tăng trưởng**: `▲ +1.5K` hoặc `▲ +24`
     - 🔴 **Giảm sút**: `▼ -10`
     - ⚪ **Không đổi**: `0 (Không đổi)`
     - 🆕 **Tài khoản mới thêm**: `Mới 🆕`

3. **💾 Tự động lưu dữ liệu (Auto-Save & Persistence):**
   - Tự động lưu toàn bộ: danh sách tài khoản đã nhập, toàn bộ bảng kết quả kiểm tra, cấu hình luồng, chu kỳ quét.
   - Lưu trữ song song ở cả **File hệ thống trên máy chủ (`data/state.json`)** và **Trình duyệt (`localStorage`)**.
   - Tự động khôi phục nguyên vẹn dữ liệu khi F5 làm mới trang, đóng trình duyệt hoặc khởi động lại máy tính!

4. **⚡ Kiểm tra hàng loạt (Batch Check) qua Server-Sent Events (SSE):**
   - Hỗ trợ dán hàng trăm / hàng nghìn tài khoản cùng lúc.
   - Tự động lọc định dạng: `@username`, `username` hoặc link đầy đủ `https://www.instagram.com/username/`.
   - Nhập danh sách từ file `.txt` hoặc `.csv`.
   - Kết quả hiển thị streaming tức thì theo thời gian thực.

5. **🔍 Kiểm tra đơn lẻ (Single Check):**
   - Tra cứu tức thời 1 tài khoản, hiển thị Avatar, Họ tên, Trạng thái (Live/Die), Followers, Following, Posts, link trực tiếp.

6. **⚙️ Tùy biến tốc độ & Luân phiên User-Agent:**
   - Điều chỉnh 1 - 5 luồng chạy cùng lúc.
   - Tùy chọn độ trễ (100ms - 1.2s) để tránh bị chặn IP / rate limit.
   - Tự động luân phiên các User-Agent crawler mạng xã hội (Facebook, WhatsApp, Twitter, Telegram).

7. **📋 Sao chép nhanh & Xuất dữ liệu:**
   - **1-Click Copy danh sách nick LIVE** (dành cho anh em MMO / nuôi nick / lọc nick).
   - **1-Click Copy danh sách nick DIE**.
   - Xuất file **Excel (CSV với UTF-8 BOM)** chuẩn tiếng Việt.
   - Xuất file **JSON** chi tiết.

8. **🎨 Giao diện Instagram hiện đại:**
   - Giao diện Neon Gradient Instagram cao cấp, hỗ trợ **Dark Mode** và **Light Mode**.
   - Viết hoàn toàn bằng Node.js thuần (**Zero external dependencies**).

---

## 🚀 Hướng Dẫn Khởi Chạy

### Cách 1: Chạy bằng file `start.bat` (Tiện nhất trên Windows)
- Nhấp đúp chuột vào file `start-instagram-checker.bat` ở thư mục dự án hoặc `instagram-checker/start.bat`.
- Trình duyệt sẽ tự động mở trang: `http://localhost:3000`.

### Cách 2: Chạy bằng dòng lệnh Terminal
```bash
cd instagram-checker
node server.js
```
Sau đó mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🛠️ Cấu Trúc Thư Mục
```text
instagram-checker/
├── data/
│   └── state.json        # Dữ liệu tự động lưu (danh sách tài khoản, kết quả quét, lịch sử)
├── package.json          # Thông tin ứng dụng
├── server.js             # Máy chủ Node.js & bộ xử lý luồng quét Instagram & API lưu trữ
├── start.bat             # File khởi chạy 1-click cho Windows
├── README.md             # Tài liệu hướng dẫn sử dụng
└── public/
    ├── index.html        # Giao diện chính với bảng điều khiển giám sát tự động
    ├── style.css         # CSS Dark/Light & Instagram styling
    └── app.js            # Engine đếm ngược 1 phút/lần, tính biến động followers, auto-save
```
