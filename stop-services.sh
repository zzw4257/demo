#!/bin/bash
echo "🛑 停止 DeSci Platform 服务..."

# 停止前端服务
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm -f .frontend.pid
fi

# 停止API服务
if [ -f ".api.pid" ]; then
    API_PID=$(cat .api.pid)
    if kill -0 $API_PID 2>/dev/null; then
        echo "停止API服务 (PID: $API_PID)..."
        kill $API_PID
    fi
    rm -f .api.pid
fi

# 停止区块链网络
if [ -f ".blockchain.pid" ]; then
    BLOCKCHAIN_PID=$(cat .blockchain.pid)
    if kill -0 $BLOCKCHAIN_PID 2>/dev/null; then
        echo "停止区块链网络 (PID: $BLOCKCHAIN_PID)..."
        kill $BLOCKCHAIN_PID
    fi
    rm -f .blockchain.pid
fi

echo "✅ 所有服务已停止"
