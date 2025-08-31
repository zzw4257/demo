# 🚀 DeSci Platform - 去中心化科研平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.28-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-^2.26.1-yellow)](https://hardhat.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

> 🌟 **去中心化科研平台**: 支持智能合约、NFT认证、零知识证明的完整科研生态系统

## ⚡ 快速开始

### 🚀 一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd demo

# 一键设置环境并启动
npm run setup:local
npm run local:dev
```

### 📋 系统要求

- **Node.js**: ≥18.0.0
- **npm**: ≥8.0.0
- **内存**: ≥4GB RAM
- **磁盘**: ≥5GB 可用空间

### 🌐 访问地址

启动后访问：
- 🌐 **前端应用**: http://localhost:3000
- 🔧 **后端API**: http://localhost:3001
- ⛓️ **区块链网络**: http://localhost:8545

---

## 🛠️ 核心命令

```bash
# 🚀 快速开始
npm run setup:local      # 一键环境设置
npm run local:dev        # 启动完整开发环境
npm run status:local     # 检查服务状态

# 🧪 测试和验证
npm run test:all         # 运行所有测试
npm run validate         # 完整验证

# 🚀 生产部署
npm run production       # 启动生产环境
```

## ✨ 核心特性

### 🎯 去中心化科研生态
- **智能合约平台**: 基于Solidity的完整科研合约系统
- **用户管理系统**: 研究者身份验证和声誉系统
- **数据集管理**: 支持公共和私有数据集的发布与访问控制
- **零知识证明**: 隐私保护的证明验证系统
- **NFT研究证书**: 基于ERC721的研究成果NFT化
- **同行评议系统**: 去中心化的同行评议流程

### 🔗 区块链集成
- **实时区块链监控**: 区块高度、Gas价格、网络状态
- **智能合约交互**: 完整的合约调用和事件监听
- **交易追踪**: 详细的交易历史和状态查询
- **多网络支持**: 本地Hardhat网络和测试网部署

### 📊 数据可视化
- **实时仪表板**: 用户增长、研究统计、性能指标
- **交互式图表**: Chart.js驱动的可视化分析
- **区块链浏览器**: 集成式的区块链状态查看

## 🏗️ 项目架构

### 技术栈
- **智能合约**: Solidity ^0.8.28 + OpenZeppelin ^5.0.0
- **前端**: HTML5 + CSS3 + JavaScript (ES6+) + Vue.js 3
- **后端**: Node.js + Express.js
- **区块链工具**: Hardhat ^2.26.1 + Ethers.js v6
- **测试**: Chai + Mocha

### 智能合约模块

| 合约 | 功能 | 状态 |
|------|------|------|
| `UserProfile.sol` | 用户档案管理 | ✅ 完成 |
| `Dataset.sol` | 数据集发布与访问控制 | ✅ 完成 |
| `ZKProof.sol` | 零知识证明验证 | ✅ 完成 |
| `DeSciNFTSimple.sol` | 研究成果NFT | ✅ 完成 |
| `DeSciPlatform.sol` | 平台核心逻辑 | ✅ 完成 |

## 📁 项目结构

```
demo/
├── 📄 README.md                    # 项目说明
├── 📄 QUICKSTART.md               # 快速开始指南
├── 📄 LOCAL_DEVELOPMENT_GUIDE.md  # 本地开发指南
├── 📄 SCRIPTS.md                  # NPM脚本使用指南
├── 📄 DEVELOPMENT_DOCUMENTATION.md # 技术文档
├── 📦 package.json                # 项目配置
├── 🔧 hardhat.config.js           # Hardhat配置
├── 🌐 frontend/                   # 前端代码
│   ├── 📄 index.html             # 主页面
│   ├── 🎨 style.css              # 样式文件
│   ├── ⚙️  app.js                # 应用逻辑
│   └── 📊 mock-data.js           # 模拟数据
├── 📋 contracts/                 # 智能合约
│   ├── 👤 UserProfile.sol        # 用户管理
│   ├── 📊 Dataset.sol            # 数据集管理
│   ├── 🔐 ZKProof.sol            # 零知识证明
│   ├── 🎨 DeSciNFTSimple.sol     # NFT合约
│   └── 🏛️  DeSciPlatform.sol     # 主平台合约
├── 📜 scripts/                   # 脚本目录
│   ├── 📄 README.md              # 脚本目录说明
│   ├── 🚀 startup/               # 启动脚本
│   ├── 🧪 test/                  # 测试脚本
│   └── 🔧 utility/               # 工具脚本
├── 🧪 test/                      # 测试目录
│   ├── 📋 *.test.js              # 合约测试文件
│   └── 🌐 html/                  # HTML测试文件
└── 🎨 BS/                        # Vue.js前端（可选）

## 🚀 快速启动

### 方法一：一键启动（推荐）
```bash
# 启动演示模式
./start.sh

# 启动开发环境
./start.sh dev

# 启动生产环境
./start.sh prod
```

### 方法二：使用npm脚本
```bash
# 启动演示模式
npm run start

# 启动开发环境
npm run start:dev

# 启动生产环境
npm run start:prod
```

### 方法三：传统方式
```bash
# 环境设置
npm run setup:local

# 启动服务
npm run local:dev
```

## 📊 服务状态管理

```bash
# 检查服务状态
./status.sh
npm run status

# 停止所有服务
./stop.sh
npm run stop
```
```

## 📝 开发指南

```bash
# 编译智能合约
npm run compile

# 运行测试
npm run test

# 部署到本地网络
npm run deploy:hardhat

# 启动开发环境
npm run local:dev
```

### 🐛 故障排除

**端口冲突**: 检查端口占用 `lsof -i :3000`，或使用 `PORT=3002 npm run demo`

**依赖问题**: 清理缓存 `npm cache clean --force` 后重新安装

**区块链连接**: 确保Hardhat网络运行 `npm run node` 后再部署合约

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">
🌟 如果这个项目对你有帮助，请给我们一个 Star！🌟
</div>