#!/usr/bin/env node

/**
 * DeSci智能合约功能测试脚本
 * 用于验证所有合约功能是否正常工作
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
    network: {
        url: process.env.RPC_URL || 'http://127.0.0.1:8545',
        chainId: 31337
    },
    contracts: {
        UserProfile: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        ZKProof: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        DeSciNFTSimple: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        Dataset: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
        DeSciPlatform: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
    },
    debug: process.env.DEBUG === 'true',
    testAccount: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
};

// 日志工具
const logger = {
    info: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    success: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message, data) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ❌ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    warn: (message, data) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] ⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
};

// 全局变量
let provider;
let signer;
let contracts = {};

/**
 * 初始化区块链连接
 */
async function initBlockchain() {
    try {
        logger.info('初始化区块链连接...', { rpcUrl: config.network.url });

        // 连接到区块链网络
        provider = new ethers.providers.JsonRpcProvider(config.network.url);

        // 测试连接
        const network = await provider.getNetwork();
        logger.success('区块链连接成功', {
            network: network.name,
            chainId: network.chainId
        });

        // 获取签名者
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            signer = provider.getSigner(accounts[0]);
            logger.info('使用账户:', accounts[0]);
        } else {
            logger.warn('未找到可用账户，使用默认账户');
            signer = provider.getSigner();
        }

        return true;
    } catch (error) {
        logger.error('区块链连接失败:', error.message);
        return false;
    }
}

/**
 * 加载合约ABI
 */
function loadContractABI(contractName) {
    try {
        // 从已编译的合约中读取ABI
        const artifactPath = path.join(__dirname, 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            return artifact.abi;
        }

        // 如果找不到，使用简化的ABI
        logger.warn(`未找到${contractName}的ABI文件，使用简化版本`);
        return getSimplifiedABI(contractName);
    } catch (error) {
        logger.error(`加载${contractName} ABI失败:`, error.message);
        return getSimplifiedABI(contractName);
    }
}

/**
 * 获取简化的ABI（用于测试）
 */
function getSimplifiedABI(contractName) {
    const abis = {
        UserProfile: [
            "function createProfile(string memory _fullName, uint256 _age, string memory _email, string memory _ipfsHash) external",
            "function getProfile(address _user) external view returns (tuple(string fullName, uint256 age, string email, string ipfsHash, bool isVerified, uint256 createdAt, uint256 updatedAt, uint256 reputation))",
            "function hasProfile(address _user) external view returns (bool)",
            "function verifyProfile(address _user, bool _verified) external",
            "function getTotalUsers() external view returns (uint256)"
        ],
        ZKProof: [
            "function submitProof(string memory _proofType, uint256[8] memory _proof, uint256[2] memory _publicInputs, string memory _metadataHash) external returns (uint256)",
            "function getProof(uint256 _proofId) external view returns (tuple(address submitter, string proofType, uint256[8] proof, uint256[2] publicInputs, bool isVerified, uint256 submittedAt, uint256 verifiedAt, string metadataHash))",
            "function verifyProof(uint256 _proofId, bool _isValid) external",
            "function getTotalProofs() external view returns (uint256)"
        ],
        DeSciNFTSimple: [
            "function mintResearchNFT(address to, string memory title, string memory description, string memory uri, string memory researchType) external returns (uint256)",
            "function getResearchNFT(uint256 tokenId) external view returns (tuple(string title, string description, address researcher, uint256 createdAt, string researchType, uint256 citationCount, uint256 impactScore, bool isVerified))",
            "function getTotalNFTs() external view returns (uint256)"
        ],
        Dataset: [
            "function registerDataset(string memory _name, string memory _description, string memory _dataHash, string memory _metadataHash, bool _isPublic, uint256 _accessPrice, string[] memory _tags) external returns (uint256)",
            "function getDataset(uint256 _datasetId) external view returns (tuple(string name, string description, address owner, string dataHash, string metadataHash, uint256 createdAt, uint256 lastUpdated, uint256 version, bool isPublic, bool isVerified, uint256 accessPrice, string[] tags, uint256 downloadCount, uint256 citationCount))",
            "function getTotalDatasets() external view returns (uint256)"
        ],
        DeSciPlatform: [
            "function publishResearch(string memory _title, string memory _description, string memory _datasetName, string memory _datasetDescription, string memory _dataHash, string memory _metadataHash, uint256[] memory _zkProofIds, bool _isDatasetPublic, uint256 _datasetAccessPrice) external returns (uint256)",
            "function getResearch(uint256 _researchId) external view returns (tuple(uint256 id, string title, string description, address researcher, uint256 datasetId, uint256 nftTokenId, uint256[] zkProofIds, string metadataHash, uint256 publishedAt, uint8 status, uint256 peerReviewCount, uint256 averageRating))",
            "function getTotalResearches() external view returns (uint256)"
        ]
    };

    return abis[contractName] || [];
}

/**
 * 初始化合约实例
 */
async function initContracts() {
    logger.info('初始化智能合约...');

    for (const [name, address] of Object.entries(config.contracts)) {
        try {
            const abi = loadContractABI(name);
            const contract = new ethers.Contract(address, abi, signer);

            // 测试合约连接
            const code = await provider.getCode(address);
            if (code === '0x') {
                logger.warn(`${name}合约在地址${address}未部署`);
                continue;
            }

            contracts[name] = contract;
            logger.success(`${name}合约初始化成功`, { address });
        } catch (error) {
            logger.error(`${name}合约初始化失败:`, error.message);
        }
    }

    return Object.keys(contracts).length > 0;
}

/**
 * 测试用例
 */
const testCases = [
    {
        name: 'UserProfile合约测试',
        contract: 'UserProfile',
        tests: [
            {
                name: '创建用户档案',
                run: async (contract) => {
                    const tx = await contract.createProfile(
                        '测试用户',
                        25,
                        'test@example.com',
                        'QmTestHash123'
                    );
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取用户档案',
                run: async (contract) => {
                    const profile = await contract.getProfile(config.testAccount);
                    return {
                        name: profile[0],
                        age: profile[1].toNumber(),
                        email: profile[2],
                        verified: profile[4]
                    };
                }
            },
            {
                name: '获取总用户数',
                run: async (contract) => {
                    return (await contract.getTotalUsers()).toNumber();
                }
            }
        ]
    },
    {
        name: 'ZKProof合约测试',
        contract: 'ZKProof',
        tests: [
            {
                name: '提交零知识证明',
                run: async (contract) => {
                    const proof = Array(8).fill(ethers.BigNumber.from('1'));
                    const publicInputs = [ethers.BigNumber.from('1'), ethers.BigNumber.from('2')];

                    const tx = await contract.submitProof(
                        'research_authenticity',
                        proof,
                        publicInputs,
                        'QmProofMetadata123'
                    );
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取证明总数',
                run: async (contract) => {
                    return (await contract.getTotalProofs()).toNumber();
                }
            }
        ]
    },
    {
        name: 'Dataset合约测试',
        contract: 'Dataset',
        tests: [
            {
                name: '注册数据集',
                run: async (contract) => {
                    const tags = ['测试', '研究'];
                    const tx = await contract.registerDataset(
                        '测试数据集',
                        '这是一个测试数据集',
                        'QmDatasetHash123',
                        'QmMetadataHash456',
                        true,
                        ethers.utils.parseEther('0.01'),
                        tags
                    );
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取数据集总数',
                run: async (contract) => {
                    return (await contract.getTotalDatasets()).toNumber();
                }
            }
        ]
    },
    {
        name: 'DeSciNFTSimple合约测试',
        contract: 'DeSciNFTSimple',
        tests: [
            {
                name: '铸造研究NFT',
                run: async (contract) => {
                    const tx = await contract.mintResearchNFT(
                        config.testAccount,
                        '测试研究NFT',
                        '这是一个测试研究的NFT',
                        'QmNFTUri123',
                        'paper'
                    );
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取NFT总数',
                run: async (contract) => {
                    return (await contract.getTotalNFTs()).toNumber();
                }
            }
        ]
    },
    {
        name: 'DeSciPlatform合约测试',
        contract: 'DeSciPlatform',
        tests: [
            {
                name: '发布研究',
                run: async (contract) => {
                    const zkProofIds = [ethers.BigNumber.from('1')];
                    const tx = await contract.publishResearch(
                        '测试研究项目',
                        '这是一个测试研究项目的描述',
                        '测试数据集',
                        '数据集描述',
                        'QmDatasetHash123',
                        'QmMetadataHash456',
                        zkProofIds,
                        true,
                        ethers.utils.parseEther('0.01')
                    );
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取研究总数',
                run: async (contract) => {
                    return (await contract.getTotalResearches()).toNumber();
                }
            }
        ]
    }
];

/**
 * 运行单个测试
 */
async function runTest(testCase, testIndex) {
    const startTime = Date.now();
    const contract = contracts[testCase.contract];

    if (!contract) {
        logger.warn(`跳过${testCase.name}: 合约未初始化`);
        return { success: false, testCase, error: 'Contract not initialized' };
    }

    try {
        logger.info(`开始测试: ${testCase.name}`);

        const results = [];
        for (const [index, subTest] of testCase.tests.entries()) {
            try {
                logger.info(`  执行子测试: ${subTest.name}`);
                const result = await subTest.run(contract);
                results.push({ name: subTest.name, success: true, result });
                logger.success(`  ✓ ${subTest.name} 通过`, result);
            } catch (error) {
                logger.error(`  ✗ ${subTest.name} 失败:`, error.message);
                results.push({ name: subTest.name, success: false, error: error.message });
            }
        }

        const duration = Date.now() - startTime;
        const passed = results.filter(r => r.success).length;
        const total = results.length;

        if (passed === total) {
            logger.success(`${testCase.name} 全部通过 (${duration}ms)`);
            return { success: true, testCase, results, duration };
        } else {
            logger.error(`${testCase.name} 部分失败: ${passed}/${total} 通过`);
            return { success: false, testCase, results, duration };
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${testCase.name} 测试失败:`, error.message);
        return { success: false, testCase, error: error.message, duration };
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('🚀 ============================================');
    console.log('🚀        DeSci智能合约功能测试');
    console.log('🚀 ============================================');
    console.log(`🚀 网络: ${config.network.url}`);
    console.log(`🚀 链ID: ${config.network.chainId}`);
    console.log(`🚀 调试模式: ${config.debug ? '✅ 启用' : '❌ 禁用'}`);
    console.log('🚀');

    // 初始化区块链连接
    const connected = await initBlockchain();
    if (!connected) {
        logger.error('区块链连接失败，终止测试');
        process.exit(1);
    }

    // 初始化合约
    const contractsReady = await initContracts();
    if (!contractsReady) {
        logger.error('合约初始化失败，终止测试');
        process.exit(1);
    }

    console.log(`🚀 已初始化合约: ${Object.keys(contracts).join(', ')}`);
    console.log('🚀');

    // 运行测试
    const results = [];
    const startTime = Date.now();

    for (const testCase of testCases) {
        const result = await runTest(testCase);
        results.push(result);
    }

    const totalTime = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    console.log('\n📊 ============================================');
    console.log('📊              合约测试结果汇总');
    console.log('📊 ============================================');
    console.log(`📊 总测试模块: ${results.length}`);
    console.log(`📊 通过模块: ${passed}`);
    console.log(`📊 失败模块: ${failed}`);
    console.log(`📊 总耗时: ${totalTime}ms`);
    console.log('📊');

    if (failed > 0) {
        console.log('❌ 失败的测试模块:');
        results.filter(r => !r.success).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.testCase.name}`);
            if (result.error) {
                console.log(`      错误: ${result.error}`);
            }
        });
        console.log('❌');
    }

    // 详细结果（调试模式）
    if (config.debug && failed > 0) {
        console.log('🔍 详细错误信息:');
        results.filter(r => !r.success).forEach((result, index) => {
            console.log(`\n--- 测试模块 ${index + 1}: ${result.testCase.name} ---`);
            if (result.results) {
                result.results.forEach(subResult => {
                    if (!subResult.success) {
                        console.log(`子测试失败: ${subResult.name}`);
                        console.log(`错误: ${subResult.error}`);
                    }
                });
            }
        });
    }

    console.log('📊 ============================================');

    if (passed === results.length) {
        console.log('🎉 所有合约功能测试通过！');
        process.exit(0);
    } else {
        console.log('⚠️  部分合约功能测试失败，请检查合约部署状态');
        process.exit(1);
    }
}

// 主函数
async function main() {
    try {
        await runAllTests();
    } catch (error) {
        logger.error('测试脚本执行失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { runAllTests, runTest };
