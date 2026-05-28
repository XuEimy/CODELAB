@echo off
cd /d %~dp0
echo CODELAB 正在启动...
if not exist .env copy .env.example .env >nul 2>&1
call npm install --silent 2>nul
echo 依赖已安装
echo 打开浏览器访问: http://localhost:3000
call npm start
pause
