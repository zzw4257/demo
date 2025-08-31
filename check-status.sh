#!/bin/bash
echo "🔍 检查 DeSci Platform 服务状态..."

# 检查前端
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "✅ 前端服务运行中 (PID: $FRONTEND_PID)"
    else
        echo "❌ 前端服务已停止"
    fi
else
    echo "❓ 前端服务未启动"
fi

# 检查API
if [ -f ".api.pid" ]; then
    API_PID=$(cat .api.pid)
    if kill -0 $API_PID 2>/dev/null; then
        echo "✅ API服务运行中 (PID: $API_PID)"
    else
        echo "❌ API服务已停止"
    fi
else
    echo "❓ API服务未启动"
fi

# 检查区块链
if [ -f ".blockchain.pid" ]; then
    BLOCKCHAIN_PID=$(cat .blockchain.pid)
    if kill -0 $BLOCKCHAIN_PID 2>/dev/null; then
        echo "✅ 区块链网络运行中 (PID: $BLOCKCHAIN_PID)"
    else
        echo "❌ 区块链网络已停止"
    fi
else
    echo "❓ 区块链网络未启动"
fi

echo ""
echo "🌐 服务地址:"
echo "   前端: http://localhost:3000"
echo "   API:  http://localhost:3001"
echo "   区块链: http://localhost:8545"
