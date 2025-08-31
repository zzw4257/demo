# 🚀 DeSci Platform 快速启动指南

## ⚡ 最快速开始（推荐）

### 一键完整环境（新手首选）
```bash
# 1. 进入项目目录
cd demo

# 2. 一键设置并启动
npm run setup:local
npm run local:dev
```

**立即访问：**
- 🌐 **前端应用**: http://localhost:3000
- 🔧 **后端API**: http://localhost:3001
- ⛓️ **区块链网络**: http://localhost:8545

### 简单演示模式
```bash
# 只启动前端演示
npm run demo
```
访问：http://localhost:3000

## 🛠️ 核心工作流

### 开发工作流
```bash
# 1. 编译智能合约
npm run compile

# 2. 部署合约到本地网络
npm run deploy:local

# 3. 启动前端演示
npm run demo

# 完整流程（一步到位）
npm run local:quick
```

### 测试工作流
```bash
# 运行所有测试
npm run test:all

# API功能测试
npm run test:api

# 完整验证
npm run validate
```

### 生产部署
```bash
# 启动生产环境
npm run production

# 检查生产状态
npm run production:status
```

---

## 📚 脚本参考

📖 **完整npm脚本列表**: [SCRIPTS.md](./SCRIPTS.md)
📖 **本地开发指南**: [LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md)

---

## 🔧 环境配置

### 系统要求
- **Node.js**: 18.0.0+
- **内存**: 4GB RAM
- **磁盘**: 5GB 可用空间

### 端口使用
- **前端**: 3000
- **API**: 3001
- **区块链**: 8545

### 自定义端口
```bash
# 使用不同端口启动
PORT=8080 npm run demo
```

---

## 📋 服务状态检查

```bash
# 检查所有服务状态
npm run status:local

# 单独检查健康状态
npm run health

# 查看进程
ps aux | grep node
```

---

## 🆘 常见问题

### 端口被占用
```bash
# 检查端口使用情况
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

### 启动失败
```bash
# 重新安装依赖
npm run setup:local

# 清理缓存
npm run clean
npm install
```

### 区块链连接问题
```bash
# 检查区块链网络
curl http://localhost:8545

# 重启区块链服务
npm run stop:local && npm run local:dev
```

---

## 📚 更多文档

- 📖 [本地开发完整指南](./LOCAL_DEVELOPMENT_GUIDE.md)
- 📖 [所有npm脚本详解](./SCRIPTS.md)
- 📖 [生产环境部署](./PRODUCTION_READINESS_REPORT.md)
