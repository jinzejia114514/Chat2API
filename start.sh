#!/bin/bash
# Chat2API Web 一键启动脚本（Linux）

set -e

PORT=${PORT:-8080}
HOST=${HOST:-0.0.0.0}
MAX_MEM=${MAX_MEM:-512}

echo "=== Chat2API Web 启动 ==="
echo "端口: $PORT"
echo "主机: $HOST"
echo "内存限制: ${MAX_MEM}MB"

# 检查 node
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 node"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 检查前端是否已构建
if [ ! -d "dist/public" ]; then
    echo "首次构建前端..."
    NODE_OPTIONS="--max-old-space-size=$MAX_MEM" npx vite build
fi

# 杀掉旧进程
pkill -f "tsx src/server" 2>/dev/null && echo "已停止旧进程" || true
sleep 1

# 启动
echo "启动服务器..."
NODE_OPTIONS="--max-old-space-size=$MAX_MEM" nohup npx tsx src/server/index.ts > /tmp/chat2api.log 2>&1 &

sleep 3

# 检查是否启动成功
if curl -s http://localhost:$PORT/api/version > /dev/null 2>&1; then
    echo "✅ 启动成功！访问: http://$(hostname -I | awk '{print $1}'):$PORT"
else
    echo "⚠️ 启动中，请稍后检查: tail -f /tmp/chat2api.log"
fi

echo ""
echo "常用命令:"
echo "  查看日志: tail -f /tmp/chat2api.log"
echo "  停止服务: pkill -f 'tsx src/server'"
echo "  重启服务: $0"
