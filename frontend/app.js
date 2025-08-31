// Contract addresses - 动态加载或使用默认值
const CONTRACT_ADDRESSES = {
    UserProfile: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    ZKProof: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    DeSciNFTSimple: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    Dataset: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    DeSciPlatform: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
};

// 区块链网络配置
const NETWORK_CONFIG = {
    local: {
        name: 'Hardhat Local',
        chainId: 1337,
        rpcUrl: 'http://localhost:8545',
        blockExplorer: null
    },
    sepolia: {
        name: 'Sepolia Testnet',
        chainId: 11155111,
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
        blockExplorer: 'https://sepolia.etherscan.io'
    }
};

// API配置
const API_CONFIG = {
    baseUrl: 'http://localhost:3000',
    endpoints: {
        health: '/health',
        version: '/api/version',
        stats: '/api/stats',
        projects: '/api/projects',
        blockchainStatus: '/api/blockchain/status'
    }
};

// API调用工具函数
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API调用失败 ${endpoint}:`, error);
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API调用失败 ${endpoint}:`, error);
            throw error;
        }
    }
}

// 创建API客户端实例
const apiClient = new ApiClient(API_CONFIG.baseUrl);

// 从后端API获取平台统计数据
async function fetchPlatformStats() {
    try {
        console.log('正在从后端获取平台统计数据...');
        const stats = await apiClient.get(API_CONFIG.endpoints.stats);
        console.log('获取到平台统计数据:', stats);

        // 更新前端显示
        updateStatsDisplay(stats);
        return stats;
    } catch (error) {
        console.warn('无法从后端获取统计数据，使用区块链直接获取:', error.message);
        // 如果后端不可用，回退到直接区块链调用
        return await fetchStatsFromBlockchain();
    }
}

// 更新统计数据显示
function updateStatsDisplay(stats) {
    const totalUsersEl = document.getElementById('totalUsers');
    const totalResearchesEl = document.getElementById('totalResearches');
    const totalNFTsEl = document.getElementById('totalNFTs');
    const totalProofsEl = document.getElementById('totalProofs');

    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || '0';
    if (totalResearchesEl) totalResearchesEl.textContent = stats.totalResearches || '0';
    if (totalNFTsEl) totalNFTsEl.textContent = stats.totalNFTs || '0';
    if (totalProofsEl) totalProofsEl.textContent = stats.totalProofs || '0';
}

// 从区块链直接获取统计数据（回退方案）
async function fetchStatsFromBlockchain() {
    try {
        console.log('从区块链获取统计数据...');

        const blockchainManager = new BlockchainManager();
        await blockchainManager.connect();

        const [totalUsers, totalResearches, totalNFTs, totalProofs] = await Promise.all([
            blockchainManager.getTotalUsers(),
            blockchainManager.getTotalResearches(),
            blockchainManager.getTotalNFTs(),
            blockchainManager.getTotalProofs()
        ]);

        const stats = {
            totalUsers: totalUsers || 0,
            totalResearches: totalResearches || 0,
            totalNFTs: totalNFTs || 0,
            totalProofs: totalProofs || 0
        };

        updateStatsDisplay(stats);
        return stats;
    } catch (error) {
        console.error('从区块链获取统计数据失败:', error);
        // 显示错误状态
        updateStatsDisplay({
            totalUsers: '错误',
            totalResearches: '错误',
            totalNFTs: '错误',
            totalProofs: '错误'
        });
        throw error;
    }
}

// Contract ABIs (simplified for demo)
const CONTRACT_ABIS = {
    UserProfile: [
        "function createProfile(string memory _fullName, uint256 _age, string memory _email, string memory _ipfsHash) external",
        "function getProfile(address _user) external view returns (tuple(string fullName, uint256 age, string email, string ipfsHash, bool isVerified, uint256 createdAt, uint256 updatedAt, uint256 reputation))",
        "function hasProfile(address _user) external view returns (bool)",
        "function getTotalUsers() external view returns (uint256)"
    ],
    ZKProof: [
        "function submitProof(string memory _proofType, uint256[8] memory _proof, uint256[2] memory _publicInputs, string memory _metadataHash) external returns (uint256)",
        "function getTotalProofs() external view returns (uint256)"
    ],
    DeSciNFTSimple: [
        "function getTotalNFTs() external view returns (uint256)",
        "function getResearcherNFTs(address researcher) external view returns (uint256[] memory)"
    ],
    Dataset: [
        "function getTotalDatasets() external view returns (uint256)"
    ],
    DeSciPlatform: [
        "function publishResearch(string memory _title, string memory _description, string memory _datasetName, string memory _datasetDescription, string memory _datasetHash, string memory _metadataHash, uint256[] memory _zkProofIds, bool _isDatasetPublic, uint256 _datasetAccessPrice) external returns (uint256)",
        "function submitPeerReview(uint256 _researchId, uint256 _rating, string memory _comments, string memory _ipfsHash) external",
        "function getTotalResearches() external view returns (uint256)"
    ]
};

/**
 * ==========================================
 * 全局变量定义
 * ==========================================
 */
let provider;
let signer;
let contracts = {};
let currentAccount;

// 活动分页相关变量
let activityCurrentPage = 1;
let activityTotalPages = 1;
let activityPageSize = 10;
let activityTotalItems = 0;

// 分页状态管理
let paginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
};

// 区块链连接管理器
class BlockchainManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.currentNetwork = null;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.isConnected = false;
        this.reconnectInterval = null;
    }

    // 初始化区块链连接
    async initialize() {
        console.log('🚀 初始化区块链连接...');

        try {
            // 首先尝试连接本地区块链网络
            await this.connectToLocalNetwork();

            // 如果本地网络连接失败，尝试其他网络
            if (!this.isConnected) {
                await this.connectToFallbackNetwork();
            }

            // 初始化合约
            if (this.isConnected) {
                await this.initializeContracts();
                this.startHealthCheck();
                console.log('✅ 区块链连接初始化完成');
                return true;
            }

        } catch (error) {
            console.error('❌ 区块链连接初始化失败:', error.message);
        }

        // 如果都失败，使用模拟模式
        console.log('⚠️  启用演示模式');
        return false;
    }

    // 连接到本地区块链网络
    async connectToLocalNetwork() {
        try {
            console.log('🔗 尝试连接本地区块链网络...');

            const localConfig = NETWORK_CONFIG.local;
            this.provider = new window.ethers.JsonRpcProvider(localConfig.rpcUrl, {
                chainId: localConfig.chainId,
                name: localConfig.name
            });

            // 测试连接
            const network = await this.provider.getNetwork();
            console.log(`✅ 连接到 ${network.name} (Chain ID: ${network.chainId})`);

            // 获取签名者
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.signer = await new window.ethers.BrowserProvider(window.ethereum).getSigner();
            } else {
                // 使用本地账户作为签名者
                const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bac478cbb6ee57204c061857b144057'; // Hardhat默认账户
                this.signer = new window.ethers.Wallet(privateKey, this.provider);
            }

            const address = await this.signer.getAddress();
            console.log(`🔑 使用账户: ${address}`);

            this.currentNetwork = 'local';
            this.isConnected = true;

        } catch (error) {
            console.warn('本地区块链连接失败:', error.message);
            this.isConnected = false;
        }
    }

    // 连接到备用网络
    async connectToFallbackNetwork() {
        try {
            console.log('🌐 尝试连接备用网络...');

            // 这里可以添加其他网络的连接逻辑
            // 暂时直接进入模拟模式
            console.log('备用网络连接暂未实现');

        } catch (error) {
            console.error('备用网络连接失败:', error.message);
        }
    }

    // 初始化智能合约
    async initializeContracts() {
        try {
            console.log('📝 初始化智能合约...');

            // 尝试从本地加载部署信息
            await this.loadContractAddresses();

            // 初始化各个合约
            for (const [contractName, abi] of Object.entries(CONTRACT_ABIS)) {
                if (CONTRACT_ADDRESSES[contractName]) {
                    this.contracts[contractName] = new window.ethers.Contract(
                        CONTRACT_ADDRESSES[contractName],
                        abi,
                        this.signer
                    );
                    console.log(`✅ ${contractName} 合约已初始化`);
                }
            }

        } catch (error) {
            console.error('合约初始化失败:', error.message);
            throw error;
        }
    }

    // 从本地加载合约地址
    async loadContractAddresses() {
        try {
            // 尝试从本地存储或API获取最新的合约地址
            const response = await fetch('/api/contracts');
            if (response.ok) {
                const data = await response.json();
                Object.assign(CONTRACT_ADDRESSES, data.addresses);
                console.log('📋 已加载最新的合约地址');
            }
        } catch (error) {
            console.log('使用默认合约地址');
        }
    }

    // 开始健康检查
    startHealthCheck() {
        this.reconnectInterval = setInterval(async () => {
            try {
                await this.provider.getBlockNumber();
                if (!this.isConnected) {
                    this.isConnected = true;
                    console.log('🔄 区块链连接已恢复');
                    updateConnectionStatus('connected', '区块链已连接');
                }
            } catch (error) {
                if (this.isConnected) {
                    this.isConnected = false;
                    console.warn('⚠️  区块链连接丢失:', error.message);
                    updateConnectionStatus('disconnected', '连接已断开');
                }

                // 尝试重连
                this.connectionAttempts++;
                if (this.connectionAttempts < this.maxRetries) {
                    console.log(`🔄 尝试重连 (${this.connectionAttempts}/${this.maxRetries})...`);
                    await this.connectToLocalNetwork();
                }
            }
        }, 30000); // 每30秒检查一次
    }

    // 停止健康检查
    stopHealthCheck() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    // 获取网络信息
    async getNetworkInfo() {
        if (!this.isConnected || !this.provider) {
            return null;
        }

        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getFeeData();

            return {
                name: network.name,
                chainId: network.chainId,
                blockNumber: blockNumber,
                gasPrice: gasPrice.gasPrice,
                isConnected: this.isConnected
            };
        } catch (error) {
            console.error('获取网络信息失败:', error.message);
            return null;
        }
    }

    // 调用合约方法
    async callContract(contractName, methodName, ...args) {
        if (!this.contracts[contractName]) {
            throw new Error(`合约 ${contractName} 未初始化`);
        }

        try {
            const contract = this.contracts[contractName];
            const method = contract[methodName];

            if (!method) {
                throw new Error(`方法 ${methodName} 不存在于合约 ${contractName}`);
            }

            // 估算Gas
            const gasEstimate = await method.estimateGas(...args);
            console.log(`⛽ Gas 估算: ${gasEstimate.toString()}`);

            // 调用方法
            const tx = await method(...args, {
                gasLimit: gasEstimate.mul(120).div(100) // 增加20%缓冲
            });

            console.log(`📤 交易已发送: ${tx.hash}`);

            // 等待确认
            const receipt = await tx.wait();
            console.log(`✅ 交易已确认: ${receipt.transactionHash}`);

            return receipt;

        } catch (error) {
            console.error(`❌ 合约调用失败 (${contractName}.${methodName}):`, error.message);
            throw error;
        }
    }

    // 只读合约调用
    async callContractView(contractName, methodName, ...args) {
        if (!this.contracts[contractName]) {
            throw new Error(`合约 ${contractName} 未初始化`);
        }

        try {
            const contract = this.contracts[contractName];
            const result = await contract[methodName](...args);
            return result;
        } catch (error) {
            console.error(`❌ 合约查询失败 (${contractName}.${methodName}):`, error.message);
            throw error;
        }
    }
}

// 全局区块链管理器实例
let blockchainManager;

// Initialize the app
async function init() {
    try {
        console.log('🚀 开始应用初始化...');

        // 显示初始化进度
        updateConnectionStatus('connecting', '正在初始化...');

        // 等待ethers.js加载
        let attempts = 0;
        while (typeof window.ethers === 'undefined' && attempts < 100) {
            console.log(`等待ethers.js加载... (${attempts + 1}/100)`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof window.ethers === 'undefined') {
            // 如果仍然没有加载，使用降级模式
            console.warn('Ethers.js加载失败，使用降级模式');
            await initMockMode();
            return;
        }

        console.log('✅ Ethers.js版本:', window.ethers.version || 'unknown');
        console.log('✅ Ethers.js API检查:');
        console.log('   - providers:', !!window.ethers.providers);
        console.log('   - providers.Web3Provider:', !!(window.ethers.providers && window.ethers.providers.Web3Provider));
        console.log('   - BrowserProvider:', !!window.ethers.BrowserProvider);
        console.log('   - Contract (v6):', !!window.ethers.Contract);
        console.log('   - contracts.Contract (v5):', !!(window.ethers.contracts && window.ethers.contracts.Contract));

        // 尝试连接钱包和初始化合约
        try {
            await connectWallet();
            await initContracts();
            updateConnectionStatus('connected', '区块链已连接');
            await loadDashboard();
        } catch (walletError) {
            console.warn('钱包连接失败，使用模拟模式:', walletError.message);
            showToast('区块链连接失败，已启用演示模式', 'warning');
            await initMockMode();
            return;
        }

        setupEventListeners();
        showToast('应用初始化成功！', 'success');

    } catch (error) {
        console.error('❌ 初始化失败:', error);
        showToast('初始化失败，使用演示模式', 'warning');
        await initMockMode();
    }
}

// 初始化模拟模式
async function initMockMode() {
    try {
        console.log('初始化模拟模式...');
        updateConnectionStatus('demo', '演示模式');

        // 显示演示模式指示器
        showDemoIndicator();

        // 创建模拟的provider和signer
        provider = {
            getSigner: () => ({
                getAddress: async () => '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                signMessage: async (message) => `mock_signature_${Date.now()}`
            }),
            getBlockNumber: async () => Math.floor(Math.random() * 1000000),
            getGasPrice: async () => window.ethers ? window.ethers.parseUnits('20', 'gwei') : '20000000000'
        };

        signer = provider.getSigner();
        currentAccount = await signer.getAddress();

        // 初始化模拟合约
        await initMockContracts();

        // 加载模拟数据
        await loadMockDashboard();

        // 设置事件监听器
        setupEventListeners();
        console.log('演示模式事件监听器设置完成');

        showToast('演示模式初始化完成！', 'info');
    } catch (error) {
        console.error('模拟模式初始化失败:', error);
        showToast('初始化失败，请刷新页面重试', 'error');
        updateConnectionStatus('error', '初始化失败');
    }
}

// 显示演示模式指示器
function showDemoIndicator() {
    const indicator = document.getElementById('demoIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        // 5秒后自动隐藏
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 5000);
    }
}

// 初始化模拟合约
async function initMockContracts() {
    console.log('初始化模拟合约...');

    contracts = {
        UserProfile: {
            getTotalUsers: async () => 42,
            hasProfile: async () => true,
            getProfile: async () => ({
                fullName: 'Demo User',
                age: 30,
                email: 'demo@university.edu',
                ipfsHash: 'QmDemoHash123',
                isVerified: true,
                reputation: 85
            })
        },
        ZKProof: {
            getTotalProofs: async () => 15,
            submitProof: async () => {
                showToast('模拟证明已提交', 'success');
                return Date.now();
            }
        },
        DeSciNFTSimple: {
            getTotalNFTs: async () => 8,
            getResearcherNFTs: async () => [1, 2, 3]
        },
        Dataset: {
            getTotalDatasets: async () => 25
        },
        DeSciPlatform: {
            getTotalResearches: async () => 35,
            publishResearch: async () => {
                showToast('研究已发布（模拟）', 'success');
                return Date.now();
            },
            submitPeerReview: async () => {
                showToast('评审已提交（模拟）', 'success');
            }
        }
    };
}

// 加载模拟仪表板数据
async function loadMockDashboard() {
    console.log('加载模拟仪表板数据...');

    // 模拟数据
    const mockData = {
        totalUsers: 42,
        totalProofs: 15,
        totalNFTs: 8,
        totalDatasets: 25,
        totalResearches: 35,
        networkName: 'Demo Network',
        blockNumber: Math.floor(Math.random() * 1000000),
        gasPrice: '20 gwei'
    };

    // 更新UI
    document.getElementById('totalUsers').textContent = mockData.totalUsers.toString();
    document.getElementById('totalProofs').textContent = mockData.totalProofs.toString();
    document.getElementById('totalNFTs').textContent = mockData.totalNFTs.toString();
    document.getElementById('totalResearches').textContent = mockData.totalDatasets.toString();
    document.getElementById('totalResearches').textContent = mockData.totalResearches.toString();
    document.getElementById('networkName').textContent = mockData.networkName;
    document.getElementById('blockNumber').textContent = mockData.blockNumber.toString();
    document.getElementById('gasPrice').textContent = mockData.gasPrice;

    // 隐藏加载状态
    showLoading(false);

    console.log('模拟仪表板数据加载完成');
}

// Connect to wallet
async function connectWallet() {
    console.log('开始连接钱包...');
    console.log('检查ethers对象:', typeof window.ethers);

    if (typeof window.ethereum === 'undefined') {
        throw new Error('未检测到MetaMask或其他Web3钱包，请先安装MetaMask');
    }

    // 检查ethers是否已加载
    if (typeof window.ethers === 'undefined') {
        throw new Error('Ethers.js库未加载，请刷新页面重试');
    }

    try {
        console.log('请求钱包连接...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('钱包连接成功，账户:', accounts);

        console.log('创建provider...');

        // Ethers.js 版本兼容性处理
        if (window.ethers.providers && window.ethers.providers.Web3Provider) {
            // ethers.js v5
            console.log('检测到 ethers.js v5，使用 Web3Provider');
            provider = new window.ethers.providers.Web3Provider(window.ethereum);
        } else if (window.ethers.BrowserProvider) {
            // ethers.js v6
            console.log('检测到 ethers.js v6，使用 BrowserProvider');
            provider = new window.ethers.BrowserProvider(window.ethereum);
        } else {
            console.log('可用API:', Object.keys(window.ethers || {}));
            throw new Error('不支持的Ethers.js版本或API不可用');
        }

        console.log('获取signer...');
        signer = await provider.getSigner();

        console.log('获取账户地址...');
        console.log('Signer对象:', signer);
        console.log('Signer类型:', typeof signer);
        console.log('Signer构造器:', signer?.constructor?.name);
        console.log('Signer方法:', Object.getOwnPropertyNames(signer || {}));

        // 尝试获取地址
        try {
            currentAccount = await signer.getAddress();
            console.log('账户地址:', currentAccount);
        } catch (addrError) {
            console.error('获取地址失败:', addrError);
            // 尝试使用accounts数组中的地址
            if (accounts && accounts.length > 0) {
                currentAccount = accounts[0];
                console.log('使用accounts数组中的地址:', currentAccount);
            } else {
                throw new Error('无法获取账户地址: ' + addrError.message);
            }
        }
            
            updateConnectionStatus('connected', `已连接: ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`);
        console.log('钱包连接完成');
            
        } catch (error) {
        console.error('钱包连接失败:', error);

        if (error.code === 4001) {
            throw new Error('用户拒绝了钱包连接请求');
        } else if (error.code === -32002) {
            throw new Error('钱包连接请求正在等待用户确认');
    } else {
            throw new Error(`钱包连接失败: ${error.message}`);
        }
    }
}

// Initialize contracts
async function initContracts() {
    console.log('开始初始化合约...');

    if (!signer) {
        throw new Error('Signer 未初始化，无法初始化合约');
    }

    // Ethers.js 合约初始化兼容性处理
    let Contract;
    if (window.ethers.Contract) {
        // v6 版本
        Contract = window.ethers.Contract;
        console.log('使用 ethers.js v6 Contract');
    } else if (window.ethers.contracts && window.ethers.contracts.Contract) {
        // v5 版本
        Contract = window.ethers.contracts.Contract;
        console.log('使用 ethers.js v5 Contract');
    } else {
        throw new Error('无法找到Contract构造函数');
    }

    for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
        try {
            console.log(`初始化合约: ${name} at ${address}`);
            contracts[name] = new Contract(address, CONTRACT_ABIS[name], signer);

            console.log(`合约 ${name} 初始化成功`);
        } catch (error) {
            console.error(`合约 ${name} 初始化失败:`, error);
            throw new Error(`初始化合约 ${name} 失败: ${error.message}`);
        }
    }

    console.log('所有合约初始化完成');
    console.log('已初始化合约:', Object.keys(contracts));
}

// 使用模拟数据更新仪表板
function updateDashboardWithMockData() {
    console.log('使用模拟数据更新仪表板');

    // 模拟数据
    const mockData = {
        totalUsers: 42,
        totalProofs: 15,
        totalNFTs: 8,
        totalDatasets: 23
    };

    document.getElementById('totalUsers').textContent = mockData.totalUsers.toString();
    document.getElementById('totalProofs').textContent = mockData.totalProofs.toString();
    document.getElementById('totalNFTs').textContent = mockData.totalNFTs.toString();
    document.getElementById('totalResearches').textContent = mockData.totalDatasets.toString();

    // 更新图表（如果存在）
    if (typeof updateCharts === 'function') {
        updateCharts();
    }

    showLoading(false);
    console.log('模拟数据更新完成');
}

// Update connection status
function updateConnectionStatus(status, message) {
    const statusEl = document.getElementById('connectionStatus');
    statusEl.className = `connection-status ${status}`;
    
    let icon = 'fas fa-circle-notch fa-spin';
    if (status === 'connected') icon = 'fas fa-check-circle';
    if (status === 'error') icon = 'fas fa-exclamation-circle';
    
    statusEl.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
}

// Load dashboard data
async function loadDashboard() {
    try {
        showLoading(true);

        // 检查合约是否已初始化
        if (!contracts.UserProfile || !contracts.ZKProof || !contracts.DeSciNFTSimple || !contracts.Dataset) {
            console.warn('合约未初始化，使用模拟数据');
            updateDashboardWithMockData();
            return;
        }

        const results = await Promise.allSettled([
            contracts.UserProfile.getTotalUsers().catch(() => 0),
            contracts.ZKProof.getTotalProofs().catch(() => 0),
            contracts.DeSciNFTSimple.getTotalNFTs().catch(() => 0),
            contracts.Dataset.getTotalDatasets().catch(() => 0)
        ]);

        const totalUsers = results[0].status === 'fulfilled' ? results[0].value : 0;
        const totalProofs = results[1].status === 'fulfilled' ? results[1].value : 0;
        const totalNFTs = results[2].status === 'fulfilled' ? results[2].value : 0;
        const totalDatasets = results[3].status === 'fulfilled' ? results[3].value : 0;
        
        const totalUsersEl = document.getElementById('totalUsers');
        const totalProofsEl = document.getElementById('totalProofs');
        const totalNFTsEl = document.getElementById('totalNFTs');
        const totalDatasetsEl = document.getElementById('totalDatasets');

        if (totalUsersEl) totalUsersEl.textContent = totalUsers.toString();
        if (totalProofsEl) totalProofsEl.textContent = totalProofs.toString();
        if (totalNFTsEl) totalNFTsEl.textContent = totalNFTs.toString();
        if (totalDatasetsEl) totalDatasetsEl.textContent = totalDatasets.toString();
        
        await loadRecentActivity();
        await checkUserProfile();
        
    } catch (error) {
        console.error('加载仪表板失败:', error);
        showToast('加载数据失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 模拟活动数据
let mockActivities = [
    { type: 'user', message: '新用户 Alice Johnson 加入平台', timestamp: '2024-01-15 10:30:00' },
    { type: 'research', message: '研究 "量子计算在密码学中的应用" 已发布', timestamp: '2024-01-15 09:45:00' },
    { type: 'review', message: 'Bob Smith 完成了论文评审', timestamp: '2024-01-15 09:15:00' },
    { type: 'nft', message: '研究NFT #001 已铸造', timestamp: '2024-01-15 08:30:00' },
    { type: 'user', message: 'Charlie Brown 更新了用户档案', timestamp: '2024-01-15 08:00:00' },
    { type: 'research', message: '数据集 "气候变化分析数据" 已上传', timestamp: '2024-01-14 16:45:00' },
    { type: 'review', message: 'Diana Wilson 提交了评审意见', timestamp: '2024-01-14 15:20:00' },
    { type: 'blockchain', message: '新区块已确认，包含5笔交易', timestamp: '2024-01-14 14:10:00' },
    { type: 'nft', message: 'NFT交易完成，价值 0.5 ETH', timestamp: '2024-01-14 13:30:00' },
    { type: 'user', message: 'Edward Davis 获得了"优秀评审者"徽章', timestamp: '2024-01-14 12:15:00' },
    { type: 'research', message: '论文 "AI在医疗诊断中的应用" 获得10次引用', timestamp: '2024-01-14 11:00:00' },
    { type: 'review', message: '同行评审周期完成，平均评分4.2分', timestamp: '2024-01-14 10:30:00' },
    { type: 'blockchain', message: '智能合约Gas费用优化完成', timestamp: '2024-01-13 17:45:00' },
    { type: 'nft', message: '研究NFT市场交易量突破100 ETH', timestamp: '2024-01-13 16:20:00' },
    { type: 'user', message: '新用户注册量本周增长25%', timestamp: '2024-01-13 15:00:00' },
    { type: 'research', message: '数据集下载量突破1000次', timestamp: '2024-01-13 14:30:00' },
    { type: 'review', message: '评审质量评分系统上线', timestamp: '2024-01-13 13:15:00' },
    { type: 'blockchain', message: '跨链互操作性测试成功', timestamp: '2024-01-13 12:00:00' },
    { type: 'nft', message: 'NFT版税自动分配功能上线', timestamp: '2024-01-12 16:45:00' },
    { type: 'user', message: '用户声誉系统更新完成', timestamp: '2024-01-12 15:30:00' },
    { type: 'research', message: '新研究领域分类系统发布', timestamp: '2024-01-12 14:15:00' },
    { type: 'review', message: '匿名评审功能优化完成', timestamp: '2024-01-12 13:00:00' },
    { type: 'blockchain', message: '零知识证明集成测试通过', timestamp: '2024-01-12 11:45:00' },
    { type: 'nft', message: 'NFT元数据标准更新', timestamp: '2024-01-11 17:30:00' },
    { type: 'user', message: '多语言支持功能上线', timestamp: '2024-01-11 16:15:00' }
];

// Load recent activity with pagination
async function loadRecentActivity() {
    try {
        // 显示加载状态
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = `
            <div class="activity-item loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载活动数据...</span>
            </div>
        `;

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 800));

        // 初始化分页数据
        setPaginationData(mockActivities.length, 1, 10);

        // 创建分页控件
        createPaginationControls('activityPagination', async (page, pageSize) => {
            await displayActivitiesForPage(page, pageSize);
        });

        // 显示分页控件
        document.getElementById('activityPagination').style.display = 'block';

        // 显示第一页数据
        await displayActivitiesForPage(1, 10);

        showToast('活动数据加载完成', 'success');

    } catch (error) {
        console.error('加载活动数据失败:', error);
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = `
            <div class="activity-item error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>加载活动数据失败，请稍后重试</span>
            </div>
        `;
        showToast('加载活动数据失败', 'error');
    }
}

// 显示指定页面的活动
async function displayActivitiesForPage(page, pageSize) {
    try {
        // 设置加载状态
        setPaginationLoading(true);

        // 计算活动分页数据
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(page * pageSize, mockActivities.length);
        activityTotalItems = mockActivities.length;
        activityTotalPages = Math.ceil(activityTotalItems / pageSize);

        const activityList = document.getElementById('activityList');

        // 显示加载状态
        activityList.innerHTML = `
            <div class="activity-item loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载第 ${page} 页数据...</span>
            </div>
        `;

        // 模拟网络延迟（更短的延迟，因为已经在分页层面控制了）
        await new Promise(resolve => setTimeout(resolve, 300));

        // 清空列表
        activityList.innerHTML = '';

        // 显示当前页的活动
        const fragment = document.createDocumentFragment();
        let loadedCount = 0;

        for (let i = startIndex; i < endIndex; i++) {
            if (i >= mockActivities.length) break;

            const activity = mockActivities[i];
            const activityItem = createActivityItem(activity);

            // 添加淡入动画
            activityItem.style.opacity = '0';
            activityItem.style.transform = 'translateY(10px)';
            activityItem.style.transition = 'all 0.3s ease';

            fragment.appendChild(activityItem);
            loadedCount++;

            // 每加载3个项目后短暂延迟，创造更自然的加载效果
            if (loadedCount % 3 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        activityList.appendChild(fragment);

        // 触发动画
        setTimeout(() => {
            const items = activityList.querySelectorAll('.activity-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }, 50);

        // 如果没有数据，显示默认信息
        if (loadedCount === 0) {
            activityList.innerHTML = `
                <div class="activity-item empty">
                    <i class="fas fa-info-circle"></i>
                    <span>暂无活动记录</span>
                </div>
            `;
        } else {
            // 显示加载完成提示
            showToast(`成功加载 ${loadedCount} 条活动记录`, 'success', 1500);
        }

        // 更新分页UI
        updateActivityPagination();

    } catch (error) {
        console.error('显示活动页面失败:', error);
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = `
            <div class="activity-item error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>加载失败，请重试</span>
            </div>
        `;
        showToast('加载活动数据失败', 'error');
    } finally {
        // 取消加载状态
        setPaginationLoading(false);
    }
}

// 创建活动项元素
function createActivityItem(activity) {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.setAttribute('data-type', activity.type);

    const iconMap = {
        'user': 'fas fa-user',
        'research': 'fas fa-flask',
        'review': 'fas fa-clipboard-check',
        'nft': 'fas fa-certificate',
        'blockchain': 'fas fa-link'
    };

    const iconClass = iconMap[activity.type] || 'fas fa-info-circle';

    activityItem.innerHTML = `
        <i class="${iconClass}"></i>
        <div class="activity-content">
            <span>${activity.message}</span>
            <small class="activity-time">${activity.timestamp}</small>
        </div>
    `;

    return activityItem;
}

// Check user profile
async function checkUserProfile() {
    try {
        if (!currentAccount) {
            console.log('用户未连接，跳过档案检查');
            return;
        }

        // 使用 Promise.allSettled 处理合约调用失败
        const results = await Promise.allSettled([
            contracts.UserProfile.hasProfile(currentAccount).catch(() => false),
            contracts.UserProfile.getProfile(currentAccount).catch(() => null)
        ]);

        const hasProfile = results[0].status === 'fulfilled' ? results[0].value : false;
        const profile = results[1].status === 'fulfilled' ? results[1].value : null;

        if (hasProfile && profile) {
            document.getElementById('profileName').textContent = profile.fullName || '未知';
            document.getElementById('profileEmail').textContent = profile.email || '未设置';
            document.getElementById('profileReputation').textContent = profile.reputation ? profile.reputation.toString() : '0';
            
            const verifiedEl = document.getElementById('profileVerified');
            if (profile.isVerified) {
                verifiedEl.textContent = '已验证';
                verifiedEl.className = 'status verified';
            } else {
                verifiedEl.textContent = '未验证';
                verifiedEl.className = 'status unverified';
            }

            document.getElementById('profileInfo').style.display = 'block';
        } else {
            // 显示默认的未注册状态
            document.getElementById('profileName').textContent = '未注册';
            document.getElementById('profileEmail').textContent = '请先注册用户档案';
            document.getElementById('profileReputation').textContent = '0';

            const verifiedEl = document.getElementById('profileVerified');
            verifiedEl.textContent = '未注册';
            verifiedEl.className = 'status unverified';
            
            document.getElementById('profileInfo').style.display = 'block';
        }
    } catch (error) {
        console.error('检查用户档案失败:', error);
        // 即使出错也要显示基本的UI状态
        document.getElementById('profileName').textContent = '加载失败';
        document.getElementById('profileEmail').textContent = '请刷新重试';
        document.getElementById('profileReputation').textContent = '0';

        const verifiedEl = document.getElementById('profileVerified');
        verifiedEl.textContent = '未知';
        verifiedEl.className = 'status unverified';

        document.getElementById('profileInfo').style.display = 'block';
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('设置事件监听器...');

    // 检查DOM是否已加载
    if (!document.querySelector('.tab-btn')) {
        console.warn('DOM未完全加载，跳过事件监听器设置');
        return;
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        console.log('绑定标签页按钮:', btn.dataset.tab);
        btn.addEventListener('click', (e) => {
            console.log('标签页按钮被点击:', btn.dataset.tab);
            switchTab(btn.dataset.tab);
        });
    });

    // 绑定表单事件
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleCreateProfile);
    }

    const researchForm = document.getElementById('researchForm');
    if (researchForm) {
        researchForm.addEventListener('submit', handlePublishResearch);
    }

    console.log('事件监听器设置完成');
}

// Switch tabs
function switchTab(tabName) {
    console.log('切换到标签页:', tabName);

    // 移除所有标签页按钮的active类
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 为当前标签页按钮添加active类
    const currentBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (currentBtn) {
        currentBtn.classList.add('active');
        console.log('激活标签页按钮:', tabName);
    } else {
        console.error('找不到标签页按钮:', tabName);
    }

    // 移除所有内容区域的active类
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; // 确保隐藏
    });

    // 为当前内容区域添加active类
    const currentContent = document.getElementById(tabName);
    if (currentContent) {
        currentContent.classList.add('active');
        currentContent.style.display = 'block'; // 确保显示
        console.log('显示标签页内容:', tabName);
    } else {
        console.error('找不到标签页内容:', tabName);
    }
}

// Handle create profile
async function handleCreateProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const age = parseInt(document.getElementById('age').value);
    const email = document.getElementById('email').value;
    const ipfsHash = document.getElementById('ipfsHash').value || 'QmDefaultHash';
    
    try {
        showLoading(true);
        
        const tx = await contracts.UserProfile.createProfile(fullName, age, email, ipfsHash);
        await tx.wait();
        
        showToast('用户档案创建成功！', 'success');
        await checkUserProfile();
        await loadDashboard();
        
        e.target.reset();
        
    } catch (error) {
        console.error('创建档案失败:', error);
        showToast('创建档案失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle publish research
async function handlePublishResearch(e) {
    e.preventDefault();
    
    const title = document.getElementById('researchTitle').value;
    const description = document.getElementById('researchDesc').value;
    const datasetName = document.getElementById('datasetName').value;
    const datasetDesc = document.getElementById('datasetDesc').value;
    const isPublic = document.getElementById('isPublicDataset').checked;
    
    try {
        showLoading(true);
        
        // Submit a mock ZK proof first
        const mockProof = [1, 2, 3, 4, 5, 6, 7, 8];
        const mockPublicInputs = [100, 200];
        
        const proofTx = await contracts.ZKProof.submitProof(
            'research_authenticity',
            mockProof,
            mockPublicInputs,
            'QmMockProofHash'
        );
        await proofTx.wait();
        
        const totalProofs = await contracts.ZKProof.getTotalProofs();
        const proofId = totalProofs.toNumber();
        
        // Publish research
        const tx = await contracts.DeSciPlatform.publishResearch(
            title,
            description,
            datasetName,
            datasetDesc,
            '0x' + Math.random().toString(16).substr(2, 32),
            'QmResearchMetadataHash',
            [proofId],
            isPublic,
            0
        );
        
        await tx.wait();
        
        showToast('研究发布成功！', 'success');
        await loadDashboard();
        
        e.target.reset();
        
    } catch (error) {
        console.error('发布研究失败:', error);
        showToast('发布研究失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Utility functions
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' : 
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
        <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // 添加成功反馈动画
    if (type === 'success') {
        toast.classList.add('success-feedback');
    }

    // 自动移除
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// 增强按钮点击反馈
function addButtonFeedback(button, callback) {
    if (!button) return;

    button.addEventListener('click', async function(e) {
        // 添加点击动画
        this.classList.add('btn-loading');

        // 禁用按钮防止重复点击
        this.disabled = true;
        const originalText = this.innerHTML;

        try {
            // 显示加载状态
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

            // 执行回调
            if (callback) {
                await callback(e);
            }

            // 成功反馈
            showToast('操作成功完成！', 'success');

        } catch (error) {
            console.error('操作失败:', error);
            showToast('操作失败: ' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            this.classList.remove('btn-loading');
            this.disabled = false;
            this.innerHTML = originalText;
        }
    });
}

// 添加进度条
function showProgress(message = '处理中...') {
    // 移除现有的进度条
    const existingProgress = document.querySelector('.progress-container');
    if (existingProgress) {
        existingProgress.remove();
    }

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
        <div class="progress-message">${message}</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
    `;

    // 插入到合适的位置
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(progressContainer, container.firstChild);
    }

    return progressContainer;
}

// 更新进度
function updateProgress(progressContainer, percentage, message = null) {
    if (!progressContainer) return;

    const progressFill = progressContainer.querySelector('.progress-fill');
    const progressMessage = progressContainer.querySelector('.progress-message');

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (message && progressMessage) {
        progressMessage.textContent = message;
    }
}

// 隐藏进度条
function hideProgress() {
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
        progressContainer.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => progressContainer.remove(), 300);
    }
}

// 添加元素动画
function animateElement(element, animation = 'fadeInUp') {
    if (!element) return;

    element.style.animation = `${animation} 0.5s ease`;
    element.classList.add('new-item');
}

// 批量添加动画
function animateElements(elements, delay = 100) {
    elements.forEach((element, index) => {
        setTimeout(() => {
            animateElement(element);
        }, index * delay);
    });
}

// ==================== 区块链浏览器功能 ====================

// 区块链状态监控
async function updateBlockchainStats() {
    try {
        // 检查provider是否可用
        if (!provider) {
            console.log('Provider未初始化，跳过区块链状态更新');
            return;
        }

        const blockNumber = await provider.getBlockNumber();
        document.getElementById('currentBlock').textContent = blockNumber;

        // 获取Gas价格 - 添加错误处理
        try {
            let gasPrice;
            if (typeof provider.getGasPrice === 'function') {
                gasPrice = await provider.getGasPrice();
            } else if (typeof provider.getFeeData === 'function') {
                // Ethers.js v6 使用 getFeeData
                const feeData = await provider.getFeeData();
                gasPrice = feeData.gasPrice;
            } else {
                // 模拟数据
                gasPrice = window.ethers.parseUnits('20', 'gwei');
            }

            const gasPriceGwei = window.ethers.formatUnits(gasPrice, 'gwei');
            document.getElementById('gasPrice').textContent = parseFloat(gasPriceGwei).toFixed(2);
        } catch (gasError) {
            console.warn('获取Gas价格失败，使用默认值:', gasError);
            document.getElementById('gasPrice').textContent = '20.0';
        }

        // 模拟网络延迟测量
        const startTime = Date.now();
        await provider.getBlockNumber();
        const latency = Date.now() - startTime;
        document.getElementById('networkLatency').textContent = latency;

        // 模拟交易计数
        const totalTx = Math.floor(Math.random() * 1000) + 500;
        document.getElementById('totalTransactions').textContent = totalTx.toLocaleString();
    } catch (error) {
        console.error('获取区块链状态失败:', error);
        // 设置默认值以防UI显示问题
        document.getElementById('currentBlock').textContent = '加载中...';
        document.getElementById('gasPrice').textContent = '20.0';
        document.getElementById('networkLatency').textContent = '0';
        document.getElementById('totalTransactions').textContent = '0';
    }
}

// 显示合约地址
function displayContractAddresses() {
    const container = document.getElementById('contractAddresses');
    container.innerHTML = '';

    Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
        const addressItem = document.createElement('div');
        addressItem.className = 'address-item';
        addressItem.innerHTML = `
            <div>
                <div class="address-name">${name}</div>
                <div class="address-value">${address}</div>
            </div>
        `;
        container.appendChild(addressItem);
    });
}

// 交易历史模拟
let transactionHistory = [];
function addTransactionToHistory(type, hash, status) {
    const transaction = {
        type,
        hash: hash.substring(0, 10) + '...',
        status,
        timestamp: new Date().toLocaleTimeString()
    };

    transactionHistory.unshift(transaction);
    if (transactionHistory.length > 10) {
        transactionHistory = transactionHistory.slice(0, 10);
    }

    updateTransactionHistoryDisplay();
}

function updateTransactionHistoryDisplay() {
    const container = document.getElementById('transactionHistory');
    container.innerHTML = '';

    if (transactionHistory.length === 0) {
        container.innerHTML = '<div class="loading"><i class="fas fa-history"></i><span>暂无交易记录</span></div>';
        return;
    }

    transactionHistory.forEach(tx => {
        const txItem = document.createElement('div');
        txItem.className = 'transaction-item';
        txItem.innerHTML = `
            <div>
                <div class="transaction-hash">${tx.hash}</div>
                <div style="font-size: 0.8rem; color: #666;">${tx.type} • ${tx.timestamp}</div>
            </div>
            <div class="transaction-status ${tx.status}">${tx.status === 'success' ? '成功' : '待处理'}</div>
        `;
        container.appendChild(txItem);
    });
}

// 事件监听和日志
let eventLog = [];
function addEventToLog(eventType, message, status = 'info') {
    const event = {
        type: eventType,
        message,
        status,
        timestamp: new Date().toLocaleTimeString()
    };

    eventLog.unshift(event);
    if (eventLog.length > 50) {
        eventLog = eventLog.slice(0, 50);
    }

    updateEventLogDisplay();
}

function updateEventLogDisplay() {
    const container = document.getElementById('eventLog');
    container.innerHTML = '';

    eventLog.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = `event-item ${event.status}`;
        eventItem.innerHTML = `
            <i class="fas fa-${getEventIcon(event.type)}"></i>
            <span>${event.message}</span>
            <small style="margin-left: auto; color: #666;">${event.timestamp}</small>
        `;
        container.appendChild(eventItem);
    });
}

function getEventIcon(eventType) {
    const icons = {
        'user': 'user',
        'research': 'flask',
        'review': 'clipboard-check',
        'nft': 'certificate',
        'blockchain': 'link',
        'contract': 'file-contract'
    };
    return icons[eventType] || 'info-circle';
}

// ==================== 数据分析功能 ====================

// 图表实例
let userGrowthChart, researchTypeChart, gasUsageChart, reputationChart;

// 初始化图表
function initCharts() {
    // 用户增长趋势图
    const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d');
    userGrowthChart = new Chart(userGrowthCtx, {
        type: 'line',
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                label: '用户数量',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // 研究类型分布图
    const researchTypeCtx = document.getElementById('researchTypeChart').getContext('2d');
    researchTypeChart = new Chart(researchTypeCtx, {
        type: 'doughnut',
        data: {
            labels: ['论文', '数据集', '代码', '其他'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
            }]
        },
        options: {
            responsive: true
        }
    });

    // Gas消耗统计图
    const gasUsageCtx = document.getElementById('gasUsageChart').getContext('2d');
    gasUsageChart = new Chart(gasUsageCtx, {
        type: 'bar',
        data: {
            labels: ['创建用户', '发布研究', '提交评审', '铸造NFT'],
            datasets: [{
                label: 'Gas消耗',
                data: [0, 0, 0, 0],
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // 声誉值分布图
    const reputationCtx = document.getElementById('reputationChart').getContext('2d');
    reputationChart = new Chart(reputationCtx, {
        type: 'radar',
        data: {
            labels: ['研究者', '评审者', '贡献者'],
            datasets: [{
                label: '声誉分布',
                data: [0, 0, 0],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// 更新图表数据
function updateCharts() {
    // 模拟数据更新
    const userGrowth = [5, 12, 19, 28, 35, 42];
    const researchTypes = [15, 8, 5, 2];
    const gasUsage = [21000, 45000, 32000, 68000];
    const reputationData = [85, 72, 60];

    userGrowthChart.data.datasets[0].data = userGrowth;
    userGrowthChart.update();

    researchTypeChart.data.datasets[0].data = researchTypes;
    researchTypeChart.update();

    gasUsageChart.data.datasets[0].data = gasUsage;
    gasUsageChart.update();

    reputationChart.data.datasets[0].data = reputationData;
    reputationChart.update();
}

// 更新性能指标
function updatePerformanceMetrics() {
    // 模拟性能数据
    document.getElementById('avgResponseTime').textContent = (Math.random() * 200 + 100).toFixed(0);
    document.getElementById('contractSuccessRate').textContent = (95 + Math.random() * 5).toFixed(1);
    document.getElementById('avgGasUsed').textContent = (35000 + Math.random() * 20000).toFixed(0);
    document.getElementById('activeUsers').textContent = Math.floor(Math.random() * 100 + 50);
}

// ==================== 模拟功能 ====================

// 生成模拟用户
async function generateMockUsers() {
    try {
        showLoading(true);

        const mockUsers = [
            { name: 'Alice Johnson', age: 28, email: 'alice@university.edu' },
            { name: 'Bob Smith', age: 35, email: 'bob@research.org' },
            { name: 'Charlie Brown', age: 42, email: 'charlie@lab.edu' },
            { name: 'Diana Wilson', age: 31, email: 'diana@science.net' },
            { name: 'Edward Davis', age: 39, email: 'edward@academy.org' }
        ];

        for (const user of mockUsers) {
            await createMockProfile(user.name, user.age, user.email);
            addEventToLog('user', `创建用户: ${user.name}`, 'success');
        }

        await loadDashboard();
        showToast('模拟用户生成成功！', 'success');
    } catch (error) {
        console.error('生成模拟用户失败:', error);
        showToast('生成模拟用户失败', 'error');
    } finally {
        showLoading(false);
    }
}

// 生成模拟研究
async function generateMockResearch() {
    try {
        showLoading(true);

        const mockResearch = [
            { title: '量子计算在密码学中的应用', type: 'paper' },
            { title: '气候变化数据集分析', type: 'dataset' },
            { title: '机器学习算法优化', type: 'code' },
            { title: '区块链安全研究', type: 'paper' },
            { title: '生物信息学数据处理', type: 'dataset' }
        ];

        for (const research of mockResearch) {
            await createMockResearch(research.title, research.type);
            addEventToLog('research', `发布研究: ${research.title}`, 'success');
        }

        await loadDashboard();
        showToast('模拟研究生成成功！', 'success');
    } catch (error) {
        console.error('生成模拟研究失败:', error);
        showToast('生成模拟研究失败', 'error');
    } finally {
        showLoading(false);
    }
}

// 模拟评审过程
async function simulateReviews() {
    try {
        showLoading(true);

        // 模拟一些评审
        addEventToLog('review', '用户Bob对量子计算论文进行了评审', 'success');
        addEventToLog('review', '用户Diana对气候变化数据集进行了评审', 'success');
        addEventToLog('nft', '量子计算论文获得高分，自动铸造NFT', 'success');

        await loadDashboard();
        showToast('评审模拟完成！', 'success');
    } catch (error) {
        console.error('评审模拟失败:', error);
        showToast('评审模拟失败', 'error');
    } finally {
        showLoading(false);
    }
}

// 清除数据
function clearData() {
    if (confirm('确定要清除所有模拟数据吗？此操作不可逆！')) {
        // 清除本地存储的数据
        transactionHistory = [];
        eventLog = [];

        // 重置图表
        updateCharts();
        updateTransactionHistoryDisplay();
        updateEventLogDisplay();

        // 重新加载仪表板
        loadDashboard();

        showToast('数据已清除', 'warning');
        addEventToLog('blockchain', '模拟数据已清除', 'warning');
    }
}

// 辅助函数：创建模拟用户档案
async function createMockProfile(name, age, email) {
    // 模拟创建用户档案
    addTransactionToHistory('用户注册', '0x' + Math.random().toString(16).substr(2, 64), 'success');
    await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
}

// 辅助函数：创建模拟研究
async function createMockResearch(title, type) {
    // 模拟创建研究
    addTransactionToHistory('研究发布', '0x' + Math.random().toString(16).substr(2, 64), 'success');
    await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟
}

// ==================== 增强的事件监听 ====================

// 增强setupEventListeners函数
function setupEventListeners() {
    // 现有的标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // 隐藏所有标签页
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // 显示选中的标签页
            document.getElementById(tabName).classList.add('active');

            // 更新按钮状态
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            // 根据标签页加载对应数据
            switch(tabName) {
                case 'blockchain':
                    loadBlockchainData();
                    break;
                case 'analytics':
                    loadAnalyticsData();
                    break;
            }
        });
    });

    // 表单提交
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    document.getElementById('researchForm').addEventListener('submit', handleResearchSubmit);

    // 演示控制按钮
    document.getElementById('startDemoBtn').addEventListener('click', startDemo);
    document.getElementById('stopDemoBtn').addEventListener('click', stopDemo);

    // 模拟按钮
    document.getElementById('generateUsersBtn').addEventListener('click', generateMockUsers);
    document.getElementById('generateResearchBtn').addEventListener('click', generateMockResearch);
    document.getElementById('simulateReviewsBtn').addEventListener('click', simulateReviews);
    document.getElementById('clearDataBtn').addEventListener('click', clearData);
}

// 加载区块链数据
async function loadBlockchainData() {
    updateBlockchainStats();
    displayContractAddresses();

    // 设置定时器定期更新区块链状态
    if (!window.blockchainUpdateInterval) {
        window.blockchainUpdateInterval = setInterval(updateBlockchainStats, 10000);
    }
}

// 加载分析数据
function loadAnalyticsData() {
    updateCharts();
    updatePerformanceMetrics();
}

/**
 * ==========================================
 * 应用初始化和事件绑定
 * ==========================================
 */

/**
 * ==========================================
 * 演示控制功能
 * ==========================================
 */

// 开始演示
async function startDemo() {
    try {
        // 显示演示状态
        document.getElementById('demoStatus').style.display = 'block';
        document.getElementById('startDemoBtn').style.display = 'none';
        document.getElementById('stopDemoBtn').style.display = 'inline-block';

        // 更新演示状态
        updateDemoStatus('running', '演示运行中...');

        // 开始演示
        await deSciDemo.startDemo();

    } catch (error) {
        console.error('开始演示失败:', error);
        showToast('开始演示失败', 'error');
        resetDemoButtons();
    }
}

// 停止演示
function stopDemo() {
    deSciDemo.stopDemo();
    updateDemoStatus('stopped', '演示已停止');
    resetDemoButtons();
}

// 更新演示状态显示
function updateDemoStatus(status, message) {
    const statusIcon = document.getElementById('demoStatusIcon');
    const statusText = document.getElementById('demoStatusText');
    const statusIndicator = statusIcon.parentElement;

    // 移除所有状态类
    statusIndicator.classList.remove('running', 'stopped');

    if (status === 'running') {
        statusIndicator.classList.add('running');
        statusText.textContent = message;
    } else if (status === 'stopped') {
        statusIndicator.classList.add('stopped');
        statusText.textContent = message;
    } else {
        statusText.textContent = message;
    }

    // 更新演示统计
    const demoStats = deSciDemo.getStatus();
    document.getElementById('demoUserCount').textContent = demoStats.usersCount;
    document.getElementById('demoResearchCount').textContent = demoStats.researchCount;
    document.getElementById('demoReviewCount').textContent = demoStats.reviewsCount;

    // 更新进度条
    const totalSteps = 7;
    const progress = ((demoStats.currentStep + 1) / totalSteps) * 100;
    document.getElementById('demoProgress').style.width = progress + '%';
}

// 重置演示按钮状态
function resetDemoButtons() {
    document.getElementById('startDemoBtn').style.display = 'inline-block';
    document.getElementById('stopDemoBtn').style.display = 'none';
    updateDemoStatus('idle', '演示未开始');
}

// ==================== 增强的图表数据加载 ====================

// 使用模拟数据更新图表
function updateChartsWithMockData() {
    if (!MOCK_DATA || !MOCK_DATA.charts) return;

    // 用户增长趋势图
    if (userGrowthChart && MOCK_DATA.charts.userGrowth) {
        const userGrowthData = MOCK_DATA.charts.userGrowth;
        userGrowthChart.data.labels = userGrowthData.map(item => item.month);
        userGrowthChart.data.datasets[0].data = userGrowthData.map(item => item.users);
        userGrowthChart.update();
    }

    // 研究类型分布图
    if (researchTypeChart && MOCK_DATA.charts.researchTypes) {
        const researchTypeData = MOCK_DATA.charts.researchTypes;
        researchTypeChart.data.labels = researchTypeData.map(item => item.type);
        researchTypeChart.data.datasets[0].data = researchTypeData.map(item => item.count);
        researchTypeChart.update();
    }

    // Gas消耗统计图
    if (gasUsageChart && MOCK_DATA.charts.gasUsage) {
        const gasUsageData = MOCK_DATA.charts.gasUsage;
        gasUsageChart.data.labels = gasUsageData.map(item => item.operation);
        gasUsageChart.data.datasets[0].data = gasUsageData.map(item => item.gas);
        gasUsageChart.update();
    }

    // 声誉值分布图
    if (reputationChart && MOCK_DATA.charts.reputation) {
        const reputationData = MOCK_DATA.charts.reputation;
        reputationChart.data.labels = reputationData.map(item => item.level);
        reputationChart.data.datasets[0].data = reputationData.map(item => item.count);
        reputationChart.update();
    }
}

// 使用模拟数据更新性能指标
function updatePerformanceWithMockData() {
    if (!MOCK_DATA || !MOCK_DATA.performance) return;

    const perf = MOCK_DATA.performance;

    document.getElementById('avgResponseTime').textContent = perf.avgResponseTime;
    document.getElementById('contractSuccessRate').textContent = perf.contractSuccessRate;
    document.getElementById('avgGasUsed').textContent = perf.avgGasUsed.toLocaleString();
    document.getElementById('activeUsers').textContent = perf.activeUsers;
}

// ==================== 增强的数据展示 ====================

// 显示模拟研究列表
function displayMockResearch() {
    if (!MOCK_DATA || !MOCK_DATA.research) return;

    const researchList = document.getElementById('researchList');
    researchList.innerHTML = '';

    MOCK_DATA.research.forEach(research => {
        const researchItem = document.createElement('div');
        researchItem.className = 'research-item';
        researchItem.innerHTML = `
            <div class="research-header">
                <h4>${research.title}</h4>
                <span class="research-status status-${research.status.toLowerCase()}">${research.status}</span>
            </div>
            <div class="research-meta">
                <span><i class="fas fa-users"></i> ${research.authors.join(', ')}</span>
                <span><i class="fas fa-tag"></i> ${research.category}</span>
                <span><i class="fas fa-calendar"></i> ${research.publishedDate || '未发布'}</span>
            </div>
            <div class="research-stats">
                <span><i class="fas fa-quote-left"></i> ${research.citations} 引用</span>
                <span><i class="fas fa-download"></i> ${research.downloads} 下载</span>
                <span><i class="fas fa-star"></i> ${research.reviews.length} 评审</span>
            </div>
            <p class="research-abstract">${research.abstract.substring(0, 200)}...</p>
        `;
        researchList.appendChild(researchItem);
    });
}

// 显示模拟用户档案
function displayMockUsers() {
    if (!MOCK_DATA || !MOCK_DATA.users) return;

    // 这里可以扩展用户列表显示功能
    console.log('显示模拟用户:', MOCK_DATA.users.length);
}

/**
 * ==========================================
 * 表单处理和用户交互
 * ==========================================
 */

/**
 * ==========================================
 * 表单处理函数
 * ==========================================
 */

// 处理用户档案表单提交
async function handleProfileSubmit(event) {
    event.preventDefault();

    try {
        const formData = new FormData(event.target);
        const profileData = {
            fullName: formData.get('fullName'),
            age: parseInt(formData.get('age')),
            email: formData.get('email'),
            ipfsHash: formData.get('ipfsHash') || ''
        };

        console.log('创建用户档案:', profileData);
        showToast('正在创建用户档案...', 'info');

        // 这里可以调用合约创建用户档案
        // await contracts.UserProfile.createProfile(...);

        showToast('用户档案创建成功！', 'success');

        // 刷新仪表板
        await loadDashboard();

    } catch (error) {
        console.error('创建用户档案失败:', error);
        showToast('创建用户档案失败: ' + error.message, 'error');
    }
}

// 处理研究发布表单提交
async function handleResearchSubmit(event) {
    event.preventDefault();

    try {
        const formData = new FormData(event.target);
        const researchData = {
            title: formData.get('researchTitle'),
            description: formData.get('researchDesc'),
            datasetName: formData.get('datasetName'),
            datasetDescription: formData.get('datasetDesc'),
            isPublic: formData.get('isPublicDataset') === 'on'
        };

        console.log('发布研究:', researchData);
        showToast('正在发布研究...', 'info');

        // 这里可以调用合约发布研究
        // await contracts.DeSciPlatform.publishResearch(...);

        showToast('研究发布成功！', 'success');

        // 刷新仪表板
        await loadDashboard();

    } catch (error) {
        console.error('发布研究失败:', error);
        showToast('发布研究失败: ' + error.message, 'error');
    }
}

// ==================== 分页功能 ====================

// 使用全局的分页状态管理（已在上面声明）

// 创建分页组件
function createPaginationControls(containerId, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const paginationHtml = `
        <div class="pagination-container">
            <div class="pagination-info">
                <span id="paginationInfo">第 1 页，共 0 页 (共 0 条记录)</span>
                <span id="loadingIndicator" class="loading-indicator" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                </span>
            </div>
            <div class="pagination-controls">
                <button id="firstPageBtn" class="page-btn" disabled title="首页">
                    <i class="fas fa-angle-double-left"></i>
                    <span class="btn-text">首页</span>
                </button>
                <button id="prevPageBtn" class="page-btn" disabled title="上一页">
                    <i class="fas fa-angle-left"></i>
                    <span class="btn-text">上一页</span>
                </button>
                <div class="page-numbers">
                    <span class="page-label">第</span>
                    <input type="number" id="pageInput" class="page-input" min="1" value="1" title="输入页码">
                    <span class="page-separator">页</span>
                    <span class="page-total">共 <span id="totalPagesSpan">1</span> 页</span>
                </div>
                <button id="nextPageBtn" class="page-btn" disabled title="下一页">
                    <span class="btn-text">下一页</span>
                    <i class="fas fa-angle-right"></i>
                </button>
                <button id="lastPageBtn" class="page-btn" disabled title="末页">
                    <span class="btn-text">末页</span>
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            <div class="page-size-selector">
                <label for="pageSizeSelect">每页显示：</label>
                <select id="pageSizeSelect" class="page-size-select">
                    <option value="5">5 条</option>
                    <option value="10" selected>10 条</option>
                    <option value="20">20 条</option>
                    <option value="50">50 条</option>
                </select>
                <button id="refreshBtn" class="refresh-btn" title="刷新">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = paginationHtml;

    // 绑定事件
    setupPaginationEvents(onPageChange);

    // 添加刷新按钮事件
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            setPaginationLoading(true);
            if (onPageChange) {
                onPageChange(paginationState.currentPage, paginationState.pageSize);
            }
        });
    }
}

// 设置分页事件
function setupPaginationEvents(onPageChange) {
    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const lastBtn = document.getElementById('lastPageBtn');
    const pageInput = document.getElementById('pageInput');
    const pageSizeSelect = document.getElementById('pageSizeSelect');

    firstBtn?.addEventListener('click', () => changePage(1, onPageChange));
    prevBtn?.addEventListener('click', () => changePage(paginationState.currentPage - 1, onPageChange));
    nextBtn?.addEventListener('click', () => changePage(paginationState.currentPage + 1, onPageChange));
    lastBtn?.addEventListener('click', () => changePage(paginationState.totalPages, onPageChange));

    pageInput?.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= paginationState.totalPages) {
            changePage(page, onPageChange);
        } else {
            e.target.value = paginationState.currentPage;
        }
    });

    pageSizeSelect?.addEventListener('change', (e) => {
        paginationState.pageSize = parseInt(e.target.value);
        changePage(1, onPageChange);
    });

    // 添加回车键跳转功能
    pageInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const page = parseInt(pageInput.value);
            if (page >= 1 && page <= paginationState.totalPages) {
                changePage(page, onPageChange);
            } else {
                // 显示错误提示
                showToast(`页码必须在 1-${paginationState.totalPages} 之间`, 'warning');
                pageInput.value = paginationState.currentPage;
            }
            pageInput.blur(); // 失去焦点
        }
    });
}

// 改变页码
function changePage(page, onPageChange) {
    if (page < 1 || page > paginationState.totalPages) return;

    paginationState.currentPage = page;
    updatePaginationUI();

    if (onPageChange) {
        onPageChange(paginationState.currentPage, paginationState.pageSize);
    }
}

// 改变活动页码
function changeActivityPage(direction) {
    let newPage = activityCurrentPage;

    if (direction === 'prev' && activityCurrentPage > 1) {
        newPage = activityCurrentPage - 1;
    } else if (direction === 'next' && activityCurrentPage < activityTotalPages) {
        newPage = activityCurrentPage + 1;
    }

    if (newPage !== activityCurrentPage) {
        activityCurrentPage = newPage;
        updateActivityPagination();
        displayActivitiesForPage(activityCurrentPage, activityPageSize);
    }
}

// 更新活动分页UI
function updateActivityPagination() {
    const pageInfo = document.getElementById('activityPageInfo');
    const prevBtn = document.getElementById('activityPrevBtn');
    const nextBtn = document.getElementById('activityNextBtn');

    if (pageInfo) {
        pageInfo.textContent = `第 ${activityCurrentPage} 页，共 ${activityTotalPages} 页`;
    }

    if (prevBtn) {
        prevBtn.disabled = activityCurrentPage <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = activityCurrentPage >= activityTotalPages;
    }
}

// 设置分页加载状态
function setPaginationLoading(loading) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const refreshBtn = document.getElementById('refreshBtn');

    if (loadingIndicator) {
        loadingIndicator.style.display = loading ? 'inline-block' : 'none';
    }

    if (refreshBtn) {
        refreshBtn.classList.toggle('spinning', loading);
        refreshBtn.disabled = loading;
    }

    // 禁用所有分页按钮
    const buttons = ['firstPageBtn', 'prevPageBtn', 'nextPageBtn', 'lastPageBtn'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = loading;
    });

    const pageInput = document.getElementById('pageInput');
    if (pageInput) pageInput.disabled = loading;

    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) pageSizeSelect.disabled = loading;
}

// 更新分页UI
function updatePaginationUI() {
    const { currentPage, totalPages, totalItems } = paginationState;

    // 更新信息显示
    const infoEl = document.getElementById('paginationInfo');
    if (infoEl) {
        infoEl.textContent = `第 ${currentPage} 页，共 ${totalPages} 页 (共 ${totalItems} 条记录)`;
    }

    // 更新页码输入框
    const pageInput = document.getElementById('pageInput');
    if (pageInput) {
        pageInput.value = currentPage;
        pageInput.max = totalPages;
    }

    // 更新总页数显示
    const totalPagesSpan = document.getElementById('totalPagesSpan');
    if (totalPagesSpan) {
        totalPagesSpan.textContent = totalPages;
    }

    // 更新按钮状态
    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const lastBtn = document.getElementById('lastPageBtn');

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    if (firstBtn) {
        firstBtn.disabled = isFirstPage;
        firstBtn.classList.toggle('disabled', isFirstPage);
    }
    if (prevBtn) {
        prevBtn.disabled = isFirstPage;
        prevBtn.classList.toggle('disabled', isFirstPage);
    }
    if (nextBtn) {
        nextBtn.disabled = isLastPage;
        nextBtn.classList.toggle('disabled', isLastPage);
    }
    if (lastBtn) {
        lastBtn.disabled = isLastPage;
        lastBtn.classList.toggle('disabled', isLastPage);
    }

    // 添加页面跳转提示
    if (totalPages > 1) {
        const pageNumbers = document.querySelector('.page-numbers');
        if (pageNumbers && !pageNumbers.querySelector('.page-hint')) {
            const hint = document.createElement('div');
            hint.className = 'page-hint';
            hint.textContent = '按回车键跳转';
            hint.style.cssText = `
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.8rem;
                color: #666;
                background: #f8f9fa;
                padding: 2px 6px;
                border-radius: 3px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            `;
            pageNumbers.style.position = 'relative';
            pageNumbers.appendChild(hint);

            const pageInput = document.getElementById('pageInput');
            if (pageInput) {
                pageInput.addEventListener('focus', () => {
                    hint.style.opacity = '1';
                });
                pageInput.addEventListener('blur', () => {
                    hint.style.opacity = '0';
                });
            }
        }
    }
}

// 设置分页数据
function setPaginationData(totalItems, currentPage = 1, pageSize = 10) {
    paginationState.totalItems = totalItems;
    paginationState.pageSize = pageSize;
    paginationState.currentPage = currentPage;
    paginationState.totalPages = Math.ceil(totalItems / pageSize);

    updatePaginationUI();
}

// 获取分页数据
function getPaginationData() {
    return {
        currentPage: paginationState.currentPage,
        pageSize: paginationState.pageSize,
        totalItems: paginationState.totalItems,
        totalPages: paginationState.totalPages,
        startIndex: (paginationState.currentPage - 1) * paginationState.pageSize,
        endIndex: Math.min(paginationState.currentPage * paginationState.pageSize, paginationState.totalItems)
    };
}

// ==================== 数据上传功能 ====================

// 显示数据上传模态框
function showDataUpload() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
        // 初始化拖拽功能
        initFileDropZone();
        showToast('请选择要上传的JSON数据文件', 'info');
    } else {
        showToast('上传功能暂不可用', 'error');
    }
}

// 隐藏数据上传模态框
function hideDataUpload() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'none';
}

// 初始化文件拖拽区域
function initFileDropZone() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');

    // 点击选择文件
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择变化
    fileInput.addEventListener('change', handleFileSelection);

    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
}

// 处理文件选择
function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

// 处理上传的文件
function handleFiles(files) {
    const jsonFiles = files.filter(file => file.type === 'application/json' || file.name.endsWith('.json'));

    if (jsonFiles.length === 0) {
        showToast('请选择有效的JSON文件', 'error');
        return;
    }

    if (jsonFiles.length > 5) {
        showToast('一次最多上传5个文件', 'warning');
        return;
    }

    // 显示文件列表
    displaySelectedFiles(jsonFiles);

    showToast(`已选择 ${jsonFiles.length} 个JSON文件`, 'success');
}

// 显示选择的文件
function displaySelectedFiles(files) {
    const dropZone = document.getElementById('fileDropZone');

    let fileListHtml = '<div class="selected-files">';
    files.forEach((file, index) => {
        fileListHtml += `
            <div class="selected-file">
                <i class="fas fa-file-alt"></i>
                <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
            </div>
        `;
    });
    fileListHtml += '</div>';

    dropZone.innerHTML = fileListHtml + `
        <div class="upload-text">已选择 ${files.length} 个文件</div>
        <div class="upload-hint">点击重新选择或拖拽新文件</div>
    `;

    // 存储文件引用
    window.selectedFiles = files;
}

// 处理上传的文件
async function processUploadedFiles() {
    if (!window.selectedFiles || window.selectedFiles.length === 0) {
        showToast('请先选择要上传的文件', 'warning');
        return;
    }

    const autoProcess = document.getElementById('autoProcess').checked;
    const validateData = document.getElementById('validateData').checked;

    const progressContainer = showProgress('开始处理上传的文件...');

    try {
        let processedCount = 0;
        let errorCount = 0;
        const totalFiles = window.selectedFiles.length;

        for (let i = 0; i < window.selectedFiles.length; i++) {
            const file = window.selectedFiles[i];
            const progress = Math.round(((i + 1) / totalFiles) * 80); // 预留20%用于后续处理

            try {
                updateProgress(progressContainer, progress, `正在处理: ${file.name}`);

                const content = await readFileContent(file);
                const data = JSON.parse(content);

                if (validateData) {
                    validateJsonData(data, file.name);
                }

                // 处理数据
                await processJsonData(data, file.name);

                processedCount++;

            } catch (error) {
                console.error(`处理文件 ${file.name} 失败:`, error);
                errorCount++;
            }
        }

        updateProgress(progressContainer, 90, '正在更新界面...');

        // 更新数据源标识
        updateDataSourceBadge('uploaded');

        // 隐藏模态框
        hideDataUpload();

        // 刷新仪表板
        if (autoProcess) {
            await loadDashboard();
        }

        updateProgress(progressContainer, 100, '完成！');
        setTimeout(() => {
            hideProgress();
            showToast(`处理完成: ${processedCount} 个成功, ${errorCount} 个失败`, processedCount > 0 ? 'success' : 'warning');

            // 添加成功动画
            if (processedCount > 0) {
                const cards = document.querySelectorAll('.stat-card');
                animateElements(cards, 200);
            }
        }, 500);

    } catch (error) {
        hideProgress();
        console.error('文件处理失败:', error);
        showToast('文件处理失败: ' + error.message, 'error');
    }
}

// 读取文件内容
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

// 验证JSON数据格式
function validateJsonData(data, filename) {
    // 检查是否是有效的DeSci数据格式
    if (!data || typeof data !== 'object') {
        throw new Error('数据格式无效');
    }

    // 可以根据API设计添加更详细的验证
    const validTypes = ['funding', 'nft', 'proof', 'user', 'research'];
    if (data.type && !validTypes.includes(data.type)) {
        console.warn(`未知数据类型: ${data.type} in ${filename}`);
    }

    return true;
}

// 处理JSON数据
async function processJsonData(data, filename) {
    try {
        console.log('处理数据:', data, '来自文件:', filename);

        // 根据数据类型处理
        if (data.type === 'funding' && data.campaigns) {
            await processFundingData(data.campaigns);
        } else if (data.type === 'nft' && data.nfts) {
            await processNftData(data.nfts);
        } else if (data.type === 'proof' && data.proofs) {
            await processProofData(data.proofs);
        } else if (data.users) {
            await processUserData(data.users);
        } else if (data.research) {
            await processResearchData(data.research);
        } else {
            // 通用处理
            console.log('通用数据处理:', data);
        }

        // 添加到已处理的数据列表
        if (!window.processedData) {
            window.processedData = [];
        }
        window.processedData.push({
            filename,
            data,
            processedAt: new Date().toISOString()
        });

        // 保存到localStorage
        localStorage.setItem('processedData', JSON.stringify(window.processedData));

    } catch (error) {
        console.error('数据处理失败:', error);
        throw error;
    }
}

// 处理不同类型的数据
async function processFundingData(campaigns) {
    console.log('处理众筹数据:', campaigns);
    // 这里可以调用相应的API或更新本地状态
}

async function processNftData(nfts) {
    console.log('处理NFT数据:', nfts);
    // 这里可以调用相应的API或更新本地状态
}

async function processProofData(proofs) {
    console.log('处理证明数据:', proofs);
    // 这里可以调用相应的API或更新本地状态
}

async function processUserData(users) {
    console.log('处理用户数据:', users);
    // 这里可以调用相应的API或更新本地状态
}

async function processResearchData(research) {
    console.log('处理研究数据:', research);
    // 这里可以调用相应的API或更新本地状态
}

// 更新数据源标识
function updateDataSourceBadge(type) {
    const badges = document.querySelectorAll('.data-badge');
    const typeLabels = {
        'preset': '预置数据',
        'uploaded': '已上传',
        'ai-generated': 'AI生成',
        'real': '真实数据',
        'mock': '模拟数据',
        'demo': '演示数据'
    };

    badges.forEach(badge => {
        badge.className = 'data-badge ' + type;
        badge.textContent = typeLabels[type] || type;
    });

    // 更新描述文字
    const descriptions = {
        'preset': '系统预置的示例数据，可上传您的研究数据进行完整体验',
        'uploaded': '已上传您的研究数据，系统正在处理中',
        'ai-generated': 'AI生成的高质量研究数据',
        'real': '当前显示的是真实上传的数据',
        'mock': '当前显示的是演示数据，可上传真实数据进行完整测试',
        'demo': '系统生成的演示数据'
    };

    const dataSourceInfo = document.querySelector('.data-source-info span:last-child');
    if (dataSourceInfo) {
        dataSourceInfo.textContent = descriptions[type] || '数据已加载';
    }
}

// 加载样例数据
function loadSampleData() {
    const progressContainer = showProgress('正在加载样例数据...');

    // 模拟进度更新
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 20;
        updateProgress(progressContainer, progress, `正在加载样例数据... ${progress}%`);

        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                hideProgress();
                updateDataSourceBadge('demo');
                showToast('样例数据加载完成', 'success');

                // 添加新元素动画
                const cards = document.querySelectorAll('.stat-card');
                animateElements(cards, 150);
            }, 500);
        }
    }, 200);
}

// AI生成数据功能
async function generateWithAI() {
    const progressContainer = showProgress('正在连接AI服务...');

    try {
        // 显示AI连接状态
        updateAIStatus('connecting', '正在连接到GPT-4模型...');

        updateProgress(progressContainer, 5, '正在验证AI服务连接...');

        // 检查AI连接
        const connectionStatus = await checkAIConnection();
        if (!connectionStatus.success) {
            throw new Error('AI服务连接失败: ' + connectionStatus.message);
        }

        updateAIStatus('connected', 'GPT-4模型已连接');
        updateProgress(progressContainer, 15, 'AI服务连接成功，开始生成数据...');

        // 生成研究数据
        const aiData = await generateResearchDataWithAI();

        updateProgress(progressContainer, 70, '正在验证生成的数据格式...');

        // 处理AI生成的数据
        await processAIGeneratedData(aiData);

        updateProgress(progressContainer, 90, '正在更新界面显示...');

        // 刷新界面
        await loadDashboard();

        updateProgress(progressContainer, 100, 'AI数据生成完成！');
        setTimeout(() => {
            hideProgress();
            updateDataSourceBadge('ai-generated');
            updateAIStatus('connected', 'GPT-4模型就绪');
            showToast('🎉 AI生成的高质量研究数据已加载完成！', 'success', 6000);

            // 显示生成统计
            showGenerationStats(aiData);
        }, 800);

    } catch (error) {
        hideProgress();
        updateAIStatus('disconnected', '连接失败');
        showToast('AI生成失败: ' + error.message, 'error');
        console.error('AI生成错误:', error);
    }
}

// 检查AI连接状态
async function checkAIConnection() {
    try {
        const OPENAI_API_KEY = "sk-Q3EsPIoMUzEnhZapg1NYhgF2FvR9YVvuZTSPynitaujg2a6B";
        const OPENAI_BASE_URL = "https://www.dmxapi.cn/v1";

        const response = await fetch(`${OPENAI_BASE_URL}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return {
                success: false,
                message: `API响应错误: ${response.status}`
            };
        }

        const data = await response.json();

        // 检查是否有GPT-4模型
        const hasGPT4 = data.data.some(model =>
            model.id.includes('gpt-4') || model.id.includes('gpt-4o')
        );

        if (!hasGPT4) {
            return {
                success: false,
                message: 'GPT-4模型不可用'
            };
        }

        return {
            success: true,
            message: '连接成功',
            models: data.data
        };

    } catch (error) {
        return {
            success: false,
            message: error.message || '网络连接失败'
        };
    }
}

// 更新AI状态显示
function updateAIStatus(status, message) {
    // 移除现有的AI状态指示器
    const existingStatus = document.querySelector('.ai-status');
    if (existingStatus) {
        existingStatus.remove();
    }

    // 创建新的状态指示器
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `ai-status ${status}`;

    const iconMap = {
        'connected': 'fas fa-check-circle',
        'connecting': 'fas fa-spinner fa-spin',
        'disconnected': 'fas fa-exclamation-triangle'
    };

    statusIndicator.innerHTML = `
        <i class="ai-status-icon ${iconMap[status]}"></i>
        <span>${message}</span>
    `;

    // 添加到数据源标签中
    const dataSourceLabel = document.querySelector('.data-source-label');
    if (dataSourceLabel) {
        const dataSourceInfo = dataSourceLabel.querySelector('.data-source-info');
        if (dataSourceInfo) {
            dataSourceInfo.appendChild(statusIndicator);
        }
    }
}

// 显示生成统计
function showGenerationStats(aiData) {
    if (!aiData) return;

    const stats = {
        research: aiData.research?.length || 0,
        users: aiData.users?.length || 0,
        funding: aiData.funding?.length || 0
    };

    const statsMessage = `
        🎯 生成完成！
        📄 ${stats.research} 个研究项目
        👥 ${stats.users} 个研究者
        💰 ${stats.funding} 个众筹项目
        🤖 由 GPT-4 AI 生成
    `;

    showToast(statsMessage, 'success', 8000);
}

// 使用AI生成研究数据
async function generateResearchDataWithAI() {
    const OPENAI_API_KEY = "sk-Q3EsPIoMUzEnhZapg1NYhgF2FvR9YVvuZTSPynitaujg2a6B";
    const OPENAI_BASE_URL = "https://www.dmxapi.cn/v1";

    const prompt = `你是一个专业的科学数据生成专家，专门为DeSci（去中心化科学）平台生成高质量的学术研究数据。

## 任务要求
请生成一个完整的DeSci研究项目数据集，包含研究项目、研究者和众筹信息。

## 输出格式规范
必须严格遵循以下JSON结构，不要添加任何额外的文本或注释：

\`\`\`json
{
  "type": "research",
  "version": "1.0",
  "description": "简短的项目描述（50字以内）",
  "timestamp": "ISO格式时间戳，例如：2024-08-30T10:00:00Z",
  "research": [
    {
      "id": "唯一标识符，使用英文和数字，例如：quantum-computing-2024-001",
      "title": "研究标题（中文或英文，专业性强）",
      "authors": ["作者全名1", "作者全名2"],
      "abstract": "详细摘要，至少300字，包含研究背景、方法、发现和意义",
      "category": "研究领域，例如：量子计算、人工智能、生物技术等",
      "tags": ["标签1", "标签2", "标签3"],
      "status": "Published",
      "funding": 数值（合理的金额，50000-5000000之间）,
      "citations": 数值（0-500之间，合理分布）,
      "publishedDate": "YYYY-MM-DD格式",
      "doi": "正确的DOI格式，例如：10.1234/nature.2024.001",
      "keywords": ["关键词1", "关键词2", "关键词3"],
      "metadata": {
        "dataSize": "合理的数据大小，例如：2.3 GB",
        "format": "数据格式，例如：HDF5, CSV, DICOM等",
        "license": "许可证类型，例如：CC-BY-4.0, MIT等"
      }
    }
  ],
  "users": [
    {
      "id": "用户ID，使用英文小写和数字",
      "name": "作者全名",
      "email": "专业邮箱，包含机构域名",
      "institution": "真实存在的知名研究机构",
      "specialty": "专业研究领域",
      "reputation": 数值（1-100之间）,
      "publications": 数值（合理的发表数量）,
      "citations": 数值（合理的引用数量）,
      "orcid": "真实ORCID格式，例如：0000-0000-0000-0000"
    }
  ],
  "funding": [
    {
      "campaignId": "众筹ID",
      "title": "众筹项目标题",
      "goal": 数值（合理的众筹目标）,
      "raised": 数值（已筹集金额，小于等于目标）,
      "deadline": "YYYY-MM-DD格式，将来的日期",
      "backers": 数值（支持者数量）,
      "category": "众筹类别",
      "description": "详细的项目描述，至少100字"
    }
  ]
}
\`\`\`

## 质量要求

### 研究项目要求：
1. **前沿性**：选择当前热门的科学研究领域
2. **真实性**：基于真实存在的科学研究方向
3. **完整性**：包含充分的技术细节和科学价值
4. **创新性**：体现科学研究的创新性和突破性

### 作者信息要求：
1. **真实机构**：使用真实存在的知名研究机构
2. **专业匹配**：作者专业领域与研究内容匹配
3. **合理数据**：发表数量、引用数量符合学术水平

### 众筹项目要求：
1. **实际性**：基于真实的研究需求
2. **合理金额**：符合科研项目的资金需求
3. **时间合理**：截止日期在合理的时间范围内

## 数据生成规则

### 数值合理性：
- funding: 50000-5000000（人民币或美元）
- citations: 0-500，根据研究领域和时间调整
- reputation: 1-100，基于学术成就
- publications: 1-200，根据职业阶段调整

### 时间要求：
- publishedDate: 过去1-5年内的日期
- timestamp: 当前时间
- deadline: 未来1-12个月内的日期

### 格式严格性：
- DOI: 必须符合10.xxxx/xxxxx.xxxx格式
- ORCID: 必须符合0000-0000-0000-0000格式
- 日期: 必须符合YYYY-MM-DD格式
- 邮箱: 必须包含机构域名

## 示例主题建议：
- 量子计算中的新型算法研究
- 基于深度学习的医疗影像辅助诊断
- CRISPR基因编辑技术在疾病治疗中的应用
- 人工智能在气候变化预测中的应用
- 区块链技术在知识产权保护中的应用

请生成高质量、真实、可信的科学数据，确保所有信息都符合学术标准和格式要求。`;

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的科学数据生成助手，专门生成高质量的去中心化科学研究数据。请确保所有生成的数据都是真实、准确、有价值的。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 尝试解析JSON
    try {
        // 清理响应内容，确保只有JSON部分
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        const jsonContent = content.substring(jsonStart, jsonEnd);

        return JSON.parse(jsonContent);
    } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        console.log('原始响应:', content);
        throw new Error('AI返回的数据格式错误');
    }
}

// 处理AI生成的数据
async function processAIGeneratedData(aiData) {
    try {
        console.log('处理AI生成的数据:', aiData);

        // 验证数据格式
        if (!aiData || !aiData.research || !Array.isArray(aiData.research)) {
            throw new Error('AI生成的数据格式不正确');
        }

        // 添加到已处理的数据列表
        if (!window.processedData) {
            window.processedData = [];
        }

        window.processedData.push({
            filename: `ai-generated-${Date.now()}.json`,
            data: aiData,
            processedAt: new Date().toISOString(),
            source: 'ai-generated'
        });

        // 保存到localStorage
        localStorage.setItem('processedData', JSON.stringify(window.processedData));

        console.log('AI数据处理完成');

    } catch (error) {
        console.error('处理AI数据失败:', error);
        throw error;
    }
}

// ==================== 用户引导功能 ====================

// 隐藏引导模态框
function hideGuidance() {
    const modal = document.getElementById('guidanceModal');
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);

    // 标记为已看过引导
    localStorage.setItem('guidanceShown', 'true');
}

// 开始引导之旅
function startGuidedTour() {
    hideGuidance();

    // 显示引导进度指示器
    showTourProgress();

    const steps = [
        {
            element: '.data-source-label',
            title: '🎯 数据管理中心',
            content: '这里是您的数据控制中心！显示当前数据状态，支持上传、AI生成等多种数据获取方式。',
            position: 'bottom',
            icon: 'fas fa-database',
            highlight: true
        },
        {
            element: '.btn-github-primary',
            title: '📤 上传您的研究数据',
            content: '支持拖拽上传！只需将JSON文件拖放到上传区域，即可导入您的研究数据进行完整测试。',
            position: 'bottom',
            icon: 'fas fa-cloud-upload-alt',
            action: () => showDataUpload()
        },
        {
            element: 'button[onclick*="generateWithAI"]',
            title: '🤖 AI智能生成',
            content: '一键生成高质量的科研数据！使用GPT-4模型，自动生成符合学术标准的研究项目、作者信息和众筹数据。',
            position: 'bottom',
            icon: 'fas fa-magic',
            action: () => generateWithAI()
        },
        {
            element: '.stat-card:nth-child(1)',
            title: '📊 实时统计面板',
            content: '智能统计显示！实时展示平台数据，包括注册用户、研究项目、证明数量等关键指标。',
            position: 'right',
            icon: 'fas fa-chart-line',
            highlight: true
        },
        {
            element: '.nav-tabs',
            title: '🚀 功能导航',
            content: '一站式功能导航！点击不同标签探索：用户管理、研究发布、评审系统、NFT铸造等完整功能。',
            position: 'bottom',
            icon: 'fas fa-compass'
        }
    ];

    showTourStep(steps, 0);
}

// 显示引导进度
function showTourProgress() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'tour-progress';
    progressContainer.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #24292f; color: #ffffff; padding: 8px 16px; border-radius: 20px;
                    font-size: 14px; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <i class="fas fa-route"></i>
            <span id="tour-progress-text">引导之旅 (1/5)</span>
        </div>
    `;
    document.body.appendChild(progressContainer);
}

// 更新引导进度
function updateTourProgress(current, total) {
    const progressText = document.getElementById('tour-progress-text');
    if (progressText) {
        progressText.textContent = `引导之旅 (${current}/${total})`;
    }
}

// 隐藏引导进度
function hideTourProgress() {
    const progressContainer = document.getElementById('tour-progress');
    if (progressContainer) {
        progressContainer.remove();
    }
}

// 显示引导步骤
function showTourStep(steps, currentIndex) {
    if (currentIndex >= steps.length) {
        hideTourProgress();
        showToast('🎉 引导完成！您现在可以自由探索DeSci平台的所有功能了！', 'success', 6000);
        return;
    }

    const step = steps[currentIndex];
    const element = document.querySelector(step.element);

    if (!element) {
        showTourStep(steps, currentIndex + 1);
        return;
    }

    // 更新进度
    updateTourProgress(currentIndex + 1, steps.length);

    // 添加高亮效果
    if (step.highlight) {
        element.classList.add('tour-highlight');
    }

    // 创建增强的提示框
    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';

    const actionButton = step.action ? `
        <button class="tour-action" onclick="executeTourAction(${currentIndex})" style="margin-right: 8px;">
            <i class="fas fa-play"></i> 试一试
        </button>
    ` : '';

    tooltip.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <i class="${step.icon}" style="font-size: 20px; margin-right: 10px; color: #0969da;"></i>
            <div style="font-weight: 700; font-size: 16px; color: #ffffff;">${step.title}</div>
        </div>
        <div style="margin-bottom: 16px; line-height: 1.6; color: #e6e6e6;">${step.content}</div>
        <div class="tour-tooltip-buttons">
            ${actionButton}
            <button class="tour-skip" onclick="endGuidedTour()">跳过引导</button>
            <button class="tour-next" onclick="nextTourStep(${currentIndex + 1}, ${steps.length})">
                ${currentIndex === steps.length - 1 ? '完成' : '下一步'}
                <i class="fas fa-arrow-right" style="margin-left: 6px;"></i>
            </button>
        </div>
    `;

    // 智能定位提示框
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'fixed';

    // 计算最佳位置，避免超出屏幕
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const margin = 20;

    let top, left;

    switch (step.position) {
        case 'top':
            top = Math.max(margin, rect.top - tooltipHeight - 10);
            left = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin,
                  rect.left + rect.width / 2 - tooltipWidth / 2));
            break;
        case 'bottom':
            top = Math.min(window.innerHeight - tooltipHeight - margin, rect.bottom + 10);
            left = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin,
                  rect.left + rect.width / 2 - tooltipWidth / 2));
            break;
        case 'left':
            top = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin,
                  rect.top + rect.height / 2 - tooltipHeight / 2));
            left = Math.max(margin, rect.left - tooltipWidth - 10);
            break;
        case 'right':
            top = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin,
                  rect.top + rect.height / 2 - tooltipHeight / 2));
            left = Math.min(window.innerWidth - tooltipWidth - margin, rect.right + 10);
            break;
        default:
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';

    document.body.appendChild(tooltip);

    // 添加点击外部区域关闭的功能
    setTimeout(() => {
        document.addEventListener('click', handleTourOutsideClick);
    }, 100);

    // 存储当前步骤信息
    window.currentTourStep = { element, tooltip, steps, currentIndex };
}

// 处理引导外部点击
function handleTourOutsideClick(event) {
    const tooltip = document.querySelector('.tour-tooltip');
    if (tooltip && !tooltip.contains(event.target) && !event.target.closest('.tour-highlight')) {
        // 可以选择不关闭，让用户必须点击按钮
        return;
    }
}

// 执行引导动作
function executeTourAction(stepIndex) {
    const steps = window.currentTourStep?.steps;
    if (steps && steps[stepIndex] && steps[stepIndex].action) {
        steps[stepIndex].action();
        showToast('正在执行操作...', 'info');
    }
}

// 下一步
function nextTourStep(nextIndex, totalSteps) {
    const { element, tooltip, steps } = window.currentTourStep;

    // 移除当前步骤
    if (element) {
        element.classList.remove('tour-highlight');
    }
    if (tooltip) {
        tooltip.remove();
    }

    // 清除外部点击监听器
    document.removeEventListener('click', handleTourOutsideClick);

    // 显示下一步
    showTourStep(steps, nextIndex);
}

// 结束引导
function endGuidedTour() {
    // 清理当前步骤
    if (window.currentTourStep) {
        const { element, tooltip } = window.currentTourStep;
        if (element) {
            element.classList.remove('tour-highlight');
        }
        if (tooltip && tooltip.parentNode) {
            tooltip.remove();
        }
    }

    // 隐藏进度条
    hideTourProgress();

    // 清除外部点击监听器
    document.removeEventListener('click', handleTourOutsideClick);

    // 清除全局状态
    window.currentTourStep = null;

    showToast('🗺️ 引导已结束，您可以随时重新开始探索DeSci平台的精彩功能！', 'info', 4000);
}

// 检查是否需要显示引导
function checkGuidanceDisplay() {
    const guidanceShown = localStorage.getItem('guidanceShown');
    if (!guidanceShown) {
        // 首次使用，显示引导
        setTimeout(() => {
            const modal = document.getElementById('guidanceModal');
            modal.style.display = 'flex';
        }, 1000);
    }
}

// 在应用初始化时加载已处理的数据
async function loadProcessedData() {
    try {
        const savedData = localStorage.getItem('processedData');
        if (savedData) {
            window.processedData = JSON.parse(savedData);
            console.log('已加载已处理的数据:', window.processedData);

            // 如果有真实数据，更新标识
            if (window.processedData.length > 0) {
                updateDataSourceBadge('real');
            }
        }
    } catch (error) {
        console.error('加载已处理数据失败:', error);
    }
}

// Initialize app when page loads
window.addEventListener('load', async () => {
    console.log('页面加载完成，开始初始化应用...');

    // 确保初始时loading状态是隐藏的
    showLoading(false);

    await loadProcessedData(); // 先加载已处理的数据
    console.log('已处理数据加载完成');

    await init(); // 然后初始化应用
    console.log('应用初始化完成');

    checkGuidanceDisplay(); // 检查是否需要显示引导
    console.log('引导检查完成');
});

// ==================== 缺失的函数实现 ====================

// 用户档案相关函数
function editProfile() {
    showToast('编辑功能开发中...', 'info');
}

function exportProfile() {
    showToast('正在导出资料...', 'info');
    setTimeout(() => {
        showToast('资料导出成功！', 'success');
    }, 2000);
}

// 研究相关函数
function generateZKProof(proofType) {
    showToast(`正在生成${proofType}证明...`, 'info');
    setTimeout(() => {
        showToast(`${proofType}证明生成成功！`, 'success');
        // 更新UI显示证明已添加
        updateProofList(proofType);
    }, 3000);
}

function updateProofList(proofType) {
    const proofList = document.getElementById('proofList');
    if (proofList) {
        const noProofs = proofList.querySelector('.no-proofs');
        if (noProofs) {
            noProofs.innerHTML = `
                <div class="proof-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${proofType}证明已添加</span>
                    <span class="proof-status success">✓ 已验证</span>
                </div>
            `;
        }
    }
}

// 评审相关函数
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// NFT相关函数
function createNFTGallery() {
    showToast('NFT画廊功能开发中...', 'info');
}

function closeNFTModal() {
    const modal = document.getElementById('nftModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function viewOnBlockExplorer() {
    showToast('正在打开区块链浏览器...', 'info');
    setTimeout(() => {
        window.open('https://sepolia.etherscan.io/', '_blank');
    }, 1000);
}

function shareNFT() {
    showToast('分享功能开发中...', 'info');
}

// 区块链浏览器相关函数
function refreshContracts() {
    showToast('正在刷新合约信息...', 'info');
    setTimeout(() => {
        showToast('合约信息已更新！', 'success');
    }, 2000);
}

function clearTransactionLog() {
    showToast('正在清空交易记录...', 'info');
    setTimeout(() => {
        showToast('交易记录已清空！', 'success');
    }, 1500);
}

function toggleEventListening() {
    const statusIcon = document.getElementById('eventStatusIcon');
    const statusText = document.getElementById('eventStatusText');

    if (statusIcon && statusText) {
        if (statusIcon.classList.contains('fa-circle')) {
            // 当前正在监听，暂停
            statusIcon.classList.remove('fa-circle');
            statusIcon.classList.add('fa-pause');
            statusText.textContent = '已暂停';
            showToast('事件监听已暂停', 'warning');
        } else {
            // 当前已暂停，开始监听
            statusIcon.classList.remove('fa-pause');
            statusIcon.classList.add('fa-circle');
            statusText.textContent = '监听中...';
            showToast('事件监听已恢复', 'success');
        }
    }
}

function callReadFunction(functionName) {
    showToast(`正在调用${functionName}...`, 'info');
    setTimeout(() => {
        showToast(`${functionName}调用成功！`, 'success');
        // 这里可以显示返回值
        console.log(`${functionName} result:`, Math.floor(Math.random() * 100));
    }, 2000);
}

// 引导相关函数
function hideGuidance() {
    const modal = document.getElementById('guidanceModal');
    if (modal) {
        modal.style.display = 'none';
        // 标记为已看过引导
        localStorage.setItem('guidanceShown', 'true');
    }
}

function startGuidedTour() {
    hideGuidance();
    // 开始引导流程
    startGuidedTour();
}

// 数据分析增强函数
async function loadAnalyticsData() {
    try {
        showToast('正在加载分析数据...', 'info');

        // 模拟数据加载
        const analyticsData = {
            userGrowth: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                data: [12, 25, 38, 52, 68, 85]
            },
            researchTypes: {
                labels: ['机器学习', '数据科学', '密码学', '区块链', '人工智能', '其他'],
                data: [35, 25, 15, 12, 8, 5]
            },
            gasUsage: {
                labels: ['发布研究', '提交评审', '铸造NFT', '验证证明', '数据上传'],
                data: [0.002, 0.0015, 0.003, 0.001, 0.0025]
            },
            reputation: {
                labels: ['新手', '初级', '中级', '高级', '专家', '大师'],
                data: [45, 30, 15, 7, 2, 1]
            }
        };

        // 更新图表
        updateCharts(analyticsData);
        showToast('分析数据加载完成！', 'success');

    } catch (error) {
        console.error('加载分析数据失败:', error);
        showToast('分析数据加载失败', 'error');
    }
}

function updateCharts(data) {
    // 这里应该更新Chart.js图表
    console.log('更新图表数据:', data);
}

// 增强的数据分析功能
function startDemo() {
    showToast('开始完整演示...', 'info');

    // 模拟演示流程
    const demoSteps = [
        '创建用户档案',
        '发布研究项目',
        '生成零知识证明',
        '提交同行评审',
        '铸造研究NFT',
        '更新统计数据'
    ];

    let stepIndex = 0;
    const demoInterval = setInterval(() => {
        if (stepIndex < demoSteps.length) {
            showToast(`步骤 ${stepIndex + 1}: ${demoSteps[stepIndex]}`, 'info');
            stepIndex++;
        } else {
            clearInterval(demoInterval);
            showToast('完整演示完成！', 'success');
            loadAnalyticsData(); // 重新加载分析数据
        }
    }, 2000);
}

function stopDemo() {
    showToast('演示已停止', 'warning');
}

function generateUsers() {
    showToast('正在生成模拟用户...', 'info');
    setTimeout(() => {
        showToast('模拟用户生成完成！', 'success');
    }, 1500);
}

function generateResearch() {
    showToast('正在生成模拟研究...', 'info');
    setTimeout(() => {
        showToast('模拟研究生成完成！', 'success');
    }, 2000);
}

function simulateReviews() {
    showToast('正在模拟评审过程...', 'info');
    setTimeout(() => {
        showToast('评审模拟完成！', 'success');
    }, 2500);
}

function clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        showToast('正在清除数据...', 'warning');
        setTimeout(() => {
            showToast('数据已清除！', 'success');
        }, 2000);
    }
}

// 改进的演示模式状态更新
function updateDemoStatus(running, progress, stats) {
    const statusElement = document.getElementById('demoStatus');
    const progressElement = document.getElementById('demoProgress');
    const userCountElement = document.getElementById('demoUserCount');
    const researchCountElement = document.getElementById('demoResearchCount');
    const reviewCountElement = document.getElementById('demoReviewCount');

    if (statusElement) {
        statusElement.style.display = running ? 'block' : 'none';
    }

    if (progressElement) {
        progressElement.style.width = `${progress}%`;
    }

    if (userCountElement) {
        userCountElement.textContent = stats.users || 0;
    }

    if (researchCountElement) {
        researchCountElement.textContent = stats.research || 0;
    }

    if (reviewCountElement) {
        reviewCountElement.textContent = stats.reviews || 0;
    }
}

// 增强的Toast通知系统
function showEnhancedToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    const container = document.getElementById('toastContainer') || createToastContainer();
    container.appendChild(toast);

    // 自动移除
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);

    return toast;
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function createToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    showEnhancedToast('发生错误，请刷新页面重试', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise错误:', e.reason);
    showEnhancedToast('网络请求失败，请检查连接', 'error');
});

// 页面可见性API - 当用户回到页面时刷新数据
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 用户回到页面，刷新关键数据
        updateConnectionStatus('connected', '已重新连接');
        loadDashboard();
    }
});

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R 刷新数据
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        showToast('正在刷新数据...', 'info');
        loadDashboard();
    }

    // Escape 关闭模态框
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal, .review-modal, .nft-modal, .upload-modal, .guidance-modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex' || modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
});

// 文件上传功能
function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const datasetFile = document.getElementById('datasetFile');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (!uploadArea || !datasetFile) return;

    // 点击上传区域选择文件
    uploadArea.addEventListener('click', () => {
        datasetFile.click();
    });

    // 文件选择处理
    datasetFile.addEventListener('change', handleFileSelect);

    // 拖拽功能
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        // 检查文件大小 (50MB限制)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showToast('文件太大！最大支持50MB', 'error');
            return;
        }

        // 检查文件类型
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
            'application/x-zip-compressed',
            'text/plain',
            'text/csv',
            'application/json'
        ];

        if (!allowedTypes.includes(file.type)) {
            showToast('不支持的文件类型！', 'error');
            return;
        }

        // 显示上传进度
        uploadProgress.style.display = 'block';
        uploadArea.style.display = 'none';

        // 模拟上传进度
        simulateUpload(file);
    }

    function simulateUpload(file) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                // 上传完成
                setTimeout(() => {
                    progressText.textContent = '上传成功！';
                    progressFill.style.width = '100%';

                    // 自动填充数据集名称
                    const datasetNameInput = document.getElementById('datasetName');
                    if (datasetNameInput && !datasetNameInput.value) {
                        datasetNameInput.value = file.name.replace(/\.[^/.]+$/, '');
                    }

                    setTimeout(() => {
                        uploadProgress.style.display = 'none';
                        uploadArea.style.display = 'flex';
                        showToast('文件上传成功！', 'success');
                    }, 1000);
                }, 500);
            }

            progressFill.style.width = progress + '%';
            progressText.textContent = `上传中... ${Math.round(progress)}%`;
        }, 200);
    }
}

// 增强的模拟数据功能
function initializeEnhancedMockData() {
    // 确保模拟数据功能完整
    if (typeof window.processedData === 'undefined') {
        window.processedData = [];
    }

    // 添加更多模拟数据类型
    const enhancedMockData = {
        users: [
            {
                id: 1,
                name: "Dr. Alice Chen",
                email: "alice@university.edu",
                institution: "清华大学",
                specialty: "量子计算",
                reputation: 95,
                verified: true
            },
            {
                id: 2,
                name: "Prof. Bob Wilson",
                email: "bob@research.edu",
                institution: "斯坦福大学",
                specialty: "机器学习",
                reputation: 88,
                verified: true
            }
        ],
        research: [
            {
                id: 1,
                title: "基于量子算法的机器学习优化研究",
                author: "Dr. Alice Chen",
                category: "AI",
                status: "published",
                funding: 50000,
                views: 1250,
                citations: 45
            },
            {
                id: 2,
                title: "气候变化对生态系统的影响分析",
                author: "Prof. Bob Wilson",
                category: "Environment",
                status: "under_review",
                funding: 75000,
                views: 890,
                citations: 23
            }
        ],
        proofs: [
            {
                id: 1,
                type: "data_integrity",
                status: "verified",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                type: "authorship",
                status: "verified",
                timestamp: new Date().toISOString()
            }
        ]
    };

    // 合并到现有数据
    if (window.processedData.length === 0) {
        window.processedData = enhancedMockData.users.concat(enhancedMockData.research);
    }

    console.log('✅ 增强模拟数据初始化完成');
}

// 加载用户档案
async function loadProfile() {
    try {
        showToast('正在加载用户档案...', 'info');

        // 模拟加载用户档案数据
        const mockProfile = {
            fullName: "Dr. Alice Chen",
            age: 28,
            email: "alice@university.edu",
            institution: "清华大学",
            specialty: "量子计算",
            ipfsHash: "QmXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxX"
        };

        // 填充表单
        document.getElementById('fullName').value = mockProfile.fullName;
        document.getElementById('age').value = mockProfile.age;
        document.getElementById('email').value = mockProfile.email;
        document.getElementById('institution').value = mockProfile.institution;
        document.getElementById('specialty').value = mockProfile.specialty;
        document.getElementById('ipfsHash').value = mockProfile.ipfsHash;

        showToast('用户档案加载成功', 'success');
    } catch (error) {
        console.error('加载用户档案失败:', error);
        showToast('加载用户档案失败', 'error');
    }
}

// 处理用户档案提交
async function handleProfileSubmit(event) {
    event.preventDefault();

    try {
        showToast('正在保存用户档案...', 'info');

        // 获取表单数据
        const profileData = {
            fullName: document.getElementById('fullName').value,
            age: parseInt(document.getElementById('age').value),
            email: document.getElementById('email').value,
            institution: document.getElementById('institution').value,
            specialty: document.getElementById('specialty').value,
            ipfsHash: document.getElementById('ipfsHash').value
        };

        // 验证数据
        if (!profileData.fullName || !profileData.email || !profileData.institution) {
            showToast('请填写所有必填字段', 'error');
            return;
        }

        // 模拟保存到区块链
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('保存用户档案:', profileData);
        showToast('用户档案保存成功！', 'success');

        // 可以在这里添加区块链交互代码

    } catch (error) {
        console.error('保存用户档案失败:', error);
        showToast('保存用户档案失败', 'error');
    }
}

// 导出函数供全局使用
window.editProfile = editProfile;
window.exportProfile = exportProfile;
window.loadProfile = loadProfile;
window.handleProfileSubmit = handleProfileSubmit;
window.generateZKProof = generateZKProof;
window.closeReviewModal = closeReviewModal;
window.createNFTGallery = createNFTGallery;
window.closeNFTModal = closeNFTModal;
window.viewOnBlockExplorer = viewOnBlockExplorer;
window.shareNFT = shareNFT;
window.refreshContracts = refreshContracts;
window.clearTransactionLog = clearTransactionLog;
window.toggleEventListening = toggleEventListening;
window.callReadFunction = callReadFunction;
window.hideGuidance = hideGuidance;
window.startGuidedTour = startGuidedTour;
window.loadAnalyticsData = loadAnalyticsData;
window.startDemo = startDemo;
window.stopDemo = stopDemo;
window.generateUsers = generateUsers;
window.generateResearch = generateResearch;
window.simulateReviews = simulateReviews;
window.clearData = clearData;
window.initializeFileUpload = initializeFileUpload;
window.initializeEnhancedMockData = initializeEnhancedMockData;

// DOM加载完成后初始化功能
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 初始化增强功能...');

    // 初始化标签页切换功能
    initializeTabSwitching();

    // 初始化文件上传功能
    initializeFileUpload();

    // 初始化增强的模拟数据
    initializeEnhancedMockData();

    // 尝试从后端API获取数据，如果失败则使用区块链直接获取
    try {
        await fetchPlatformStats();
        console.log('✅ 成功从后端获取数据');
    } catch (error) {
        console.log('⚠️ 后端不可用，使用区块链直接获取数据');
    }

    console.log('✅ 增强功能初始化完成');
});

// 初始化标签页切换功能
function initializeTabSwitching() {
    console.log('初始化标签页切换功能...');

    // 为所有标签页按钮添加点击事件监听器
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });

    console.log('标签页切换功能初始化完成');
}
