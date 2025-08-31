#!/bin/bash
echo "🚀 快速启动 DeSci Platform..."

# 启动区块链网络
echo "⛓️  启动区块链网络..."
npx hardhat node > blockchain.log 2>&1 &
BLOCKCHAIN_PID=$!
echo $BLOCKCHAIN_PID > .blockchain.pid

# 等待区块链启动
sleep 5

# 部署合约
echo "📝 部署智能合约..."
npx hardhat run scripts/deploy.js --network localhost

# 启动后端API
echo "🔧 启动后端API..."
node backend-api.js > api.log 2>&1 &
API_PID=$!
echo $API_PID > .api.pid

# 等待API启动
sleep 3

# 启动前端
echo "🎨 启动前端..."
node start-demo.js > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "✅ 所有服务已启动！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 API地址: http://localhost:3001"
echo "⛓️  区块链: http://localhost:8545"
echo ""
echo "🛑 要停止所有服务，请运行: ./stop-services.sh"
echo ""
echo "进程ID已保存到 .*.pid 文件中"
