@echo off
title InstaCheck Pro - Instagram Live & Follower Checker
echo ===================================================
echo     InstaCheck Pro - Instagram Checker
echo ===================================================
echo [1/2] Dang khoi dong may chu tai http://localhost:3000 ...
timeout /t 2 >nul
start http://localhost:3000
echo [2/2] May chu dang chay. Nhan Ctrl + C de dung.
echo ===================================================
node server.js
pause
