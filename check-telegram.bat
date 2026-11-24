@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js не найден. Установите его с https://nodejs.org и запустите файл снова. & pause & exit /b)
node check-telegram.mjs
echo.
pause
