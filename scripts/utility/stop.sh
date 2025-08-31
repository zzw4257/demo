#!/bin/bash

# DeSci Platform 停止脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🛑 停止 DeSci Platform 服务..."
echo "================================"

# 停止所有相关进程
bash scripts/utility/stop-services.sh

echo "✅ 所有服务已停止"
