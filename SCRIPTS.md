# 📜 DeSci Platform NPM脚本使用指南

## 🚀 核心使用场景

### 🔥 快速开始（推荐新手）
```bash
# 一键设置完整本地环境
npm run setup:local

# 启动完整开发环境（前端+后端+区块链）
npm run local:dev

# 检查所有服务状态
npm run status:local

# 停止所有服务
npm run stop:local
```

### ⚡ 开发常用
```bash
# 编译智能合约
npm run compile

# 部署到本地网络
npm run deploy:local

# 启动前端演示
npm run demo

# 快速完整流程（编译+部署+演示）
npm run local:quick
```

---

## 📋 按功能分类的完整脚本列表

### 🏗️ 编译和构建
```bash
npm run compile      # 编译所有智能合约
npm run clean        # 清理编译缓存
npm run lint         # 代码质量检查
```

### 🧪 测试脚本
```bash
# 基础测试
npm run test                    # 运行所有合约测试
npm run test:all               # 运行所有合约测试（同上）

# 单个合约测试
npm run test:userprofile       # 用户档案合约测试
npm run test:zkproof           # ZK证明合约测试
npm run test:dataset           # 数据集合约测试
npm run test:descinft          # NFT合约测试
npm run test:platform          # 主平台合约测试

# 其他测试
npm run test:api               # API功能测试
npm run test:contracts         # 合约功能测试
npm run test:full              # 完整测试套件
npm run test:production        # 生产环境测试
npm run validate               # 测试+健康检查
```

### ⛓️ 区块链网络
```bash
# 网络管理
npm run node                   # 启动本地Hardhat网络

# 合约部署
npm run deploy                 # 部署到本地网络
npm run deploy:local           # 部署到本地网络（同上）
npm run deploy:sepolia         # 部署到Sepolia测试网
npm run deploy:mainnet         # 部署到主网

# 区块链工具
npm run verify                 # 合约验证
npm run coverage               # 代码覆盖率
```

### 🌐 前端演示
```bash
# 基础演示
npm run demo                   # 启动前端演示（默认端口3000）
npm run start                  # 同上（npm start）
npm run dev                    # 同上（npm run dev）

# 自定义配置
npm run demo:port              # 启动在端口8080
npm run demo:debug             # 启用调试模式
npm run demo:prod              # 生产环境模式

# 开发调试
npm run dev:debug              # 开发模式+调试
```

### 🔧 后端API
```bash
npm run backend                # 启动后端API服务
npm run backend:debug          # 后端API+调试模式
npm run backend:prod           # 后端API+生产模式
```

### 🎨 Vue前端（BS目录）
```bash
npm run vue                    # 启动Vue开发服务器
npm run vue:install            # 安装Vue项目依赖
npm run vue:build              # 构建Vue生产版本
```

### 🔄 统一系统
```bash
# 基础启动
npm run unified                # 启动统一系统
npm run unified:all            # 启动所有组件
npm run unified:vue            # 仅启动Vue前端
npm run unified:html           # 仅启动HTML前端

# 配置选项
npm run unified:debug          # 统一系统+调试
npm run unified:prod           # 统一系统+生产模式
npm run unified:blockchain     # 启用区块链功能
npm run unified:mock           # 禁用区块链（模拟模式）
```

### 🏭 本地开发环境
```bash
# 核心命令
npm run local:dev              # 启动完整本地环境
npm run local:dev:debug        # 本地环境+调试模式
npm run local:dev:no-blockchain # 本地环境+无区块链

# 快捷操作
npm run local:quick            # 快速完整流程
npm run setup:local            # 一键环境设置
npm run start:local            # 使用快速启动脚本
npm run stop:local             # 停止所有本地服务
npm run status:local           # 检查本地服务状态
```

### 🚀 生产环境
```bash
# 生产部署
npm run production             # 启动生产环境
npm run production:debug       # 生产环境+调试
npm run production:no-blockchain # 生产环境+无区块链

# 生产管理
npm run production:stop        # 停止生产服务
npm run production:status      # 查看生产状态
npm run production:health      # 健康检查
npm run production:restart     # 重启生产服务
```

### 🐳 部署脚本
```bash
npm run deploy                 # 本地部署脚本
npm run deploy:docker          # Docker部署
npm run deploy:local           # 本地部署（重复）
```

### 📊 监控和状态
```bash
npm run check                  # 检查系统状态
npm run status                 # 查看服务状态
npm run health                 # 健康检查（HTTP请求）
```

### ⚙️ 环境设置
```bash
npm run setup                  # 基础环境设置
npm run setup:full             # 完整环境设置（含编译）
```

---

## 🎯 推荐使用流程

### 新手快速开始
```bash
npm run setup:local    # 1. 设置环境
npm run local:dev      # 2. 启动开发
npm run status:local   # 3. 检查状态
```

### 开发工作流
```bash
npm run compile        # 1. 编译合约
npm run deploy:local   # 2. 部署合约
npm run demo           # 3. 启动演示
```

### 测试工作流
```bash
npm run test:all       # 1. 运行所有测试
npm run test:api       # 2. 测试API
npm run validate       # 3. 完整验证
```

### 生产部署
```bash
npm run test:full      # 1. 完整测试
npm run production     # 2. 启动生产
npm run production:health # 3. 监控健康
```

---

## 📝 脚本说明

### 端口配置
- **前端**: 3000 (可通过 `PORT=8080` 修改)
- **后端API**: 3001
- **区块链**: 8545 (Hardhat默认)

### 环境变量
- `DEBUG=true`: 启用调试模式
- `NODE_ENV=production`: 生产环境
- `BLOCKCHAIN_ENABLED=false`: 禁用区块链功能

### 常用组合
```bash
# 开发调试
DEBUG=true npm run local:dev

# 生产部署
NODE_ENV=production npm run production

# 无区块链演示
BLOCKCHAIN_ENABLED=false npm run demo
```

---

## 🔍 故障排除

### 端口冲突
```bash
# 检查端口占用
lsof -i :3000

# 使用不同端口
PORT=3001 npm run demo
```

### 服务启动失败
```bash
# 检查日志
tail -f logs/dev.log

# 重新设置环境
npm run setup:local
```

### 区块链连接问题
```bash
# 检查区块链网络
npm run status:local

# 重启区块链
npm run stop:local && npm run local:dev
```

---

## 📚 相关文档
- [本地开发指南](./LOCAL_DEVELOPMENT_GUIDE.md) - 详细的开发环境设置
- [快速开始](./QUICKSTART.md) - 入门指南
- [生产就绪报告](./PRODUCTION_READINESS_REPORT.md) - 生产环境配置