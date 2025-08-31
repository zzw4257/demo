#!/bin/bash

# DeSci Platform 状态检查脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts/utility"

# 检查脚本是否存在
if [ ! -f "$SCRIPTS_DIR/check-status.sh" ]; then
    echo "❌ 错误：状态检查脚本不存在于 $SCRIPTS_DIR/check-status.sh"
    exit 1
fi

echo "📊 DeSci Platform 状态检查"
echo "============================"

# 执行实际的状态检查脚本
bash "$SCRIPTS_DIR/check-status.sh"
