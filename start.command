#!/bin/bash
# CODELAB 启动脚本 (macOS)
# 如果双击提示 permission denied，请在终端执行：
#   chmod +x start.command && ./start.command

cd "$(dirname "$0")"
chmod +x start.command 2>/dev/null
[ -f .env ] || cp .env.example .env 2>/dev/null
PORT="$(grep -E '^PORT=' .env 2>/dev/null | tail -n 1 | cut -d= -f2)"
[ -n "$PORT" ] || PORT=3000
echo "🚀 CODELAB 正在启动..."
echo ""
npm install --silent 2>/dev/null || { echo "❌ 请先安装 Node.js: https://nodejs.org"; read -p "按回车退出..."; exit 1; }
echo "✅ 依赖已安装"
echo "🌐 默认地址: http://localhost:$PORT"
echo "ℹ️ 如果默认端口被占用，程序会自动切换到下一个可用端口，请以终端最终输出的地址为准"
echo ""
npm start
