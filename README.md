# 📸 InstaCheck Pro - Mini App Check Live Instagram & Lượt Theo Dõi

Ứng dụng mini tốc độ cao dùng để kiểm tra trạng thái hoạt động (**LIVE** hoặc **DIE / Bị khóa / Không tồn tại**), thống kê **số lượt người theo dõi (Followers)**, **đang theo dõi (Following)**, **số bài viết (Posts)** và ảnh đại diện (Avatar) của các tài khoản Instagram theo thời gian thực.

Tích hợp sẵn **Hệ thống phân quyền License Key (Bản quyền)** và **Bảng Quản Trị (Admin Panel)** để bạn dễ dàng cấp quyền, bán key hoặc quản lý khách hàng!

---

## 🌟 Tính Năng Bản Quyền & Quản Trị Key (Mới)

1. **🔑 Hệ Thống Xác Thực License Key Chống Xài Chùa:**
   - Khi bất kỳ ai truy cập web, màn hình pop-up bản quyền sẽ yêu cầu nhập License Key hợp lệ để sử dụng.
   - Key không đúng hoặc đã hết hạn sẽ bị khóa toàn bộ tính năng kiểm tra tài khoản.
   - Lưu trữ tự động trên máy khách để lần sau không cần nhập lại.

2. **👑 Bảng Quản Trị Admin Tích Hợp (Không cần tạo web riêng):**
   - Đăng nhập bằng **Master Key**: `ADMIN_MASTER_KEY_2026` (hoặc cấu hình qua biến môi trường `ADMIN_KEY`).
   - Nút vàng **"👑 Quản Trị Key"** sẽ hiện lên góc màn hình.
   - **Tạo Key mới cho khách hàng**:
     - Tự đặt mã Key hoặc bấm nút **"🎲 Tạo ngẫu nhiên"** (ví dụ `VIP-A7B2-9X1K`).
     - Gắn tên khách hàng / đội nhóm (`Anh Tuấn MMO`, `Team Marketing`).
     - Chọn thời hạn: `7 ngày`, `30 ngày`, `90 ngày`, `1 năm`, hoặc `Vĩnh viễn`.
   - **Quản lý danh sách Key**:
     - Xem tất cả Key đang hoạt động, ngày tạo, ngày hết hạn.
     - Nút **📋 Copy Key** để gửi nhanh cho khách qua Zalo/Telegram.
     - Nút **🗑️ Xóa / Thu hồi Key từ xa**: Khách hàng sẽ bị khóa phần mềm ngay tức thì nếu quỵt tiền hoặc vi phạm!

3. **Danh Sách Key Mặc Định Có Sẵn:**
   - 👑 **Admin Master Key:** `ADMIN_MASTER_KEY_2026` (Quyền cao nhất, mở bảng quản trị tạo key).
   - 🔑 **Key Khách Nội Bộ (Không giới hạn):** `IKID-VIP-2026` (Hạn đến 2030).
   - 🔑 **Key Khách Dùng Thử:** `DEMO-KEY-7DAYS` (Hạn 7 ngày).

---

## 🌟 Các Tính Năng Cốt Lõi Khác

- **🔄 Tự động cập nhật liên tục (Auto-Loop Check - 1 phút / lần):** Quét định kỳ tự động, đếm ngược đồng hồ, so sánh số lượng người theo dõi tăng (`▲ +24`) hoặc giảm (`▼ -5`).
- **💾 Tự động lưu dữ liệu:** Toàn bộ danh sách tài khoản, kết quả quét được lưu trữ vĩnh viễn vào file máy chủ và trình duyệt.
- **⚡ Kiểm tra hàng loạt (Batch Check) tốc độ cao:** Hỗ trợ danh sách hàng nghìn nick, streaming kết quả thời gian thực.
- **⚙️ Tùy biến tốc độ & Luân phiên User-Agent:** Chống checkpoint / rate limit.
- **📋 Xuất file Excel / CSV UTF-8 BOM & Sao chép nhanh 1-click nick LIVE.**
- **🎨 Giao diện Instagram Neon Gradient:** Chế độ Sáng / Tối (Dark / Light mode).

---

## 🚀 Hướng Dẫn Deploy Lên Render.com (Miễn Phí Có Link Web Online)

1. Truy cập: **[https://render.com](https://render.com)** và đăng nhập bằng tài khoản **GitHub** của bạn.
2. Bấm nút **New +** ➔ Chọn **Web Service**.
3. Chọn kho mã nguồn: **`toiladuc0308-svg/Instargram-Check`** ➔ Bấm **Connect**.
4. Cấu hình 3 dòng sau:
   - **Name:** Đặt tên web (ví dụ `instacheck-pro`).
   - **Runtime:** `Node`.
   - **Build Command:** Để trống hoặc `npm install`.
   - **Start Command:** `node server.js`
5. Bấm nút **Create Web Service**.
6. Chờ khoảng 1-2 phút, Render sẽ cấp cho bạn một đường link web online dạng:
   👉 **`https://instacheck-pro.onrender.com`**
   *(Có sẵn ổ khóa xanh HTTPS bảo mật, gửi cho khách hàng là họ truy cập dùng được ngay!)*
