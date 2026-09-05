@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动倒数日网页版…
start "" http://localhost:8123
node tools\serve.mjs
pause
