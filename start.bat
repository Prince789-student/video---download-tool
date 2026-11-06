@echo off
title OmniStream Pro - Universal Video & Audio Downloader
echo ========================================================
echo   Launching OmniStream Pro (Local Downloader Engine)
echo   Powered by yt-dlp + FFmpeg
echo ========================================================
echo.
cd /d "%~dp0"
start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4000"
node server.js
pause
