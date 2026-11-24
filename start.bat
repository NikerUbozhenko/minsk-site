@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js не найден. Установите его с https://nodejs.org и запустите файл снова. & pause & exit /b)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node server.js
pause
