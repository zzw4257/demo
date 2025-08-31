#!/bin/bash

# DeSci Platform 状态检查脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "📊 DeSci Platform 状态检查"
echo "============================"

# 检查服务状态
bash scripts/utility/check-status.sh
