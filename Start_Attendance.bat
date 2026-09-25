@echo off
title Attendance System Server
echo ===================================================
echo    Starting ATW Student Management System...
echo ===================================================
echo.
echo Please leave this black window open while taking attendance.
echo To stop the server, just close this window.
echo.
cd /d "%~dp0"
npm run dev
pause
