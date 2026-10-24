@echo off
title Attendance System Server
echo ===================================================
echo    Starting ATW Student Management System...
echo ===================================================
echo.
echo Launching server and opening your browser...
echo (Please keep this window open while using the system)
echo.
cd /d "%~dp0"

:: Open browser after 3 seconds in the background
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5555/3D-student-management-system/"

:: Start Vite Dev Server
call npm run dev
if %errorlevel% neq 0 (
  echo.
  echo ===================================================
  echo  [ERROR] Server failed to start!
  echo  Please check if Node.js is installed properly.
  echo ===================================================
  pause
)
