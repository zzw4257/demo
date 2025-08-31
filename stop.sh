#!/bin/bash

# DeSci Platform 停止脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts/utility"

# 检查脚本是否存在
if [ ! -f "$SCRIPTS_DIR/stop.sh" ]; then
    echo "❌ 错误：停止脚本不存在于 $SCRIPTS_DIR/stop.sh"
    exit 1
fi

echo "🛑 停止 DeSci Platform 服务..."
echo "================================"

# 执行实际的停止脚本
bash "$SCRIPTS_DIR/stop.sh"

echo "✅ 所有服务已停止"
