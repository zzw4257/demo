#!/bin/bash

# DeSci Platform 统一启动脚本
# 用法: ./start.sh [mode]
# mode: demo (默认), dev, prod

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts/utility"

# 检查脚本是否存在
if [ ! -f "$SCRIPTS_DIR/start.sh" ]; then
    echo "❌ 错误：启动脚本不存在于 $SCRIPTS_DIR/start.sh"
    echo "请运行以下命令重新设置："
    echo "npm run setup:local"
    exit 1
fi

# 默认模式
MODE="${1:-demo}"

echo "🚀 启动 DeSci Platform ($MODE 模式)"
echo "=================================="

# 执行实际的启动脚本
bash "$SCRIPTS_DIR/start.sh" "$MODE"
