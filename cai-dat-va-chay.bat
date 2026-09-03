@echo off
chcp 65001 >nul
title InstaCheck Pro - Trợ lý cài đặt và khởi chạy nội bộ

echo ================================================================
echo      INSTACHECK PRO - CÀI ĐẶT & CHẠY NỘI BỘ (OFFLINE / LAN)
echo ================================================================
echo.

:: 1. Kiểm tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Máy tính này CHƯA CÀI ĐẶT Node.js!
    echo.
    echo Để chạy được ứng dụng, bạn vui lòng cài đặt Node.js:
    echo 1. Truy cập: https://nodejs.org
    echo 2. Tải bản LTS và cài đặt (Next -> Next -> Finish)
    echo 3. Sau khi cài xong, mở lại file này!
    echo.
    echo Đang mở trang tải Node.js cho bạn...
    start https://nodejs.org/en/download
    pause
    exit /b 1
)

echo [✓] Đã tìm thấy Node.js trên máy!
echo.
echo [1/2] Đang khởi động máy chủ cục bộ...
echo [2/2] Ứng dụng sẽ tự động mở trên trình duyệt của bạn sau 2 giây...
echo.
echo ================================================================
echo GỢI Ý DÙNG CHUNG CHO NỘI BỘ / ĐỒNG NGHIỆP:
echo - Mở màn hình console này xem link "Mạng nội bộ (LAN)"
echo - Gửi link đó cho đồng nghiệp cùng Wi-Fi là họ dùng được ngay!
echo ================================================================
echo.

timeout /t 2 >nul
start http://localhost:3000

node server.js
pause
