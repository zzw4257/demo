#!/bin/bash

# DeSci Platform 启动脚本
# 用法: ./start.sh [mode]
# mode: demo (默认), local-dev, production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 默认模式
MODE="${1:-demo}"

echo "🚀 启动 DeSci Platform ($MODE 模式)"
echo "=================================="

case "$MODE" in
    "demo")
        echo "🎨 启动演示模式..."
        node scripts/startup/start-demo.js
        ;;
    "local-dev")
        echo "🔧 启动本地开发环境..."
        node scripts/startup/start-local-dev.js
        ;;
    "production")
        echo "🏭 启动生产环境..."
        node scripts/startup/start-production.js
        ;;
    *)
        echo "❌ 未知模式: $MODE"
        echo "可用模式: demo, local-dev, production"
        exit 1
        ;;
esac
