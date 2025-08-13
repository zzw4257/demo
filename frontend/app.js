// Contract addresses (from deployment)
const CONTRACT_ADDRESSES = {
    UserProfile: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    ZKProof: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    DeSciNFTSimple: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    Dataset: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    DeSciPlatform: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
};

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

// Global variables
let provider;
let signer;
let contracts = {};
let currentAccount;

// Initialize the app
async function init() {
    try {
        await connectWallet();
        await initContracts();
        await loadDashboard();
        setupEventListeners();
        showToast('应用初始化成功！', 'success');
    } catch (error) {
        console.error('初始化失败:', error);
        showToast('初始化失败: ' + error.message, 'error');
        updateConnectionStatus('error', '连接失败');
    }
}

// Connect to wallet
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            currentAccount = await signer.getAddress();
            
            updateConnectionStatus('connected', `已连接: ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`);
            
        } catch (error) {
            throw new Error('用户拒绝连接钱包');
        }
    } else {
        throw new Error('请安装MetaMask钱包');
    }
}

// Initialize contracts
async function initContracts() {
    for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
        contracts[name] = new ethers.Contract(address, CONTRACT_ABIS[name], signer);
    }
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
        
        const [totalUsers, totalProofs, totalNFTs, totalDatasets] = await Promise.all([
            contracts.UserProfile.getTotalUsers(),
            contracts.ZKProof.getTotalProofs(),
            contracts.DeSciNFTSimple.getTotalNFTs(),
            contracts.Dataset.getTotalDatasets()
        ]);
        
        document.getElementById('totalUsers').textContent = totalUsers.toString();
        document.getElementById('totalProofs').textContent = totalProofs.toString();
        document.getElementById('totalNFTs').textContent = totalNFTs.toString();
        document.getElementById('totalDatasets').textContent = totalDatasets.toString();
        
        await loadRecentActivity();
        await checkUserProfile();
        
    } catch (error) {
        console.error('加载仪表板失败:', error);
        showToast('加载数据失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load recent activity
async function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '<div class="activity-item"><i class="fas fa-info-circle"></i><span>平台运行正常，欢迎使用！</span></div>';
}

// Check user profile
async function checkUserProfile() {
    try {
        const hasProfile = await contracts.UserProfile.hasProfile(currentAccount);
        
        if (hasProfile) {
            const profile = await contracts.UserProfile.getProfile(currentAccount);
            
            document.getElementById('profileName').textContent = profile.fullName;
            document.getElementById('profileEmail').textContent = profile.email;
            document.getElementById('profileReputation').textContent = profile.reputation.toString();
            
            const verifiedEl = document.getElementById('profileVerified');
            if (profile.isVerified) {
                verifiedEl.textContent = '已验证';
                verifiedEl.className = 'status verified';
            } else {
                verifiedEl.textContent = '未验证';
                verifiedEl.className = 'status unverified';
            }
            
            document.getElementById('profileInfo').style.display = 'block';
        }
    } catch (error) {
        console.error('检查用户档案失败:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    document.getElementById('profileForm').addEventListener('submit', handleCreateProfile);
    document.getElementById('researchForm').addEventListener('submit', handlePublishResearch);
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
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

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' : 
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Initialize app when page loads
window.addEventListener('load', init);
