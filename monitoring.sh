#!/bin/bash

# DeSci Platform 生产环境监控脚本
# 用于监控系统状态和性能指标

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/monitoring.log"
ALERT_LOG="$PROJECT_DIR/logs/alerts.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    echo "[$timestamp] [$level] $message"
}

alert() {
    local message=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [ALERT] $message" >> "$ALERT_LOG"
    echo -e "${RED}[$timestamp] [ALERT] $message${NC}"
}

success() {
    local message=$1
    echo -e "${GREEN}✓ $message${NC}"
}

warning() {
    local message=$1
    echo -e "${YELLOW}⚠ $message${NC}"
}

info() {
    local message=$1
    echo -e "${BLUE}ℹ $message${NC}"
}

# 检查服务状态
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-10}

    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        success "$service_name 运行正常"
        return 0
    else
        alert "$service_name 服务异常 - $url"
        return 1
    fi
}

# 检查端口占用
check_port() {
    local port=$1
    local service_name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        success "$service_name 端口 $port 正常"
        return 0
    else
        alert "$service_name 端口 $port 未监听"
        return 1
    fi
}

# 检查磁盘使用率
check_disk_usage() {
    local threshold=${1:-90}
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ "$usage" -gt "$threshold" ]; then
        alert "磁盘使用率过高: ${usage}% (阈值: ${threshold}%)"
        return 1
    else
        success "磁盘使用率正常: ${usage}%"
        return 0
    fi
}

# 检查内存使用率
check_memory_usage() {
    local threshold=${1:-90}
    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

    if [ "$usage" -gt "$threshold" ]; then
        alert "内存使用率过高: ${usage}% (阈值: ${threshold}%)"
        return 1
    else
        success "内存使用率正常: ${usage}%"
        return 0
    fi
}

# 检查CPU使用率
check_cpu_usage() {
    local threshold=${1:-90}
    local usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

    if [ $(echo "$usage > $threshold" | bc -l) -eq 1 ]; then
        alert "CPU使用率过高: ${usage}% (阈值: ${threshold}%)"
        return 1
    else
        success "CPU使用率正常: ${usage}%"
        return 0
    fi
}

# 检查进程状态
check_process() {
    local process_name=$1
    local expected_count=${2:-1}

    local actual_count=$(pgrep -f "$process_name" | wc -l)

    if [ "$actual_count" -lt "$expected_count" ]; then
        alert "$process_name 进程异常 - 期望: $expected_count, 实际: $actual_count"
        return 1
    elif [ "$actual_count" -gt "$expected_count" ]; then
        warning "$process_name 进程数量过多 - 期望: $expected_count, 实际: $actual_count"
        return 0
    else
        success "$process_name 进程正常运行"
        return 0
    fi
}

# 检查区块链连接
check_blockchain() {
    local rpc_url=${1:-"http://localhost:8545"}

    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$rpc_url" | grep -q "result"; then
        success "区块链连接正常"
        return 0
    else
        alert "区块链连接异常 - $rpc_url"
        return 1
    fi
}

# 获取系统信息
get_system_info() {
    echo "=== 系统信息 ==="
    echo "时间: $(date)"
    echo "主机名: $(hostname)"
    echo "操作系统: $(uname -s) $(uname -r)"
    echo "CPU: $(nproc) 核心"
    echo "内存: $(free -h | grep '^Mem:' | awk '{print $2}')"
    echo "磁盘: $(df -h / | tail -1 | awk '{print $2}')"
    echo ""
}

# 获取进程信息
get_process_info() {
    echo "=== 进程信息 ==="
    echo "Node.js 进程:"
    ps aux | grep -E "(node|npm)" | grep -v grep | head -10
    echo ""
}

# 备份数据
backup_data() {
    local backup_dir="$PROJECT_DIR/backups"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$backup_dir/desci_backup_$timestamp.tar.gz"

    mkdir -p "$backup_dir"

    info "开始备份数据..."

    # 备份数据库和配置文件
    tar -czf "$backup_file" \
        -C "$PROJECT_DIR" \
        contracts/ \
        scripts/ \
        test/ \
        *.json \
        *.js \
        *.md \
        2>/dev/null || true

    if [ $? -eq 0 ]; then
        success "数据备份完成: $backup_file"

        # 清理旧备份 (保留最近7天)
        find "$backup_dir" -name "desci_backup_*.tar.gz" -mtime +7 -delete
        info "已清理7天前的旧备份"
    else
        alert "数据备份失败"
    fi
}

# 发送告警通知 (可选)
send_notification() {
    local message=$1
    local webhook_url=${SLACK_WEBHOOK_URL:-""}

    if [ -n "$webhook_url" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"DeSci Platform Alert: $message\"}" \
            "$webhook_url" 2>/dev/null || true
    fi
}

# 主监控函数
monitor_system() {
    local exit_code=0

    log "INFO" "开始系统监控检查"

    # 创建日志目录
    mkdir -p "$PROJECT_DIR/logs"

    echo ""
    info "=== DeSci Platform 系统监控 ==="
    echo ""

    # 检查服务状态
    echo "🔍 检查服务状态..."
    check_service "前端服务" "http://localhost:3000" || exit_code=1
    check_service "后端API" "http://localhost:3000/api/health" || exit_code=1
    check_service "Hardhat网络" "http://localhost:8545" || exit_code=1
    echo ""

    # 检查端口状态
    echo "🔌 检查端口状态..."
    check_port 3000 "前端服务" || exit_code=1
    check_port 8545 "Hardhat网络" || exit_code=1
    echo ""

    # 检查系统资源
    echo "💻 检查系统资源..."
    check_disk_usage 90 || exit_code=1
    check_memory_usage 90 || exit_code=1
    check_cpu_usage 90 || exit_code=1
    echo ""

    # 检查进程状态
    echo "⚙️  检查进程状态..."
    check_process "node.*start-demo.js" 1 || exit_code=1
    check_process "node.*backend-api.js" 1 || exit_code=1
    check_process "node.*hardhat" 1 || exit_code=1
    echo ""

    # 检查区块链连接
    echo "⛓️  检查区块链连接..."
    check_blockchain "http://localhost:8545" || exit_code=1
    echo ""

    # 显示系统信息
    get_system_info

    # 显示进程信息
    get_process_info

    # 备份数据 (每周一执行)
    if [ "$(date '+%u')" = "1" ] && [ "$(date '+%H')" = "02" ]; then
        backup_data
    fi

    # 发送告警通知 (如果有错误)
    if [ $exit_code -ne 0 ]; then
        send_notification "系统监控发现异常，请及时检查"
    fi

    log "INFO" "系统监控检查完成 (退出码: $exit_code)"

    return $exit_code
}

# 显示帮助信息
show_help() {
    cat << EOF
DeSci Platform 监控脚本

用法: $0 [选项]

选项:
    -h, --help          显示帮助信息
    -c, --continuous    持续监控模式
    -i, --interval SEC  设置监控间隔 (默认: 300秒)
    -b, --backup        执行数据备份
    -l, --logs          显示最近的日志
    --alerts            显示告警日志

示例:
    $0                    # 执行单次监控
    $0 -c -i 60          # 每60秒持续监控
    $0 -b                # 执行数据备份
    $0 -l                # 显示监控日志

环境变量:
    SLACK_WEBHOOK_URL    Slack告警通知Webhook地址

EOF
}

# 主函数
main() {
    local continuous=false
    local interval=300
    local command=""

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--continuous)
                continuous=true
                shift
                ;;
            -i|--interval)
                interval="$2"
                shift 2
                ;;
            -b|--backup)
                command="backup"
                shift
                ;;
            -l|--logs)
                command="logs"
                shift
                ;;
            --alerts)
                command="alerts"
                shift
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 执行特定命令
    case $command in
        backup)
            backup_data
            exit 0
            ;;
        logs)
            echo "=== 监控日志 (最近50行) ==="
            tail -50 "$LOG_FILE" 2>/dev/null || echo "日志文件不存在"
            exit 0
            ;;
        alerts)
            echo "=== 告警日志 (最近20行) ==="
            tail -20 "$ALERT_LOG" 2>/dev/null || echo "告警日志不存在"
            exit 0
            ;;
    esac

    # 执行监控
    if [ "$continuous" = true ]; then
        info "启动持续监控模式 (间隔: ${interval}秒)"
        info "按 Ctrl+C 停止监控"

        while true; do
            monitor_system
            sleep "$interval"
        done
    else
        monitor_system
        exit $?
    fi
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
