#!/bin/bash
# CODELAB 首次安装脚本
# 在终端中运行: bash setup.command
# 或者: chmod +x setup.command && ./setup.command

cd "$(dirname "$0")"

echo ""
echo "  ██████╗ ██████╗ ██████╗ ███████╗██╗      █████╗ ██████╗ "
echo "  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║     ██╔══██╗██╔══██╗"
echo "  ██║     ██║   ██║██║  ██║█████╗  ██║     ███████║██████╔╝"
echo "  ██║     ██║   ██║██║  ██║██╔══╝  ██║     ██╔══██║██╔══██╗"
echo "  ╚██████╗╚██████╔╝██████╔╝███████╗███████╗██║  ██║██████╔╝"
echo "   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝"
echo ""
echo "  双人联机共创小游戏平台"
echo ""

# grant execute permission
chmod +x start.command 2>/dev/null
chmod +x setup.command 2>/dev/null
echo "✅ 已授权启动脚本"

# check node
if ! command -v node &> /dev/null; then
  echo "❌ 未检测到 Node.js"
  echo "   请先安装: https://nodejs.org (推荐 LTS 版本)"
  echo ""
  read -p "按回车退出..."
  exit 1
fi
echo "✅ Node.js $(node -v)"

# create .env
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null
  echo "✅ 已创建 .env 配置文件"
else
  echo "✅ .env 已存在"
fi

# install deps
echo "📦 安装依赖..."
npm install --silent
echo "✅ 依赖已安装"

echo ""
echo "🚀 启动服务器..."
echo "🌐 请在浏览器打开: http://localhost:3000"
echo ""
echo "   提示: 下次启动可以直接双击 start.command"
echo ""

npm start
