# DeSci Platform - 统一系统使用指南

## 🎯 系统概述

DeSci Platform 是一个去中心化科学研究平台，支持两种前端实现：

1. **Vue.js现代化前端** (`/BS`) - 使用Naive UI组件库，现代化的SPA应用
2. **原生HTML前端** (`/frontend`) - 轻量级HTML/CSS/JS实现，支持分页功能
3. **统一后端API** (`backend-api.js`) - 提供RESTful API，支持区块链交互

## 🚀 快速启动

### 环境准备
```bash
# 1. 安装主项目依赖
npm install

# 2. 安装Vue.js前端依赖
cd BS && npm install

# 3. （可选）启动Hardhat本地网络
npm run node
```

### 🚀 完整的启动方式指南

#### 快速启动（推荐）

##### 方式一：一键启动所有服务
```bash
# 最简单的启动方式，自动启动所有服务
npm run unified

# 或者使用详细模式
npm run unified:all
```

**启动后访问：**
- Vue.js前端：http://localhost:3001
- HTML前端：http://localhost:3000
- 后端API：http://localhost:3000/api

##### 方式二：按需启动服务

**基础模式（仅HTML前端）：**
```bash
npm run demo
```
访问：http://localhost:3000

**开发模式（推荐开发者）：**
```bash
# 启动Vue.js前端
npm run unified:vue

# 访问：http://localhost:3001
```

**仅后端模式：**
```bash
npm run backend
```
访问：http://localhost:3000/api

#### 高级启动方式

##### 方式三：开发调试模式（多终端）

**终端1 - 后端API服务：**
```bash
npm run backend
```

**终端2 - Vue.js前端：**
```bash
cd BS && npm run dev
```

**终端3 - HTML前端：**
```bash
npm run demo
```

##### 方式四：区块链集成模式

**步骤1：启动区块链网络**
```bash
# 启动Hardhat本地网络
npm run node
```

**步骤2：部署智能合约**
```bash
# 在新终端窗口
npm run deploy
```

**步骤3：启动完整应用**
```bash
# 启动所有服务
npm run unified
```

##### 方式五：生产环境模式

```bash
# 设置生产环境变量
NODE_ENV=production npm run unified

# 或使用环境变量
NODE_ENV=production BLOCKCHAIN_ENABLED=true npm run unified
```

#### 📋 详细配置选项

##### 端口配置
```bash
# 自定义端口
PORT=8080 npm run demo
VUE_PORT=3002 npm run unified:vue
API_PORT=4000 npm run backend

# 检查端口占用
lsof -i :3000
lsof -i :3001
```

##### 调试模式
```bash
# 启用详细日志
DEBUG=true npm run unified

# 开发环境模式
NODE_ENV=development npm run unified
```

##### 区块链配置
```bash
# 启用区块链功能
BLOCKCHAIN_ENABLED=true npm run unified

# 禁用区块链功能（使用模拟数据）
BLOCKCHAIN_ENABLED=false npm run unified

# 自定义RPC地址
RPC_URL=http://localhost:7545 npm run unified
```

##### 性能优化
```bash
# 增加内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run unified

# 自定义并发数
UV_THREADPOOL_SIZE=16 npm run unified
```

### 🔧 安装和准备

#### 1. 基础环境检查
```bash
# 检查Node.js版本
node --version  # 应 >= 16.0.0
npm --version   # 应 >= 8.0.0

# 检查端口是否可用
netstat -an | grep :3000
netstat -an | grep :3001
```

#### 2. 完整安装流程
```bash
# 1. 安装主项目依赖
npm install

# 2. 安装Vue.js前端依赖
cd BS && npm install

# 3. 返回主目录
cd ..

# 4. （可选）安装区块链依赖
npm install --save-dev hardhat @nomiclabs/hardhat-ethers
```

#### 3. 区块链环境准备（可选）
```bash
# 1. 启动本地Hardhat网络
npm run node

# 2. 在新终端编译合约
npx hardhat compile

# 3. 部署合约
npm run deploy
```

### 🎯 服务状态检查

#### 检查服务是否正常运行
```bash
# 检查HTML前端
curl -s http://localhost:3000 | head -5

# 检查Vue.js前端
curl -s http://localhost:3001 | head -5

# 检查后端API
curl -s http://localhost:3000/health

# 检查区块链网络
curl -s http://localhost:8545
```

#### 查看运行进程
```bash
# 查看Node.js进程
ps aux | grep node

# 查看端口占用
netstat -tulpn | grep :300

# 查看应用日志
tail -f logs/app.log
```

## 📁 项目结构

```
demo/
├── BS/                     # Vue.js前端应用
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── views/         # 页面视图
│   │   ├── composables/   # 组合式函数
│   │   └── router/        # 路由配置
│   ├── package.json       # Vue.js依赖
│   └── vite.config.js     # Vite配置
├── frontend/              # 原生HTML前端
│   ├── app.js            # 主应用逻辑（已修复分页）
│   ├── style.css         # 样式文件（已添加分页样式）
│   └── index.html        # HTML入口
├── backend-api.js        # 统一后端API服务
├── start-unified.js      # 统一启动脚本
└── contracts/            # 智能合约（已优化）
    └── DeSciPlatform.sol # 主平台合约（已扩展）
```

## 🎨 前端特性对比

### Vue.js前端 (推荐)
- ✅ 现代化UI设计（Naive UI）
- ✅ 响应式布局
- ✅ 完整的路由系统
- ✅ 组件化架构
- ✅ TypeScript支持
- ✅ 更好的用户体验

### 原生HTML前端
- ✅ 轻量级，无需构建
- ✅ 快速加载
- ✅ 支持分页功能（新功能）
- ✅ 渐进式加载动画
- ✅ 兼容性好

## 🔧 技术栈

### 前端
- **Vue.js 3** - 现代JavaScript框架
- **Naive UI** - Vue 3组件库
- **Vite** - 快速构建工具
- **原生HTML/CSS/JS** - 轻量级实现

### 后端
- **Express.js** - Node.js Web框架
- **Ethers.js** - 以太坊交互库
- **CORS** - 跨域资源共享

### 区块链
- **Solidity** - 智能合约语言
- **Hardhat** - 以太坊开发环境
- **OpenZeppelin** - 标准合约库

## 🌟 新功能特性

### 1. 智能合约优化
- **扩展的研究结构体**：添加分类、标签、资金信息等字段
- **分页查询支持**：高效的数据分页获取
- **搜索功能**：支持标题和描述的关键词搜索
- **统计数据**：按状态和分类的详细统计
- **声誉系统**：研究质量评分机制
- **多状态管理**：Draft、UnderReview、Published、Rejected、Archived

### 2. 前端分页系统
- **完整的分页组件**：支持页码跳转、每页大小调整
- **响应式设计**：适配移动端和桌面端
- **加载动画**：平滑的用户体验
- **数据缓存**：优化性能
- **键盘导航**：支持回车键跳转页面
- **实时状态更新**：动态按钮状态和加载指示器

### 3. 统一API设计
- **RESTful接口**：标准化的API设计
- **区块链集成**：直接与智能合约交互
- **模拟数据模式**：支持无区块链环境的测试
- **错误处理**：完善的异常处理机制
- **速率限制**：防止API滥用
- **请求验证**：参数类型和范围检查

### 4. 调试和监控功能
- **详细日志系统**：分级日志记录
- **健康检查端点**：系统状态监控
- **性能监控**：内存和CPU使用情况
- **区块链状态监控**：网络连接和合约状态
- **请求追踪**：API调用记录和性能分析

## 📊 API接口文档

### 🔍 项目管理接口

#### 获取项目列表
```http
GET /api/projects
```

**查询参数：**
- `limit`: 每页数量 (默认10, 范围1-100)
- `offset`: 偏移量 (默认0, ≥0)
- `status`: 状态过滤 (0=全部, 1=Draft, 2=UnderReview, 3=Published, 4=Rejected, 5=Archived)
- `category`: 分类过滤 (0=全部, 1=Biomedical, 2=AI, 3=Climate, 4=Quantum, 5=Materials, 6=Neuroscience, 7=Other)
- `search`: 搜索关键词 (可选)

**响应格式：**
```json
{
  "data": [
    {
      "id": 1,
      "title": "研究项目标题",
      "description": "项目详细描述",
      "status": "Published",
      "category": "AI",
      "researcher": "0x...",
      "tags": "[\"machine-learning\", \"AI\"]",
      "fundingAmount": 50000,
      "fundingCurrency": "USD",
      "viewCount": 150,
      "downloadCount": 25,
      "reputationScore": 85
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true,
    "currentPage": 1,
    "totalPages": 15
  },
  "meta": {
    "source": "blockchain",
    "query": {
      "status": 0,
      "category": 2,
      "search": "machine learning"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 获取项目详情
```http
GET /api/projects/:projectId
```

#### 创建项目
```http
POST /api/projects
Content-Type: application/json

{
  "name": "量子计算研究",
  "description": "基于量子算法的机器学习优化研究",
  "visibility": "Private",
  "status": "Active",
  "category": "Quantum",
  "tags": ["quantum", "machine-learning", "optimization"],
  "fundingAmount": 100000,
  "fundingCurrency": "USD",
  "creator_wallet_address": "0x..."
}
```

### 👤 用户管理接口

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6..."
}
```

**响应：**
```json
{
  "user": {
    "wallet_address": "0x742d35Cc6...",
    "username": "researcher_alice",
    "age": 28,
    "email": "alice@university.edu",
    "ipfs_hash": "Qm...",
    "is_verified": true,
    "reputation": 85
  }
}
```

### 📈 统计和分析接口

#### 获取平台统计
```http
GET /api/stats
```

**响应：**
```json
{
  "total": 156,
  "byStatus": {
    "draft": 12,
    "underReview": 23,
    "published": 89,
    "rejected": 8,
    "archived": 24
  },
  "byCategory": {
    "biomedical": 25,
    "ai": 45,
    "climate": 18,
    "quantum": 15,
    "materials": 12,
    "neuroscience": 22,
    "other": 19
  }
}
```

### 🔧 调试和监控接口

#### 健康检查
```http
GET /health
```

**响应：**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600.5,
  "memory": {
    "rss": "45.2 MB",
    "heapTotal": "32.1 MB",
    "heapUsed": "28.5 MB"
  },
  "blockchain": {
    "connected": true,
    "rpcUrl": "http://127.0.0.1:8545"
  }
}
```

#### 调试信息
```http
GET /api/debug
```

*需要设置环境变量 `DEBUG=true` 才能访问*

#### 性能监控
```http
GET /api/performance
```

**响应：**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600.5,
  "memory": {
    "rss": "45.2 MB",
    "heapTotal": "32.1 MB",
    "heapUsed": "28.5 MB",
    "external": "2.1 MB"
  },
  "cpu": [2.5, 1.8, 3.2],
  "pid": 12345,
  "platform": "darwin"
}
```

#### 区块链状态
```http
GET /api/blockchain/status
```

**响应：**
```json
{
  "connected": true,
  "network": {
    "name": "hardhat",
    "chainId": 31337
  },
  "blockNumber": 1250,
  "gasPrice": "2000000000",
  "contracts": {
    "platform": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    "userProfile": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "nft": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "dataset": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
}
```

#### API版本信息
```http
GET /api/version
```

### ⚠️ 错误响应格式

所有API错误都遵循统一的格式：

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "参数错误",
    "details": "limit必须是1-100之间的数字"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🚦 状态码说明

- `200`: 请求成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `429`: 请求过于频繁（速率限制）
- `500`: 服务器内部错误

## ⚙️ 环境配置

### 环境变量

创建 `.env` 文件或直接设置环境变量：

```bash
# 调试模式
DEBUG=true
NODE_ENV=development

# 服务器配置
PORT=3000

# 区块链配置
BLOCKCHAIN_ENABLED=true
RPC_URL=http://127.0.0.1:8545

# CORS配置
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# 数据库配置（如果使用）
DATABASE_URL=postgresql://user:password@localhost:5432/desci_db
```

### 配置说明

- **DEBUG**: 启用调试模式，显示详细日志和调试端点
- **BLOCKCHAIN_ENABLED**: 启用/禁用区块链功能
- **RPC_URL**: 以太坊RPC节点地址
- **CORS_ORIGIN**: 允许的跨域来源（多个用逗号分隔）

## 🔍 调试功能

### 启用调试模式

```bash
# 方式1：环境变量
DEBUG=true npm run backend

# 方式2：启动脚本参数
NODE_ENV=development npm run backend
```

### 调试端点

#### 健康检查
```bash
curl http://localhost:3000/health
```

#### 调试信息（需要DEBUG=true）
```bash
curl http://localhost:3000/api/debug
```

#### 性能监控
```bash
curl http://localhost:3000/api/performance
```

#### 区块链状态
```bash
curl http://localhost:3000/api/blockchain/status
```

### 日志级别

系统使用分级日志系统：

- **ℹ️ INFO**: 一般信息
- **⚠️ WARN**: 警告信息
- **❌ ERROR**: 错误信息
- **🔍 DEBUG**: 调试信息（仅在调试模式下显示）

### 浏览器调试

1. **Vue.js应用**: 打开浏览器开发者工具查看Vue DevTools
2. **HTML应用**: 使用浏览器控制台查看日志
3. **网络监控**: 查看Network标签页中的API请求

## 🛠️ 故障排除

### Vue.js应用启动失败

**问题**: Web3Modal或其他依赖无法解析

**解决方法**:
```bash
# 清理依赖并重新安装
cd BS
rm -rf node_modules package-lock.json
npm install

# 检查依赖版本
npm list web3modal dayjs vuedraggable
```

### 区块链连接失败

**问题**: 后端显示"区块链连接失败"

**解决方法**:
```bash
# 1. 启动Hardhat本地网络
npm run node

# 2. 检查RPC地址
curl http://127.0.0.1:8545

# 3. 使用模拟模式
BLOCKCHAIN_ENABLED=false npm run backend
```

### API请求失败

**问题**: 前端无法获取数据

**解决方法**:
```bash
# 1. 检查后端是否运行
curl http://localhost:3000/health

# 2. 检查CORS设置
curl -H "Origin: http://localhost:3001" http://localhost:3000/api/projects

# 3. 查看详细错误日志
DEBUG=true npm run backend
```

### 分页功能异常

**问题**: 分页组件不工作或显示错误

**解决方法**:
```bash
# 1. 检查浏览器控制台错误
# 2. 验证JavaScript文件加载
curl http://localhost:3000/app.js

# 3. 检查CSS样式加载
curl http://localhost:3000/style.css
```

### 性能问题

**问题**: 应用运行缓慢

**解决方法**:
```bash
# 1. 检查内存使用
curl http://localhost:3000/api/performance

# 2. 监控API响应时间
curl -w "@curl-format.txt" http://localhost:3000/api/projects

# 3. 启用调试模式查看详细日志
DEBUG=true npm run unified
```

## 📈 监控和维护

### 系统监控

```bash
# 实时监控健康状态
watch -n 5 curl http://localhost:3000/health

# 监控性能指标
watch -n 10 curl http://localhost:3000/api/performance
```

### 日志分析

```bash
# 查看应用日志
tail -f /var/log/desci-app.log

# 搜索错误日志
grep "ERROR" /var/log/desci-app.log

# 统计API调用
grep "GET /api" /var/log/desci-app.log | wc -l
```

### 备份和恢复

```bash
# 备份配置
cp .env .env.backup

# 备份数据（如果使用数据库）
pg_dump desci_db > backup.sql

# 恢复数据
psql desci_db < backup.sql
```

## 🔄 更新和维护

### 依赖更新

```bash
# 更新主项目依赖
npm update

# 更新Vue.js依赖
cd BS && npm update

# 检查安全漏洞
npm audit
npm audit fix
```

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重启服务
npm run unified
```

### 数据库迁移（如果适用）

```bash
# 创建迁移
npm run migration:create add_user_reputation

# 运行迁移
npm run migration:up

# 回滚迁移
npm run migration:down
```

## 🔐 智能合约接口

### 主要函数

#### 发布研究
```solidity
function publishResearch(
    string memory _title,
    string memory _description,
    string memory _datasetHash,
    string memory _metadataHash,
    ResearchCategory _category,
    string memory _tags,
    uint256 _fundingAmount,
    string memory _fundingCurrency,
    string memory _tokenURI
) external returns (uint256)
```

#### 分页查询
```solidity
function getResearchesPaginated(
    uint8 _status,
    uint8 _category,
    uint256 _limit,
    uint256 _offset
) external view returns (uint256[] memory researchIds, uint256 totalCount)
```

#### 搜索研究
```solidity
function searchResearches(
    string memory _keyword,
    uint256 _limit,
    uint256 _offset
) external view returns (uint256[] memory researchIds, uint256 totalCount)
```

## 🎯 使用指南

### 1. 环境准备
```bash
# 安装依赖
npm install

# 安装Vue.js前端依赖
cd BS && npm install

# 启动Hardhat本地网络（可选）
npm run node
```

### 2. 启动系统
```bash
# 方式一：启动所有服务
npm run unified

# 方式二：分别启动
npm run backend          # 启动后端API
cd BS && npm run dev     # 启动Vue.js前端
npm run demo             # 启动HTML前端
```

### 3. 访问应用
- **Vue.js前端**: http://localhost:3001
- **HTML前端**: http://localhost:3000
- **API文档**: http://localhost:3000/api/

### 4. 开发调试
```bash
# 查看服务状态
npm run status

# 重新编译合约
npm run compile

# 本地部署合约
npm run deploy
```

## 🛠️ 故障排除

### Vue.js前端启动失败
```bash
cd BS
npm install
npm run dev
```

### 区块链连接失败
- 确保Hardhat本地网络正在运行：`npm run node`
- 检查合约地址是否正确
- 系统会自动切换到模拟数据模式

### 分页功能异常
- 检查浏览器控制台错误
- 确认JavaScript文件已正确加载
- 尝试刷新页面

### API请求失败
- 确认后端服务正在运行
- 检查端口是否被占用
- 查看控制台错误日志

## 📈 性能优化

### 前端优化
- **组件懒加载**: Vue.js应用支持路由级别的代码分割
- **分页加载**: 大数据集采用分页加载，减少初始加载时间
- **缓存策略**: 合理使用浏览器缓存和内存缓存

### 后端优化
- **并发处理**: 使用Promise.all处理多个区块链调用
- **错误恢复**: 区块链连接失败时自动切换到模拟数据
- **数据压缩**: API响应数据经过优化处理

### 区块链优化
- **批量查询**: 减少区块链调用次数
- **事件监听**: 实时监听合约事件更新
- **Gas优化**: 合约函数经过Gas消耗优化

## 🔄 更新日志

### v2.0.0 (最新)
- ✨ 添加Vue.js现代化前端
- ✨ 实现完整的分页系统
- ✨ 优化智能合约数据结构
- ✨ 统一前后端API设计
- 🐛 修复初始化卡住问题
- 🎨 改进用户界面设计

### v1.0.0
- 🎯 初始版本发布
- 🔗 基础区块链集成
- 📊 简单的数据展示

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目主页: [GitHub Repository]
- 问题反馈: [Issues]
- 邮箱: desci-team@example.com

---

**🎉 感谢使用 DeSci Platform！让我们一起构建去中心化科学的未来！**
