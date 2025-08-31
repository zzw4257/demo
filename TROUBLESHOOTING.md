# 🚨 DeSci平台故障排除指南

## 应用初始化失败问题

### 问题1: "应用初始化失败，请检查网络连接"

#### 可能原因：
1. **MetaMask未连接到正确的网络**
2. **本地区块链网络未启动**
3. **合约地址配置错误**
4. **MetaMask权限不足**

#### 解决方案：

##### 方法1：使用本地区块链网络（推荐）
```bash
# 1. 启动本地Hardhat网络
npm run local

# 2. 在新终端窗口部署合约
npm run deploy:local

# 3. 启动演示
npm run demo

# 或者使用一键命令
npm run full-demo
```

##### 方法2：配置MetaMask连接本地网络
1. 打开MetaMask扩展
2. 点击网络下拉菜单
3. 选择"添加网络"或"添加自定义网络"
4. 输入以下信息：
   - **网络名称**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **链ID**: 31337
   - **货币符号**: ETH
5. 保存并切换到这个网络

##### 方法3：检查合约地址
确保`frontend/app.js`中的合约地址正确：
```javascript
const CONTRACT_ADDRESSES = {
    UserProfile: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    ZKProof: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    DeSciNFTSimple: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    Dataset: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    DeSciPlatform: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
};
```

### 问题2: "Cannot find module 'open'"

#### 解决方案：
```bash
# 安装缺失的依赖
npm install open
```

### 问题3: "用户拒绝连接钱包"

#### 解决方案：
1. 确保MetaMask已解锁
2. 刷新页面重新尝试连接
3. 检查MetaMask是否正确安装

### 问题4: 演示无法启动

#### 检查步骤：
1. **确认依赖安装**：
   ```bash
   npm install
   ```

2. **检查端口占用**：
   ```bash
   # 检查3000端口是否被占用
   lsof -i :3000
   # 如果被占用，杀死进程
   kill -9 <PID>
   ```

3. **检查文件权限**：
   ```bash
   # 确保脚本有执行权限
   chmod +x start-demo.js
   ```

## 调试信息

### 开启浏览器开发者工具
1. 按`F12`或右键选择"检查元素"
2. 切换到"Console"标签页
3. 查看详细错误信息
4. 寻找包含"Error"或"Failed"的消息

### 常见调试信息
```
✅ 开始连接钱包...
✅ 请求钱包连接...
✅ 钱包连接成功，账户: ["0x..."]
✅ 创建provider...
✅ 获取signer...
✅ 获取账户地址...
✅ 账户地址: 0x...
✅ 钱包连接完成
```

## 快速修复脚本

创建`fix-demo.sh`脚本：

```bash
#!/bin/bash

echo "🔧 修复DeSci演示环境..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm install

# 2. 编译合约
echo "⚙️ 编译合约..."
npm run compile

# 3. 启动本地网络
echo "🌐 启动本地区块链网络..."
npm run local &
LOCAL_PID=$!

# 等待网络启动
sleep 5

# 4. 部署合约
echo "🚀 部署合约..."
npm run deploy

# 5. 启动演示
echo "🎬 启动演示..."
npm run demo &
DEMO_PID=$!

echo "✅ 演示环境修复完成！"
echo "📱 请访问: http://localhost:3000"
echo "🔗 本地网络PID: $LOCAL_PID"
echo "🎭 演示PID: $DEMO_PID"

# 清理函数
cleanup() {
    echo "🧹 清理进程..."
    kill $LOCAL_PID 2>/dev/null
    kill $DEMO_PID 2>/dev/null
    exit
}

# 监听中断信号
trap cleanup SIGINT SIGTERM

# 等待用户中断
wait
```

### 使用修复脚本：
```bash
chmod +x fix-demo.sh
./fix-demo.sh
```

## 环境检查清单

- [ ] Node.js >= 14.0.0
- [ ] npm 正常工作
- [ ] Hardhat 已安装
- [ ] MetaMask 已安装
- [ ] 本地网络运行在 8545 端口
- [ ] 演示服务器运行在 3000 端口
- [ ] 合约已部署到本地网络
- [ ] MetaMask 连接到本地网络

## 获取帮助

如果问题仍然存在：

1. **检查控制台错误信息**
2. **确认网络配置正确**
3. **尝试重新启动所有服务**
4. **查看浏览器开发者工具**

---

**💡 提示**: 如果遇到网络问题，优先使用本地Hardhat网络，这样不需要外部依赖！
