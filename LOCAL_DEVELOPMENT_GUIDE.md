# 🚀 DeSci Platform 本地开发环境完整指南

## 📋 概述

本文档提供了完整的本地开发环境设置和使用指南，帮助开发者快速搭建和使用 DeSci Platform 的本地开发环境。

## ⚡ 快速开始

### 方法一：一键设置（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd desci-platform

# 一键设置本地开发环境
npm run setup:local

# 启动完整开发环境
npm run local:dev
```

### 方法二：手动设置

```bash
# 1. 克隆项目
git clone <repository-url>
cd desci-platform

# 2. 安装依赖
npm install

# 3. 编译智能合约
npm run compile

# 4. 启动开发环境
npm run local:dev
```

## 🏗️ 架构说明

### 本地开发环境架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   (Port 8545)   │
│                 │    │                 │    │                 │
│ • React/Vue应用 │    │ • Express.js    │    │ • Hardhat Node  │
│ • 区块链交互   │    │ • REST API      │    │ • 智能合约      │
│ • 数据可视化   │    │ • 数据库连接    │    │ • 测试账户      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 服务说明

#### 1. 前端服务 (Port 3000)
- **技术栈**: HTML5, CSS3, JavaScript (ES6+), Ethers.js
- **功能**: 用户界面、区块链交互、数据可视化
- **特点**: 响应式设计、现代化UI、实时更新

#### 2. 后端API服务 (Port 3001)
- **技术栈**: Node.js, Express.js, CORS
- **功能**: REST API、智能合约数据获取、缓存管理
- **特点**: 轻量级、高性能、易扩展

#### 3. 本地区块链网络 (Port 8545)
- **技术栈**: Hardhat, Solidity, OpenZeppelin
- **功能**: 本地以太坊网络、智能合约部署、交易处理
- **特点**: 快速启动、测试账户预设、事件监听

## 📋 系统要求

### 最低要求
- **操作系统**: macOS 10.15+, Ubuntu 18.04+, Windows 10+
- **Node.js**: 18.0.0 或更高版本
- **内存**: 4GB RAM
- **磁盘空间**: 5GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **操作系统**: macOS 12+, Ubuntu 20.04+, Windows 11
- **Node.js**: 20.x LTS 版本
- **内存**: 8GB RAM 或更多
- **磁盘空间**: 20GB+ SSD 存储
- **CPU**: 至少双核处理器

## 🔧 环境设置详解

### 1. Node.js 和 npm 安装

#### macOS
```bash
# 使用 Homebrew
brew install node

# 或者使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### Ubuntu/Debian
```bash
# 使用官方仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或者使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### Windows
```powershell
# 使用 winget
winget install OpenJS.NodeJS

# 或者从官网下载安装包
# https://nodejs.org/
```

### 2. 项目依赖安装

```bash
# 安装项目依赖
npm install

# 验证安装
npm list --depth=0
```

### 3. 环境配置

创建 `.env` 文件：

```bash
# 复制环境配置模板
cp .env.production .env

# 编辑配置（可选）
nano .env
```

环境变量说明：
```env
# 开发环境配置
NODE_ENV=development
DEBUG=true

# 服务端口
PORT=3000
API_PORT=3001

# 区块链配置
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_ENABLED=true
CHAIN_ID=1337

# 其他配置
LOG_LEVEL=debug
AUTO_OPEN_BROWSER=true
```

## 🚀 启动和使用

### 1. 启动完整开发环境

```bash
# 使用npm脚本（推荐）
npm run local:dev

# 或者使用bash脚本
./quick-start.sh
```

### 2. 分步启动（调试用）

```bash
# 终端1: 启动区块链网络
npm run node

# 终端2: 部署智能合约
npm run deploy:local

# 终端3: 启动后端API
npm run backend

# 终端4: 启动前端服务
npm run demo
```

### 3. 访问应用

启动成功后，访问以下地址：

- 🌐 **前端应用**: http://localhost:3000
- 🔧 **API文档**: http://localhost:3001/api
- ⛓️ **区块链浏览器**: http://localhost:8545
- 📊 **Hardhat控制台**: 在区块链终端中运行 `npx hardhat console`

## 🛠️ 开发工具和命令

### 服务管理

```bash
# 检查服务状态
npm run status:local
./check-status.sh

# 停止所有服务
npm run stop:local
./stop-services.sh

# 重启服务
npm run local:dev:debug
```

### 开发命令

```bash
# 编译智能合约
npm run compile

# 运行测试
npm run test
npm run test:contracts

# 代码检查
npm run lint

# 清理缓存
npm run clean
```

### 调试模式

```bash
# 启用调试日志
npm run local:dev:debug

# 查看详细日志
tail -f logs/dev.log
tail -f blockchain.log
tail -f api.log
tail -f frontend.log
```

## 🔍 故障排除

### 常见问题

#### 1. 端口占用
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001
lsof -i :8545

# 杀死占用进程
kill -9 <PID>
```

#### 2. 依赖安装失败
```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. 合约编译失败
```bash
# 清理Hardhat缓存
npm run clean
npm run compile
```

#### 4. 前端无法连接区块链
```bash
# 检查区块链网络状态
curl http://localhost:8545

# 重启区块链网络
npm run stop:local
npm run local:dev
```

### 日志分析

```bash
# 查看所有日志
tail -f logs/*.log

# 搜索错误信息
grep -r "ERROR" logs/
grep -r "failed" logs/

# 查看区块链事件
tail -f blockchain.log | grep -i "event"
```

## 📊 性能监控

### 系统资源监控

```bash
# CPU和内存使用率
top -p $(pgrep -f "node.*start-demo.js")

# 磁盘使用情况
df -h

# 网络连接
netstat -tlnp | grep :3000
```

### 应用性能监控

```bash
# API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health

# 区块链连接状态
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

## 🔧 高级配置

### 自定义区块链网络

修改 `hardhat.config.js`：

```javascript
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 20000000000, // 20 gwei
      accounts: {
        mnemonic: "your custom mnemonic",
        count: 10
      }
    }
  }
}
```

### 数据库集成

添加数据库支持：

```bash
# 安装数据库依赖
npm install mongoose mongodb

# 配置数据库连接
# 编辑 .env 文件添加数据库URL
DATABASE_URL=mongodb://localhost:27017/desci_dev
```

### HTTPS 配置

启用HTTPS：

```bash
# 生成SSL证书
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# 配置环境变量
HTTPS=true
SSL_CERT_PATH=./cert.pem
SSL_KEY_PATH=./key.pem
```

## 🚀 部署到生产环境

### Docker 部署

```bash
# 构建镜像
docker build -t desci-platform .

# 运行容器
docker run -d -p 3000:3000 --name desci-platform desci-platform
```

### 传统部署

```bash
# 安装PM2进程管理器
npm install -g pm2

# 启动生产环境
npm run production

# 使用PM2管理
pm2 start ecosystem.config.js
```

## 📚 学习资源

### 官方文档
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Solidity Documentation](https://soliditylang.org/docs)

### 开发工具
- [MetaMask](https://metamask.io/) - 浏览器钱包
- [Remix IDE](https://remix.ethereum.org/) - Solidity在线编辑器
- [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers/docs/overview)

### 社区资源
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [OpenZeppelin Forum](https://forum.openzeppelin.com/)
- [Hardhat Discord](https://discord.gg/hardhat)

## 🤝 贡献指南

### 开发流程
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 使用 ESLint 和 Prettier
- 编写完整的测试用例
- 更新相关文档
- 遵循现有的代码风格

## 📞 支持

### 获取帮助
- 📧 **邮件**: support@desci-platform.com
- 💬 **论坛**: forum.desci-platform.com
- 📚 **文档**: docs.desci-platform.com
- 🐛 **问题**: github.com/desci-platform/issues

### 常见问题
1. **Q: 前端无法连接区块链？**
   A: 检查区块链网络是否正在运行，确认端口配置正确。

2. **Q: 合约部署失败？**
   A: 确保Hardhat配置正确，检查网络连接和账户余额。

3. **Q: 内存不足错误？**
   A: 增加Node.js内存限制：`node --max-old-space-size=4096`

---

## 🎉 总结

通过本指南，您已经掌握了：

✅ **环境设置**: 完整的本地开发环境配置
✅ **服务管理**: 前端、后端、区块链的协调启动
✅ **开发工具**: 调试、测试、监控的完整工具链
✅ **故障排除**: 常见问题的诊断和解决方法
✅ **性能优化**: 系统性能监控和优化技巧
✅ **生产部署**: 从开发到生产的完整流程

现在您可以开始在本地开发环境中体验和开发 DeSci Platform 的强大功能了！

如有任何问题，请参考本文档或寻求社区帮助。祝您开发愉快！ 🚀
