#!/bin/bash

# DeSci Platform 一键部署脚本
# 用于快速部署生产环境

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_DIR="$PROJECT_DIR/logs"

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
    echo "[$timestamp] [$level] $message" >> "$LOG_DIR/deploy.log"
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

    # 检查Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi

    local node_version=$(node -v | sed 's/v//')
    if [[ "$(printf '%s\n' "$node_version" "18.0.0" | sort -V | head -n1)" != "18.0.0" ]]; then
        warning "Node.js 版本过低 (当前: $node_version)，推荐使用 18.0.0+"
    fi

    # 检查npm
    if ! command -v npm &> /dev/null; then
        error "npm 未安装"
        exit 1
    fi

    # 检查Docker (可选)
    if command -v docker &> /dev/null; then
        success "Docker 已安装"
    else
        warning "Docker 未安装，将使用本地部署模式"
    fi

    success "系统要求检查通过"
}

# 创建必要目录
create_directories() {
    log "INFO" "创建必要目录..."

    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/data"

    success "目录创建完成"
}

# 备份现有配置
backup_existing_config() {
    log "INFO" "备份现有配置..."

    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
        success "配置文件已备份"
    fi
}

# 安装依赖
install_dependencies() {
    log "INFO" "安装项目依赖..."

    # 安装主项目依赖
    if [ -f "package.json" ]; then
        npm install
        success "主项目依赖安装完成"
    fi

    # 安装后端依赖
    if [ -f "backend-package.json" ]; then
        npm install --package-lock-only --ignore-scripts
        success "后端依赖安装完成"
    fi
}

# 配置环境
configure_environment() {
    log "INFO" "配置环境变量..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            cp .env.production .env
            success "已创建生产环境配置"
        else
            warning "未找到生产环境配置文件模板"
        fi
    else
        success "环境配置文件已存在"
    fi

    # 设置脚本权限
    chmod +x monitoring.sh
    success "脚本权限设置完成"
}

# 编译合约
compile_contracts() {
    log "INFO" "编译智能合约..."

    if command -v npx &> /dev/null; then
        npx hardhat compile
        success "智能合约编译完成"
    else
        error "Hardhat 未安装，请先运行: npm install"
        exit 1
    fi
}

# 运行测试
run_tests() {
    log "INFO" "运行测试套件..."

    # 运行生产环境测试
    if [ -f "test-production.js" ]; then
        node test-production.js
        success "生产环境测试完成"
    else
        warning "生产环境测试脚本不存在"
    fi
}

# Docker部署
deploy_with_docker() {
    log "INFO" "Docker 部署模式..."

    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，无法使用 Docker 部署"
        return 1
    fi

    # 检查 docker-compose
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
        success "Docker Compose 部署完成"
    else
        # 直接使用 Docker
        docker build -t desci-platform .
        docker run -d -p 3000:3000 --name desci-platform desci-platform
        success "Docker 部署完成"
    fi
}

# 本地部署
deploy_locally() {
    log "INFO" "本地部署模式..."

    # 启动生产环境
    npm run production &
    local pid=$!

    # 等待服务启动
    sleep 10

    # 检查服务状态
    if curl -s http://localhost:3000/health > /dev/null; then
        success "本地部署成功"
        info "服务已在后台运行 (PID: $pid)"
        info "前端地址: http://localhost:3000"
        info "API地址: http://localhost:3000/api"

        # 保存进程ID
        echo $pid > "$LOG_DIR/desci-platform.pid"
    else
        error "服务启动失败"
        kill $pid 2>/dev/null || true
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "========================================"
    echo "🎉 DeSci Platform 部署成功!"
    echo "========================================"
    echo ""
    echo "🌐 服务地址:"
    echo "   前端: http://localhost:3000"
    echo "   API:  http://localhost:3000/api"
    if [ "$USE_DOCKER" = true ]; then
        echo "   区块链: http://localhost:8545"
    fi
    echo ""
    echo "📊 管理命令:"
    echo "   查看状态: npm run production:status"
    echo "   健康检查: npm run production:health"
    echo "   重启服务: npm run production:restart"
    echo "   停止服务: npm run production:stop"
    echo ""
    echo "🔍 监控命令:"
    echo "   系统监控: ./monitoring.sh"
    echo "   查看日志: ./monitoring.sh -l"
    echo "   持续监控: ./monitoring.sh -c -i 300"
    echo ""
    echo "📁 重要目录:"
    echo "   日志目录: $LOG_DIR"
    echo "   备份目录: $BACKUP_DIR"
    echo "   数据目录: $PROJECT_DIR/data"
    echo ""
}

# 清理函数
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "部署过程中发生错误，正在清理..."
        # 停止可能启动的服务
        npm run production:stop 2>/dev/null || true
        docker-compose down 2>/dev/null || true
    fi
    exit $exit_code
}

# 主部署函数
main() {
    # 设置清理钩子
    trap cleanup EXIT

    local DEPLOY_MODE="local"
    local SKIP_TESTS=false
    local USE_DOCKER=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --docker)
                USE_DOCKER=true
                DEPLOY_MODE="docker"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --help|-h)
                echo "DeSci Platform 部署脚本"
                echo ""
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --docker      使用 Docker 部署"
                echo "  --skip-tests  跳过测试阶段"
                echo "  --help, -h    显示帮助信息"
                echo ""
                echo "示例:"
                echo "  $0                    # 本地部署"
                echo "  $0 --docker          # Docker 部署"
                echo "  $0 --skip-tests      # 跳过测试"
                exit 0
                ;;
            *)
                error "未知选项: $1"
                echo "使用 --help 查看帮助信息"
                exit 1
                ;;
        esac
    done

    echo "🚀 DeSci Platform 部署脚本"
    echo "========================================"
    echo "部署模式: $DEPLOY_MODE"
    echo "跳过测试: $SKIP_TESTS"
    echo ""

    # 执行部署步骤
    check_system_requirements
    create_directories
    backup_existing_config
    install_dependencies
    configure_environment
    compile_contracts

    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi

    # 根据模式部署
    if [ "$USE_DOCKER" = true ]; then
        deploy_with_docker
    else
        deploy_locally
    fi

    # 显示部署信息
    show_deployment_info

    log "INFO" "部署完成 (模式: $DEPLOY_MODE)"
    success "DeSci Platform 部署成功!"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
