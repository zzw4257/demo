# Hardhat + Ethereum Demo Environment

这是一个最简单的 Hardhat + 以太坊开发环境示例。

## 项目结构

```
demo/
├── contracts/          # 智能合约
│   └── Greeter.sol     # 简单的问候合约
├── scripts/            # 部署脚本
│   └── deploy.js       # 部署脚本
├── test/               # 测试文件
│   └── Greeter.test.js # 合约测试
├── hardhat.config.js   # Hardhat配置
└── package.json        # 项目依赖
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 编译合约
```bash
npm run compile
```

### 3. 运行测试
```bash
npm run test
```

### 4. 启动本地节点
```bash
npm run node
```

### 5. 部署合约（新终端）
```bash
npm run deploy
```

## 合约说明

`Greeter.sol` 是一个简单的智能合约，包含：
- `greet()`: 返回当前问候语
- `setGreeting(string)`: 设置新的问候语

## 网络配置

- 本地网络: `http://127.0.0.1:8545`
- Chain ID: 1337
