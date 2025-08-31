# DeSci区块链层开发文档

## 项目概述

### 项目目的
本项目是DeSci（去中心化科学）平台的区块链底层实现，旨在构建一个透明、可信的科学研究生态系统。平台通过区块链技术实现：

1. **科研成果确权** - 使用NFT对科研成果进行唯一标识和确权
2. **同行评审机制** - 基于声誉系统的去中心化同行评审
3. **数据集管理** - 安全可控的数据集访问和版本控制
4. **零知识证明验证** - 保护隐私的证明系统
5. **用户身份管理** - 去中心化的科研人员身份认证和声誉系统

### 核心价值
- **透明性**: 所有科研过程在区块链上可追溯
- **去中心化**: 消除中心化机构的控制和审查
- **激励机制**: 基于声誉和贡献的奖励系统
- **数据安全**: 保护敏感科研数据的安全访问
- **学术诚信**: 通过ZK证明确保研究结果的真实性

## 技术架构

### 技术栈
```
Solidity: ^0.8.28
Hardhat: ^2.26.1
OpenZeppelin: ^5.0.0
Ethers.js: v6
Node.js: 开发环境
```

### 核心合约模块

#### 1. UserProfile.sol - 用户档案管理合约
**功能**: 用户注册、身份验证、声誉管理
**核心结构**:
```solidity
struct Profile {
    string fullName;
    uint256 age;
    string email;
    string ipfsHash;
    bool isVerified;
    uint256 reputation;
}
```

#### 2. ZKProof.sol - 零知识证明验证合约
**功能**: 零知识证明的提交、验证和管理
**核心结构**:
```solidity
struct Proof {
    address submitter;
    string proofType;
    uint256[8] proof;
    uint256[2] publicInputs;
    bool isVerified;
}
```

#### 3. Dataset.sol - 数据集存证与访问控制合约
**功能**: 数据集注册、版本控制、访问权限管理
**核心结构**:
```solidity
struct DatasetInfo {
    string name;
    string description;
    address owner;
    string dataHash;
    bool isPublic;
    uint256 accessPrice;
    string[] tags;
}
```

#### 4. DeSciNFT.sol - 科研成果NFT合约
**功能**: 科研成果NFT铸造、引用追踪、影响力评分
**核心结构**:
```solidity
struct ResearchNFT {
    string title;
    string description;
    address researcher;
    string researchType;
    uint256 citationCount;
    uint256 impactScore;
}
```

#### 5. DeSciPlatform.sol - 平台主合约
**功能**: 协调各模块，处理科研发布和评审流程
**核心结构**:
```solidity
struct Research {
    uint256 id;
    string title;
    address researcher;
    uint256 datasetId;
    uint256 nftTokenId;
    uint256[] zkProofIds;
    ResearchStatus status;
}
```

## 项目状态

### ✅ 已完成功能

#### 1. 核心合约实现
- **UserProfile.sol**: 用户管理系统（注册、验证、声誉）
- **ZKProof.sol**: 零知识证明框架（提交、验证、多类型支持）
- **Dataset.sol**: 数据集管理（注册、访问控制、付费机制）
- **DeSciNFT.sol**: ERC721 NFT合约（铸造、引用追踪）
- **DeSciPlatform.sol**: 平台集成（科研发布、同行评审）

#### 2. 安全特性
- 重入攻击防护（ReentrancyGuard）
- 访问控制（Ownable, AccessControl）
- 输入验证和事件日志

#### 3. 测试覆盖
- UserProfile: 21/21 测试通过
- 集成测试: 6/6 核心流程通过
- NFT功能测试通过

#### 4. 部署配置
- 多合约部署脚本
- 环境配置模板
- 测试网/主网支持

## 快速检查

### 编译验证
```bash
npx hardhat compile
```

### 测试运行
```bash
npx hardhat test
npm run test:userprofile  # 用户测试
npm run test:platform     # 平台集成测试
```

### 部署检查
```bash
npm run deploy           # 本地部署
npm run deploy:sepolia   # 测试网部署
```

## 快速开始

### 环境设置
```bash
# 安装依赖
npm install

# 环境配置
cp .env.example .env
# 编辑.env文件
```

### 本地开发
```bash
# 编译合约
npm run compile

# 运行测试
npm run test

# 启动本地节点
npm run node

# 部署合约（新终端）
npm run deploy
```

### 测试网部署
```bash
npm run deploy:sepolia   # Sepolia测试网
npm run deploy:mainnet   # 主网部署
```

### 前端集成示例
```javascript
// 连接合约
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(address, abi, signer);

// 用户注册
await contract.createProfile(name, age, email, ipfsHash);

// 发布研究
await contract.publishResearch(
  title, description, datasetName, datasetDesc,
  dataHash, metadataHash, zkProofIds, isPublic, price
);
```

## 维护指南

- **每周**: 运行测试套件
- **每月**: 安全审计检查
- **每季度**: 性能优化分析

---

**项目状态**: ✅ **完全可用**
