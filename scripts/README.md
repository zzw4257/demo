# 📜 Scripts Directory

此目录包含项目的所有脚本文件，按照功能分类组织。

## 📁 目录结构

```
scripts/
├── 📄 README.md                    # 此说明文档
├── 🚀 startup/                     # 启动脚本
│   ├── start-demo.js              # 演示模式启动脚本
│   ├── start-local-dev.js         # 本地开发环境启动脚本
│   ├── start-production.js        # 生产环境启动脚本
│   └── start-unified.js           # 统一启动脚本
├── 🧪 test/                        # 测试脚本
│   ├── test-api.js                # API测试脚本
│   ├── test-contracts.js          # 合约测试脚本
│   └── test-production.js         # 生产环境测试脚本
└── 🔧 utility/                     # 工具脚本
    ├── backend-api.js             # 后端API服务
    ├── check-status.js            # 状态检查脚本
    ├── check-status.sh            # 状态检查shell脚本
    ├── deploy.sh                  # 部署脚本
    ├── monitoring.sh              # 监控脚本
    ├── quick-start.sh             # 快速启动脚本
    ├── setup-local-dev.sh         # 本地开发环境设置脚本
    ├── start.sh                   # 主启动脚本
    ├── status.sh                  # 状态查询脚本
    └── stop-services.sh           # 停止服务脚本
```

## 🚀 使用方法

### 快速启动
```bash
# 从项目根目录运行
./scripts/utility/start.sh demo      # 启动演示模式
./scripts/utility/start.sh dev       # 启动开发模式
./scripts/utility/start.sh prod      # 启动生产模式
```

### 状态管理
```bash
./scripts/utility/status.sh          # 查看服务状态
./scripts/utility/stop.sh            # 停止所有服务
```

### 开发工具
```bash
./scripts/utility/check-status.sh    # 检查详细状态
./scripts/utility/setup-local-dev.sh # 设置开发环境
```

## 📋 脚本说明

### 🚀 Startup Scripts (启动脚本)
- **start-demo.js**: 启动前端演示模式，无需完整区块链环境
- **start-local-dev.js**: 启动完整的本地开发环境（前端+后端+区块链）
- **start-production.js**: 启动生产环境配置
- **start-unified.js**: 统一启动脚本，支持多种模式

### 🧪 Test Scripts (测试脚本)
- **test-api.js**: 测试后端API功能
- **test-contracts.js**: 测试智能合约功能
- **test-production.js**: 生产环境完整测试

### 🔧 Utility Scripts (工具脚本)
- **backend-api.js**: Express后端API服务
- **deploy.sh**: 智能合约部署脚本
- **monitoring.sh**: 系统监控和健康检查
- **setup-local-dev.sh**: 一键设置本地开发环境

## 🔧 维护说明

### 添加新脚本
1. 根据功能选择合适的子目录
2. 为脚本添加适当的执行权限：`chmod +x script-name.sh`
3. 更新此README文档
4. 如需要，在package.json中添加对应的npm脚本

### 脚本命名规范
- 使用小写字母和连字符：`script-name.sh`
- 脚本文件名应描述其主要功能
- Shell脚本使用`.sh`后缀，Node.js脚本使用`.js`后缀

## 📞 技术支持

如有脚本相关问题，请检查：
1. 脚本执行权限：`ls -la scripts/`
2. Node.js版本：`node --version`
3. 依赖安装：`npm list`
4. 日志文件：`tail -f logs/*.log`
