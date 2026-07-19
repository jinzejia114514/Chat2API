#!/bin/bash
# 停止 Chat2API Web
pkill -f "tsx src/server" 2>/dev/null && echo "✅ 已停止" || echo "未找到运行中的进程"
