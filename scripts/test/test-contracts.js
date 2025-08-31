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
        UserProfile: '0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650',
        ZKProof: '0xc351628EB244ec633d5f21fBD6621e1a683B1181',
        DeSciNFTSimple: '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc',
        Dataset: '0xFD471836031dc5108809D173A067e8486B9047A3',
        DeSciPlatform: '0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f'
    },
    debug: process.env.DEBUG === 'true',
    testAccount: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
};

// 日志工具
const logger = {
    info: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ℹ️  ${message}`, data ? JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2) : '');
    },
    success: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ✅ ${message}`, data ? JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2) : '');
    },
    error: (message, data) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ❌ ${message}`, data ? JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2) : '');
    },
    warn: (message, data) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] ⚠️  ${message}`, data ? JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2) : '');
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
        provider = new ethers.JsonRpcProvider(config.network.url);

        // 测试连接
        const network = await provider.getNetwork();
        logger.success('区块链连接成功', {
            network: network.name,
            chainId: network.chainId
        });

        // 获取签名者
        try {
            signer = await provider.getSigner(0); // 使用第一个账户
            const address = await signer.getAddress();
            logger.info('使用账户:', address);
        } catch (error) {
            logger.warn('获取签名者失败，使用默认账户');
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
        const artifactPath = path.join(__dirname, '..', '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            logger.info(`使用真实的ABI文件: ${contractName}`);
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
                name: '验证用户档案',
                run: async (contract) => {
                    const signerAddress = await signer.getAddress();
                    const tx = await contract.verifyProfile(signerAddress, true);
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取用户档案',
                run: async (contract) => {
                    const signerAddress = await signer.getAddress();
                    const profile = await contract.getProfile(signerAddress);
                    return {
                        name: profile[0],
                        age: Number(profile[1]),
                        email: profile[2],
                        verified: profile[4]
                    };
                }
            },
            {
                name: '获取总用户数',
                run: async (contract) => {
                    return Number(await contract.getTotalUsers());
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
                    const proof = Array(8).fill(1n);
                    const publicInputs = [1n, 2n];

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
                    return Number(await contract.getTotalProofs());
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
                    const tags = ['test', 'research'];

                    // 尝试不同的数据集名称，避免重复
                    let datasetName = 'TestDataset';
                    let counter = 1;
                    while (true) {
                        try {
                            const tx = await contract.registerDataset(
                                datasetName,
                                'This is a test dataset',
                                `QmDatasetHash${counter}23`,
                                `QmMetadataHash${counter}56`,
                                true,
                                ethers.parseEther('0.01'),
                                tags
                            );
                            await tx.wait();
                            return tx.hash;
                        } catch (error) {
                            if (error.message.includes('Dataset name already exists')) {
                                counter++;
                                datasetName = `TestDataset${counter}`;
                            } else {
                                throw error;
                            }
                        }
                    }
                }
            },
            {
                name: '获取数据集总数',
                run: async (contract) => {
                    return Number(await contract.getTotalDatasets());
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
                    const signerAddress = await signer.getAddress();

                    // 尝试不同的NFT标题，避免重复
                    let nftTitle = 'TestResearchNFT';
                    let counter = 1;
                    while (true) {
                        try {
                            const tx = await contract.mintResearchNFT(
                                signerAddress,
                                nftTitle,
                                'This is a test research NFT',
                                `QmNFTUri${counter}23`,
                                'paper'
                            );
                            await tx.wait();
                            return tx.hash;
                        } catch (error) {
                            if (error.message.includes('Research with this title already exists')) {
                                counter++;
                                nftTitle = `TestResearchNFT${counter}`;
                            } else {
                                throw error;
                            }
                        }
                    }
                }
            },
            {
                name: '获取NFT总数',
                run: async (contract) => {
                    return Number(await contract.getTotalNFTs());
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
                    // 首先创建并验证用户档案（如果需要）
                    const signerAddress = await signer.getAddress();

                    // 创建数据集（如果还没有的话）
                    const datasetContract = contracts['Dataset'];
                    if (datasetContract) {
                        try {
                            const tags = ['test', 'research'];

                            // 尝试注册数据集，使用不同的名称避免重复
                            let datasetName = 'ResearchDataset';
                            let datasetCounter = 1;
                            while (true) {
                                try {
                                    await datasetContract.registerDataset(
                                        datasetName,
                                        'Dataset for research',
                                        `QmDatasetHash${datasetCounter}23`,
                                        `QmMetadataHash${datasetCounter}56`,
                                        true,
                                        ethers.parseEther('0.01'),
                                        tags
                                    );
                                    break; // 成功注册，跳出循环
                                } catch (error) {
                                    if (error.message.includes('Dataset name already exists')) {
                                        datasetCounter++;
                                        datasetName = `ResearchDataset${datasetCounter}`;
                                    } else {
                                        throw error;
                                    }
                                }
                            }
                        } catch (error) {
                            // 数据集可能已经存在，忽略错误
                        }
                    }

                    // 提交并验证ZK证明
                    const zkContract = contracts['ZKProof'];
                    let proofId = 1n;
                    if (zkContract) {
                        try {
                            const proof = Array(8).fill(1n);
                            const publicInputs = [1n, 2n];

                            // 提交证明
                            const submitTx = await zkContract.submitProof(
                                'research_authenticity',
                                proof,
                                publicInputs,
                                'QmProofMetadata123'
                            );
                            await submitTx.wait();

                            // 获取最新证明ID
                            const totalProofs = await zkContract.getTotalProofs();
                            proofId = BigInt(totalProofs);

                            // 验证证明
                            const verifyTx = await zkContract.verifyProof(proofId, true);
                            await verifyTx.wait();

                            logger.success(`ZK证明 ${proofId} 已提交并验证`);
                        } catch (error) {
                            logger.warn(`ZK证明处理失败:`, error.message);
                        }
                    }

                    const zkProofIds = [proofId];
                    const tx = await contract.publishResearch(
                        'TestResearchProject',
                        'This is a test research project description',
                        'ResearchDataset',
                        'Dataset description',
                        'QmDatasetHash123',
                        'QmMetadataHash456',
                        zkProofIds,
                        true,
                        ethers.parseEther('0.01')
                    );
                    await tx.wait();
                    return tx.hash;
                }
            },
            {
                name: '获取研究总数',
                run: async (contract) => {
                    return Number(await contract.getTotalResearches());
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
