#!/usr/bin/env node

/**
 * DeSci Platform 后端API服务
 * 提供RESTful API接口，支持Vue.js前端和区块链交互
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 应用配置
const config = {
    port: PORT,
    debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
    blockchain: {
        enabled: process.env.BLOCKCHAIN_ENABLED !== 'false',
        rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
};

// BigInt序列化辅助函数
function serialize(obj) {
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    , 2);
}

// 速率限制中间件（简单实现）
const rateLimitStore = new Map();
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, []);
        }

        const requests = rateLimitStore.get(key);
        // 清理过期的请求
        const validRequests = requests.filter(time => time > windowStart);

        if (validRequests.length >= maxRequests) {
            logger.warn(`速率限制触发: ${key}`);
            return res.status(429).json({
                success: false,
                error: {
                    code: 429,
                    message: '请求过于频繁',
                    details: '请稍后再试'
                }
            });
        }

        validRequests.push(now);
        rateLimitStore.set(key, validRequests);

        next();
    };
};

// 日志工具
const logger = {
    info: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ℹ️  ${message}`, data ? serialize(data) : '');
    },
    warn: (message, data) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] ⚠️  ${message}`, data ? serialize(data) : '');
    },
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ❌ ${message}`, error);
        if (error && error.stack) {
            console.error(`[${timestamp}] ❌ Stack trace:`, error.stack);
        }
    },
    debug: (message, data) => {
        if (config.debug) {
            const timestamp = new Date().toISOString();
            console.debug(`[${timestamp}] 🔍 ${message}`, data ? serialize(data) : '');
        }
    }
};

// 请求日志中间件
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    logger.info(`[${req.method}] ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
    });

    // 记录响应
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const statusIcon = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';

        logger.info(`${statusIcon} [${req.method}] ${req.path} ${statusCode} - ${duration}ms`);
    });

    next();
};

// 错误处理中间件
const errorHandler = (error, req, res, next) => {
    logger.error('API错误:', error);

    // 标准化错误响应
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode,
            message: message,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        }
    });
};

// 中间件配置
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 启用静态文件服务 - 放在API路由之前，避免覆盖API
app.use(express.static(path.join(__dirname, '../../frontend')));
console.log('静态文件服务已启用');

// API速率限制中间件 - 必须在API路由之前定义
app.use('/api', rateLimit(100, 15 * 60 * 1000)); // 15分钟内最多100个请求

// 健康检查端点 - 在所有中间件之前定义
console.log('Defining /health route...');
app.get('/health', (req, res) => {
    console.log('Health endpoint called at:', new Date().toISOString());
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        blockchain: {
            connected: !!provider,
            rpcUrl: config.blockchain.rpcUrl
        },
        config: {
            debug: config.debug,
            port: config.port
        }
    };

    res.json(health);
});
console.log('/health route defined');

// 测试路由
console.log('Defining /test route...');
app.get('/test', (req, res) => {
    console.log('Test endpoint called at:', new Date().toISOString());
    res.json({ message: 'Test endpoint working' });
});
console.log('/test route defined');

// API版本信息
app.get('/api/version', (req, res) => {
    res.json({
        name: 'DeSci Platform API',
        version: '2.0.0',
        description: '去中心化科学研究平台API',
        blockchain: config.blockchain.enabled,
        debug: config.debug
    });
});

// 调试信息端点
app.get('/api/debug', (req, res) => {
    if (!config.debug) {
        return res.status(403).json({ error: '调试模式未启用' });
    }

    const debugInfo = {
        timestamp: new Date().toISOString(),
        config: {
            port: config.port,
            debug: config.debug,
            blockchain: {
                enabled: config.blockchain.enabled,
                rpcUrl: config.blockchain.rpcUrl
            }
        },
        blockchain: {
            connected: !!provider,
            contractAddress: CONTRACT_ADDRESSES.DeSciPlatform,
            network: provider ? 'connected' : 'disconnected'
        },
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        }
    };

    res.json(debugInfo);
});

// 区块链状态端点
app.get('/api/blockchain/status', async (req, res) => {
    try {
        const status = {
            connected: !!provider,
            network: null,
            blockNumber: null,
            gasPrice: null,
            contracts: {
                platform: CONTRACT_ADDRESSES.DeSciPlatform,
                userProfile: CONTRACT_ADDRESSES.UserProfile,
                nft: CONTRACT_ADDRESSES.DeSciNFT,
                dataset: CONTRACT_ADDRESSES.Dataset
            }
        };

        if (provider) {
            try {
                status.network = await provider.getNetwork();
                status.blockNumber = await provider.getBlockNumber();
                status.gasPrice = (await provider.getGasPrice()).toString();
            } catch (blockchainError) {
                logger.warn('获取区块链状态失败:', blockchainError.message);
                status.error = blockchainError.message;
            }
        }

        res.json(status);
    } catch (error) {
        logger.error('区块链状态查询失败:', error);
        res.status(500).json({
            error: '获取区块链状态失败',
            details: config.debug ? error.message : '服务器内部错误'
        });
    }
});

// 性能监控端点
app.get('/api/performance', (req, res) => {
    const performance = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
            heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
            heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            external: (process.memoryUsage().external / 1024 / 1024).toFixed(2) + ' MB'
        },
        cpu: process.cpuUsage(),
        pid: process.pid,
        platform: process.platform
    };

    res.json(performance);
});

// 区块链连接配置
let provider;
let platformContract;
let userProfileContract;
let nftContract;
let zkProofContract;
let datasetContract;

// 合约ABI（简化版）
const PLATFORM_ABI = [
    "function getResearch(uint256) view returns (tuple(uint256,address,string,string,string,string,uint256,uint256,uint256,uint256,uint256,bool,uint256,uint8,uint8,string,uint256,string,uint256,uint256,string,uint8))",
    "function getResearchesPaginated(uint8,uint8,uint256,uint256) view returns (uint256[],uint256)",
    "function searchResearches(string,uint256,uint256) view returns (uint256[],uint256)",
    "function getResearchStatsByStatus() view returns (uint256,uint256,uint256,uint256,uint256)",
    "function getResearchStatsByCategory() view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
    "function getDetailedResearcherStats(address) view returns (uint256,uint256,uint256,uint256,uint256)",
    "function getPopularResearches(uint256) view returns (uint256[])",
    "function getTotalResearches() view returns (uint256)",
    "function getLatestResearches(uint256,uint256) view returns (uint256[])"
];

const USER_PROFILE_ABI = [
    "function hasProfile(address) view returns (bool)",
    "function getProfile(address) view returns (tuple(string,uint256,string,string,bool,uint256,uint256,uint256))",
    "function getTotalUsers() view returns (uint256)"
];

const NFT_ABI = [
    "function getTotalNFTs() view returns (uint256)",
    "function getResearcherNFTs(address) view returns (uint256[])"
];

const ZK_PROOF_ABI = [
    "function getTotalProofs() view returns (uint256)"
];

// 合约地址（需要根据部署情况更新）
const CONTRACT_ADDRESSES = {
    UserProfile: '0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650',
    ZKProof: '0xc351628EB244ec633d5f21fBD6621e1a683B1181',
    DeSciNFT: '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc',
    Dataset: '0xFD471836031dc5108809D173A067e8486B9047A3',
    DeSciPlatform: '0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f'
};

/**
 * 初始化区块链连接
 */
async function initBlockchain() {
    if (!config.blockchain.enabled) {
        logger.info('区块链功能已禁用，将使用模拟数据模式');
        return;
    }

    try {
        logger.info('正在初始化区块链连接...', { rpcUrl: config.blockchain.rpcUrl });

        // 连接到区块链网络 (ethers.js兼容性处理)
        if (ethers.providers && ethers.providers.JsonRpcProvider) {
            // ethers.js v5
            provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
            logger.info('使用 ethers.js v5 JsonRpcProvider');
        } else if (ethers.JsonRpcProvider) {
            // ethers.js v6
            provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
            logger.info('使用 ethers.js v6 JsonRpcProvider');
        } else {
            throw new Error('无法创建JsonRpcProvider，检查ethers.js版本');
        }

        // 测试连接
        const network = await provider.getNetwork();
        logger.info('区块链连接成功', { network: network.name, chainId: network.chainId });

        // 初始化合约实例 (ethers.js兼容性处理)
        let Contract;
        if (ethers.Contract) {
            // ethers.js v6
            Contract = ethers.Contract;
            logger.info('使用 ethers.js v6 Contract');
        } else if (ethers.contracts && ethers.contracts.Contract) {
            // ethers.js v5
            Contract = ethers.contracts.Contract;
            logger.info('使用 ethers.js v5 Contract');
        } else {
            throw new Error('无法创建Contract，检查ethers.js版本');
        }

        platformContract = new Contract(
            CONTRACT_ADDRESSES.DeSciPlatform,
            PLATFORM_ABI,
            provider
        );

        userProfileContract = new Contract(
            CONTRACT_ADDRESSES.UserProfile,
            USER_PROFILE_ABI,
            provider
        );

        nftContract = new Contract(
            CONTRACT_ADDRESSES.DeSciNFT,
            NFT_ABI,
            provider
        );

        zkProofContract = new Contract(
            CONTRACT_ADDRESSES.ZKProof,
            ZK_PROOF_ABI,
            provider
        );

        logger.info('智能合约初始化成功');

        // 验证合约连接
        try {
            const totalResearches = await platformContract.getTotalResearches();
            logger.info('合约验证成功', { totalResearches: totalResearches.toString() });
        } catch (contractError) {
            logger.warn('合约调用验证失败，可能合约未部署或ABI不匹配:', contractError.message);
        }

    } catch (error) {
        logger.error('区块链连接初始化失败:', error);
        logger.warn('将使用模拟数据模式继续运行');

        // 重置连接状态
        provider = null;
        platformContract = null;
        userProfileContract = null;
    }
}

/**
 * 格式化研究数据为前端友好的格式
 */
function formatResearchData(rawResearch, id) {
    return {
        id: Number(rawResearch[0]),
        researcher: rawResearch[1],
        title: rawResearch[2],
        description: rawResearch[3],
        datasetHash: rawResearch[4],
        metadataHash: rawResearch[5],
        datasetId: Number(rawResearch[6]),
        nftTokenId: Number(rawResearch[7]),
        zkProofId: Number(rawResearch[8]),
        publishedAt: Number(rawResearch[9]),
        updatedAt: Number(rawResearch[10]),
        isVerified: rawResearch[11],
        citationCount: Number(rawResearch[12]),
        status: rawResearch[13],
        category: rawResearch[14],
        tags: rawResearch[15],
        fundingAmount: Number(rawResearch[16]),
        fundingCurrency: rawResearch[17],
        viewCount: Number(rawResearch[18]),
        downloadCount: Number(rawResearch[19]),
        doi: rawResearch[20],
        reputationScore: rawResearch[21]
    };
}

/**
 * 获取研究列表（支持分页和过滤）
 */
app.get('/api/projects', async (req, res) => {
    try {
        const {
            wallet_address,
            status = 0,
            category = 0,
            limit = 10,
            offset = 0,
            search
        } = req.query;

        // 参数验证和清理
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // 限制在1-100之间
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const parsedStatus = Math.max(parseInt(status) || 0, 0);
        const parsedCategory = Math.max(parseInt(category) || 0, 0);

        logger.debug('获取项目列表请求', {
            wallet_address,
            status: parsedStatus,
            category: parsedCategory,
            limit: parsedLimit,
            offset: parsedOffset,
            search
        });

        let researchIds = [];
        let totalCount = 0;
        let source = 'mock';

        if (platformContract && config.blockchain.enabled) {
            logger.debug('使用区块链数据查询');

            try {
                // 使用区块链数据
                if (search && search.trim()) {
                    logger.debug('执行搜索查询', { search: search.trim() });
                    // 搜索模式
                    [researchIds, totalCount] = await platformContract.searchResearches(
                        search.trim(),
                        parsedLimit,
                        parsedOffset
                    );
                } else {
                    logger.debug('执行分页查询', { status: parsedStatus, category: parsedCategory });
                    // 普通分页查询
                    [researchIds, totalCount] = await platformContract.getResearchesPaginated(
                        parsedStatus,
                        parsedCategory,
                        parsedLimit,
                        parsedOffset
                    );
                }

                logger.debug('区块链查询完成', {
                    resultCount: researchIds.length,
                    totalCount: totalCount.toString()
                });

                source = 'blockchain';

            } catch (contractError) {
                logger.error('区块链查询失败:', contractError);
                logger.warn('切换到模拟数据模式');

                // 区块链查询失败，回退到模拟数据
                researchIds = [];
                totalCount = parsedLimit * 5; // 模拟总数
                source = 'mock-fallback';
            }
        } else {
            logger.debug('使用模拟数据模式');
            totalCount = parsedLimit * 5; // 模拟总数
        }

        // 生成项目数据
        const projects = [];
        if (source === 'blockchain' && researchIds.length > 0) {
            // 从区块链获取数据
            for (const id of researchIds) {
                try {
                    const rawResearch = await platformContract.getResearch(id);
                    const formattedResearch = formatResearchData(rawResearch, id);
                    projects.push(formattedResearch);
                } catch (researchError) {
                    logger.error(`获取研究 ${id} 失败:`, researchError);
                    // 继续处理其他研究
                }
            }
        } else {
            // 使用模拟数据
            for (let i = 0; i < parsedLimit; i++) {
                const mockProject = generateMockProject(parsedOffset + i);
                projects.push(mockProject);
            }
        }

        const response = {
            data: projects,
            pagination: {
                total: source === 'blockchain' ? Number(totalCount) : totalCount,
                limit: parsedLimit,
                offset: parsedOffset,
                hasMore: parsedOffset + parsedLimit < (source === 'blockchain' ? Number(totalCount) : totalCount),
                currentPage: Math.floor(parsedOffset / parsedLimit) + 1,
                totalPages: Math.ceil((source === 'blockchain' ? Number(totalCount) : totalCount) / parsedLimit)
            },
            meta: {
                source: source,
                query: {
                    status: parsedStatus,
                    category: parsedCategory,
                    search: search || null
                },
                timestamp: new Date().toISOString()
            }
        };

        if (source === 'mock-fallback') {
            response.meta.warning = '区块链查询失败，使用模拟数据';
        }

        logger.debug('返回项目列表', {
            itemCount: projects.length,
            source: source,
            pagination: response.pagination
        });

        res.json(response);

    } catch (error) {
        logger.error('获取项目列表失败:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 500,
                message: '获取项目列表失败',
                details: config.debug ? error.message : '服务器内部错误'
            },
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取单个项目详情
 */
app.get('/api/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        if (platformContract) {
            const rawResearch = await platformContract.getResearch(projectId);
            const formattedResearch = formatResearchData(rawResearch, projectId);
            res.json(formattedResearch);
        } else {
            // 返回模拟数据
            res.json({
                id: parseInt(projectId),
                name: `模拟研究项目 ${projectId}`,
                description: '这是一个模拟的研究项目描述',
                status: 'Active',
                created_at: Date.now(),
                updated_at: Date.now()
            });
        }
    } catch (error) {
        console.error('获取项目详情失败:', error);
        res.status(500).json({
            error: '获取项目详情失败',
            details: error.message
        });
    }
});

/**
 * 获取平台统计数据
 */
app.get('/api/stats', async (req, res) => {
    try {
        if (platformContract) {
            // 获取统计数据
            const totalResearches = await platformContract.getTotalResearches();

            // 同时获取用户和NFT统计数据
            const [
                totalUsers,
                totalNFTs,
                totalProofs
            ] = await Promise.all([
                userProfileContract ? userProfileContract.getTotalUsers().catch(() => 0) : Promise.resolve(0),
                nftContract ? nftContract.getTotalNFTs().catch(() => 0) : Promise.resolve(0),
                zkProofContract ? zkProofContract.getTotalProofs().catch(() => 0) : Promise.resolve(0)
            ]);

            const stats = {
                totalUsers: Number(totalUsers) || 0,
                totalResearches: Number(totalResearches) || 0,
                totalNFTs: Number(totalNFTs) || 0,
                totalProofs: Number(totalProofs) || 0,
                byStatus: {
                    draft: 0,
                    underReview: 0,
                    published: 0,
                    rejected: 0,
                    archived: 0
                },
                byCategory: {
                    biomedical: 0,
                    ai: 0,
                    climate: 0,
                    quantum: 0,
                    materials: 0,
                    neuroscience: 0,
                    other: 0
                }
            };

            res.json(stats);
        } else {
            // 返回模拟统计数据
            res.json({
                totalUsers: 15,
                totalResearches: 42,
                totalNFTs: 8,
                totalProofs: 23,
                byStatus: {
                    draft: 5,
                    underReview: 8,
                    published: 25,
                    rejected: 2,
                    archived: 2
                },
                byCategory: {
                    biomedical: 8,
                    ai: 12,
                    climate: 6,
                    quantum: 4,
                    materials: 3,
                    neuroscience: 5,
                    other: 4
                }
            });
        }
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            error: '获取统计数据失败',
            details: error.message
        });
    }
});

/**
 * 用户登录/注册
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: '钱包地址不能为空' });
        }

        // 检查用户是否已有档案
        let userProfile = null;
        if (userProfileContract) {
            try {
                const hasProfile = await userProfileContract.hasProfile(walletAddress);
                if (hasProfile) {
                    const profile = await userProfileContract.getProfile(walletAddress);
                    userProfile = {
                        wallet_address: walletAddress,
                        username: profile[0] || `User_${walletAddress.slice(2, 8)}`,
                        age: Number(profile[1]),
                        email: profile[2],
                        ipfs_hash: profile[3],
                        is_verified: profile[4],
                        created_at: Number(profile[5]),
                        updated_at: Number(profile[6]),
                        reputation: Number(profile[7])
                    };
                }
            } catch (error) {
                console.error('获取用户档案失败:', error.message);
            }
        }

        // 如果没有区块链档案，创建模拟用户
        if (!userProfile) {
            userProfile = {
                wallet_address: walletAddress,
                username: `User_${walletAddress.slice(2, 8)}`,
                age: 25,
                email: `${walletAddress.slice(2, 8)}@example.com`,
                ipfs_hash: '',
                is_verified: false,
                created_at: Date.now(),
                updated_at: Date.now(),
                reputation: 50
            };
        }

        res.json({ user: userProfile });
    } catch (error) {
        console.error('用户登录失败:', error);
        res.status(500).json({
            error: '用户登录失败',
            details: error.message
        });
    }
});

/**
 * 创建新项目
 */
app.post('/api/projects', async (req, res) => {
    try {
        const projectData = req.body;

        // 这里应该调用智能合约创建项目
        // 暂时返回模拟响应
        const newProject = {
            id: Date.now(),
            ...projectData,
            created_at: Date.now(),
            updated_at: Date.now(),
            status: 'Active'
        };

        res.json(newProject);
    } catch (error) {
        console.error('创建项目失败:', error);
        res.status(500).json({
            error: '创建项目失败',
            details: error.message
        });
    }
});

/**
 * 生成单个模拟项目数据
 */
function generateMockProject(index) {
    const categories = ['Biomedical', 'AI', 'Climate', 'Quantum', 'Materials', 'Neuroscience', 'Other'];
    const statuses = ['Active', 'Under Review', 'Completed'];

    return {
        id: index + 1,
        title: `研究项目 ${index + 1}`,
        description: `这是第 ${index + 1} 个研究项目的详细描述，涉及前沿科学研究领域的研究内容和方法论。`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        researcher: `0x${Math.random().toString(16).substr(2, 40)}`,
        datasetHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
        metadataHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
        publishedAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        isVerified: Math.random() > 0.3,
        citationCount: Math.floor(Math.random() * 100),
        tags: `["tag${Math.floor(Math.random() * 10)}", "research", "science"]`,
        fundingAmount: Math.floor(Math.random() * 100000) + 10000,
        fundingCurrency: 'USD',
        viewCount: Math.floor(Math.random() * 1000),
        downloadCount: Math.floor(Math.random() * 200),
        doi: `10.1234/research.${index + 1}.2024`,
        reputationScore: Math.floor(Math.random() * 100)
    };
}

/**
 * 生成模拟项目数据（批量）
 */
function generateMockProjects(limit, offset) {
    const categories = ['Biomedical', 'AI', 'Climate', 'Quantum', 'Materials', 'Neuroscience', 'Other'];
    const statuses = ['Active', 'Under Review', 'Completed'];
    const mockProjects = [];

    for (let i = offset; i < offset + limit; i++) {
        mockProjects.push({
            id: i + 1,
            name: `研究项目 ${i + 1}`,
            description: `这是第 ${i + 1} 个研究项目的详细描述，涉及前沿科学研究领域。`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            owner_username: `researcher_${i + 1}`,
            owner_wallet_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            created_at: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            updated_at: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
            funding_amount: Math.floor(Math.random() * 100000) + 10000,
            citation_count: Math.floor(Math.random() * 100),
            view_count: Math.floor(Math.random() * 1000),
            reputation_score: Math.floor(Math.random() * 100)
        });
    }

    return mockProjects;
}

// 请求验证中间件
const validateRequest = (req, res, next) => {
    // 验证必需的参数
    const requiredParams = req.query.required || [];
    const missingParams = requiredParams.filter(param => !req.query[param]);

    if (missingParams.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: 400,
                message: '缺少必需的参数',
                details: `缺少参数: ${missingParams.join(', ')}`
            }
        });
    }

    // 验证参数类型
    const { limit, offset } = req.query;
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 400,
                message: '无效的limit参数',
                details: 'limit必须是1-100之间的数字'
            }
        });
    }

    if (offset && (isNaN(offset) || offset < 0)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 400,
                message: '无效的offset参数',
                details: 'offset必须是非负数'
            }
        });
    }

    next();
};

// 速率限制中间件已移至文件顶部

// 应用中间件
app.use('/api/projects', validateRequest);

// 错误处理中间件
app.use(errorHandler);

// 404处理
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        error: {
            code: 404,
            message: '接口不存在',
            path: req.path,
            method: req.method
        }
    });
});

// 启动服务器
async function startServer() {
    try {
        logger.info('正在启动DeSci Platform API服务器...');
        await initBlockchain();

        app.listen(config.port, '0.0.0.0', () => {
            const startupTime = Date.now();
            logger.info(`服务器启动完成，耗时: ${Date.now() - startupTime}ms`);

            console.log('🚀 ============================================');
            console.log('🚀         DeSci Platform API Server');
            console.log('🚀 ============================================');
            console.log(`🚀 服务器地址: http://localhost:${config.port}`);
            console.log(`🚀 调试模式: ${config.debug ? '✅ 启用' : '❌ 禁用'}`);
            console.log(`🚀 区块链集成: ${config.blockchain.enabled ? '✅ 启用' : '❌ 禁用'}`);
            console.log('🚀');
            console.log('🚀 API端点:');
            console.log(`🚀 GET  /health - 健康检查`);
            console.log(`🚀 GET  /api/version - API版本信息`);
            console.log(`🚀 GET  /api/debug - 调试信息 (${config.debug ? '可用' : '需要启用调试模式'})`);
            console.log(`🚀 GET  /api/performance - 性能监控`);
            console.log(`🚀 GET  /api/blockchain/status - 区块链状态`);
            console.log(`🚀 GET  /api/projects - 获取项目列表 (支持分页、过滤、搜索)`);
            console.log(`🚀 GET  /api/projects/:id - 获取项目详情`);
            console.log(`🚀 POST /api/projects - 创建新项目`);
            console.log(`🚀 GET  /api/stats - 获取平台统计`);
            console.log(`🚀 POST /api/auth/login - 用户登录`);
            console.log('🚀');
            console.log('🚀 前端应用:');
            console.log(`🚀 HTML版: http://localhost:${config.port}`);
            console.log(`🚀 Vue.js版: http://localhost:3001`);
            console.log('🚀');
            console.log('🚀 环境变量:');
            console.log(`🚀 DEBUG=${config.debug}`);
            console.log(`🚀 BLOCKCHAIN_ENABLED=${config.blockchain.enabled}`);
            console.log(`🚀 RPC_URL=${config.blockchain.rpcUrl}`);
            console.log('🚀 ============================================');

            // 启动后验证关键端点
            setTimeout(async () => {
                try {
                    const healthResponse = await fetch(`http://localhost:${config.port}/health`);
                    if (healthResponse.ok) {
                        logger.info('✅ 健康检查通过');
                    } else {
                        logger.warn(`⚠️ 健康检查失败 - 状态码: ${healthResponse.status}, 状态文本: ${healthResponse.statusText}`);
                        console.log('Health check failed with status:', healthResponse.status);
                    }
                } catch (error) {
                    logger.error('健康检查请求失败:', error.message);
                }
            }, 1000);
        });
    } catch (error) {
        logger.error('服务器启动失败:', error);
        console.error('❌ 服务器启动失败:', error.message);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭API服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭API服务器...');
    process.exit(0);
});

// 启动服务器
if (require.main === module) {
    startServer();
}

module.exports = { startServer };
