#!/bin/bash

# DeSci Platform 本地开发环境设置脚本
# 自动配置和启动完整的本地开发环境

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NODE_VERSION="18"
PYTHON_VERSION="3.8"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $message"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查系统要求
check_system_requirements() {
    log "INFO" "检查系统要求..."

    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        info "检测到 Linux 系统"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        info "检测到 macOS 系统"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        info "检测到 Windows 系统"
    else
        warning "未识别的操作系统: $OSTYPE"
    fi

    # 检查内存
    if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
        local mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}' 2>/dev/null || sysctl -n hw.memsize 2>/dev/null || echo "0")
        local mem_gb=$((mem_kb / 1024 / 1024))
        if [ "$mem_gb" -lt 4 ]; then
            warning "系统内存 ${mem_gb}GB 可能不足，推荐至少 4GB"
        else
            success "系统内存: ${mem_gb}GB"
        fi
    fi

    # 检查磁盘空间
    local disk_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$disk_space" -lt 5 ]; then
        warning "磁盘可用空间 ${disk_space}GB 可能不足，推荐至少 5GB"
    else
        success "磁盘可用空间: ${disk_space}GB"
    fi

    success "系统要求检查完成"
}

# 检查和安装 Node.js
setup_nodejs() {
    log "INFO" "检查 Node.js..."

    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"

        # 根据操作系统提供安装建议
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            info "Linux 系统安装方法:"
            echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
            echo "  CentOS/RHEL: sudo yum install nodejs npm"
            echo "  或使用 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            info "macOS 系统安装方法:"
            echo "  使用 Homebrew: brew install node"
            echo "  或下载安装包: https://nodejs.org/"
            echo "  或使用 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        else
            info "请从 https://nodejs.org/ 下载并安装 Node.js ${NODE_VERSION}+"
        fi

        exit 1
    fi

    local node_version=$(node -v | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)

    success "Node.js 版本: $node_version"

    if [ "$major_version" -lt "$NODE_VERSION" ]; then
        warning "Node.js 版本过低，推荐使用 ${NODE_VERSION}+ 版本"
        info "升级方法: npm install -g n"
        info "然后运行: n latest"
    fi

    # 检查 npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm -v)
        success "npm 版本: $npm_version"
    else
        error "npm 未安装"
        exit 1
    fi
}

# 检查和安装 Python
setup_python() {
    log "INFO" "检查 Python..."

    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        warning "Python 未安装，某些功能可能受限"

        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            info "Linux 系统安装方法:"
            echo "  Ubuntu/Debian: sudo apt-get install python3 python3-pip"
            echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            info "macOS 系统安装方法:"
            echo "  使用 Homebrew: brew install python3"
            echo "  或使用 pyenv: curl https://pyenv.run | bash"
        fi

        return
    fi

    local python_cmd="python3"
    if ! command -v python3 &> /dev/null && command -v python &> /dev/null; then
        python_cmd="python"
    fi

    local python_version=$($python_cmd -c "import sys; print('.'.join(map(str, sys.version_info[:2])))")
    success "Python 版本: $python_version"

    local major_version=$(echo $python_version | cut -d. -f1)
    local minor_version=$(echo $python_version | cut -d. -f2)

    if [ "$major_version" -lt 3 ] || ([ "$major_version" -eq 3 ] && [ "$minor_version" -lt 8 ]); then
        warning "Python 版本过低，推荐使用 ${PYTHON_VERSION}+ 版本"
    fi
}

# 安装项目依赖
install_dependencies() {
    log "INFO" "安装项目依赖..."

    # 检查 package.json
    if [ ! -f "package.json" ]; then
        error "未找到 package.json 文件"
        exit 1
    fi

    # 安装 npm 依赖
    info "安装 npm 依赖..."
    if npm install; then
        success "npm 依赖安装完成"
    else
        error "npm 依赖安装失败"
        exit 1
    fi

    # 检查前端文件
    if [ -d "frontend" ]; then
        success "前端文件结构完整"
    else
        warning "未找到 frontend 目录"
    fi

    # 检查合约文件
    if [ -d "contracts" ]; then
        success "智能合约文件完整"
    else
        warning "未找到 contracts 目录"
    fi
}

# 配置环境变量
setup_environment() {
    log "INFO" "配置环境变量..."

    # 创建 .env 文件（如果不存在）
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# DeSci Platform 环境配置
NODE_ENV=development
DEBUG=true
PORT=3000
API_PORT=3001
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_ENABLED=true

# 数据库配置（如果需要）
# DATABASE_URL=postgresql://localhost:5432/desci_dev

# 区块链网络配置
CHAIN_ID=1337
NETWORK_NAME=hardhat

# API 配置
API_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000

# 日志配置
LOG_LEVEL=debug
LOG_FILE=./logs/dev.log

# 开发工具配置
AUTO_OPEN_BROWSER=true
ENABLE_HOT_RELOAD=true
EOF
        success "已创建 .env 配置文件"
    else
        success ".env 配置文件已存在"
    fi

    # 创建日志目录
    mkdir -p logs
    success "日志目录已创建"
}

# 编译智能合约
compile_contracts() {
    log "INFO" "编译智能合约..."

    if [ ! -d "contracts" ]; then
        warning "未找到 contracts 目录，跳过合约编译"
        return
    fi

    if ! command -v npx &> /dev/null; then
        error "npx 未找到，请确保 npm 已正确安装"
        exit 1
    fi

    info "编译 Solidity 合约..."
    if npx hardhat compile; then
        success "智能合约编译完成"
    else
        error "智能合约编译失败"
        exit 1
    fi
}

# 设置本地区块链网络
setup_blockchain_network() {
    log "INFO" "配置本地区块链网络..."

    # 检查 hardhat.config.js
    if [ ! -f "hardhat.config.js" ]; then
        error "未找到 hardhat.config.js 文件"
        return
    fi

    success "Hardhat 配置检查完成"

    # 创建部署脚本的软链接（如果需要）
    if [ -f "scripts/deploy.js" ]; then
        success "部署脚本已存在"
    else
        warning "未找到部署脚本，请检查 scripts/ 目录"
    fi
}

# 创建开发工具脚本
create_dev_scripts() {
    log "INFO" "创建开发工具脚本..."

    # 创建快速启动脚本
    cat > quick-start.sh << 'EOF'
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
EOF

    # 创建停止服务脚本
    cat > stop-services.sh << 'EOF'
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
EOF

    # 创建状态检查脚本
    cat > check-status.sh << 'EOF'
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
EOF

    # 设置脚本权限
    chmod +x quick-start.sh stop-services.sh check-status.sh

    success "开发工具脚本创建完成"
}

# 显示使用指南
show_usage_guide() {
    echo ""
    echo "🎉 本地开发环境设置完成！"
    echo "========================================"
    echo ""
    echo "📚 使用指南:"
    echo ""
    echo "🚀 快速启动:"
    echo "   ./quick-start.sh          # 启动所有服务"
    echo "   npm run local:dev         # 使用npm脚本启动"
    echo ""
    echo "🔍 检查状态:"
    echo "   ./check-status.sh         # 检查服务状态"
    echo "   npm run local:dev:debug   # 调试模式启动"
    echo ""
    echo "🛑 停止服务:"
    echo "   ./stop-services.sh        # 停止所有服务"
    echo "   npm run production:stop   # 停止生产环境服务"
    echo ""
    echo "🔧 开发命令:"
    echo "   npm run compile          # 编译合约"
    echo "   npm run test             # 运行测试"
    echo "   npm run demo             # 启动演示模式"
    echo ""
    echo "📁 项目结构:"
    echo "   frontend/                # 前端代码"
    echo "   contracts/               # 智能合约"
    echo "   scripts/                 # 部署脚本"
    echo "   test/                    # 测试文件"
    echo "   logs/                    # 日志文件"
    echo ""
    echo "🌐 服务地址:"
    echo "   前端应用: http://localhost:3000"
    echo "   后端API:  http://localhost:3001"
    echo "   区块链网络: http://localhost:8545"
    echo ""
    echo "💡 提示:"
    echo "   • 首次运行需要编译合约，可能需要几分钟时间"
    echo "   • 使用 Ctrl+C 可以停止所有服务"
    echo "   • 查看日志文件了解详细运行信息"
    echo "   • 如遇问题，请检查 logs/ 目录下的日志文件"
    echo ""
}

# 主函数
main() {
    echo "🚀 DeSci Platform 本地开发环境设置"
    echo "========================================"

    # 检查是否在正确的目录
    if [ ! -f "package.json" ]; then
        error "请在项目根目录运行此脚本"
        exit 1
    fi

    # 执行设置步骤
    check_system_requirements
    setup_nodejs
    setup_python
    install_dependencies
    setup_environment
    compile_contracts
    setup_blockchain_network
    create_dev_scripts

    # 显示使用指南
    show_usage_guide

    success "本地开发环境设置完成！"

    # 询问是否立即启动
    echo ""
    read -p "❓ 是否现在启动开发环境？(y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "启动开发环境..."
        ./quick-start.sh
    else
        info "您可以稍后运行 ./quick-start.sh 来启动服务"
    fi
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
