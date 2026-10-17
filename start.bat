@echo off
title OmniStream Pro - Universal Video & Audio Downloader
echo ========================================================
echo   Launching OmniStream Pro (Local Downloader Engine)
echo   Powered by yt-dlp + FFmpeg
echo ========================================================
echo.
cd /d "%~dp0"
start "" "http://localhost:4000"
node server.js
pause
