import { ref, readonly } from 'vue';
import { ethers } from 'ethers';
import axios from 'axios'; // Make sure axios is imported here

// --- Non-reactive, module-level variables for the instances ---
let web3ModalInstance = null;
let provider = null;
let signer = null;

// --- Reactive state, kept simple and clean ---
const account = ref(null);
const isConnected = ref(false);

// --- Provider Options ---
const providerOptions = {
  /* future wallet integrations */
};

let Web3ModalClass = null;

// 尝试动态导入Web3Modal
const loadWeb3Modal = async () => {
    if (!Web3ModalClass) {
        try {
            const module = await import('web3modal');
            Web3ModalClass = module.default;
        } catch (error) {
            console.warn('Web3Modal加载失败，使用模拟模式:', error.message);
            Web3ModalClass = null;
        }
    }
    return Web3ModalClass;
};

const initWeb3Modal = async () => {
    if (!web3ModalInstance) {
        try {
            const Web3Modal = await loadWeb3Modal();
            if (Web3Modal) {
                web3ModalInstance = new Web3Modal({
                    cacheProvider: true,
                    providerOptions,
                    theme: 'dark',
                });
            } else {
                console.warn('Web3Modal不可用，使用降级模式');
                web3ModalInstance = null;
            }
        } catch (error) {
            console.warn('Web3Modal初始化失败，使用降级模式:', error.message);
            web3ModalInstance = null;
        }
    }
};

const subscribeToProviderEvents = (instance) => {
    instance.on("accountsChanged", (accounts) => {
        console.log("Event: accountsChanged", accounts);
        account.value = accounts[0] || null;
        if (!accounts[0]) {
            disconnectWallet();
        }
    });

    instance.on("chainChanged", () => {
        console.log("Event: chainChanged");
        // Reload to reconnect with the new chain info.
        window.location.reload();
    });

    instance.on("disconnect", () => {
        console.log("Event: disconnect");
        disconnectWallet();
    });
};

const loginAndFetchUser = async (userAccount) => {
    if (!userAccount) return null; // Return null on failure
    try {
        console.log(`Calling backend login for account: ${userAccount}`);
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            walletAddress: userAccount
        });
        console.log('Backend login response:', response.data);
        return response.data.user; // Return the user object
    } catch (error) {
        console.error('Error calling backend login API:', error);
        return null; // Return null on failure
    }
};

const connectWallet = async () => {
    await initWeb3Modal();
    try {
        if (web3ModalInstance) {
            // 使用真实的Web3Modal
            const instance = await web3ModalInstance.connect();
            subscribeToProviderEvents(instance);

            provider = new ethers.providers.Web3Provider(instance);
            signer = provider.getSigner();

            const userAccount = await signer.getAddress();
            account.value = userAccount;

            // Login to backend and get user data
            const user = await loginAndFetchUser(userAccount);

            if (user) {
                isConnected.value = true;
                return user;
            } else {
                await disconnectWallet();
                return null;
            }
        } else {
            // 使用模拟钱包连接（用于演示）
            console.log('使用模拟钱包连接模式');

            // 生成一个模拟的钱包地址
            const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
            account.value = mockAddress;

            // 创建模拟的provider和signer
            provider = {
                getSigner: () => ({
                    getAddress: async () => mockAddress,
                    signMessage: async (message) => `mock_signature_${Date.now()}`
                }),
                getBlockNumber: async () => Math.floor(Math.random() * 1000000),
                getGasPrice: async () => ethers.utils.parseUnits('20', 'gwei')
            };

            signer = provider.getSigner();

            // 模拟用户登录
            const user = await loginAndFetchUser(mockAddress);

            if (user) {
                isConnected.value = true;
                console.log('模拟钱包连接成功:', mockAddress);
                return user;
            } else {
                await disconnectWallet();
                return null;
            }
        }

    } catch (e) {
        console.error("钱包连接错误:", e);
        disconnectWallet();
        return null;
    }
};

const disconnectWallet = async () => {
    if (web3ModalInstance) {
        web3ModalInstance.clearCachedProvider();
    }
    // No need to unsubscribe, a new instance will be created on next connect
    provider = null;
    signer = null;
    account.value = null;
    isConnected.value = false;
};

// --- The Composable that exposes the functionality ---
export function useWeb3() {

    /*
    // Auto-connect on initial load if provider is cached - DISABLED
    if (typeof window !== 'undefined' && !web3ModalInstance && localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")) {
        console.log("Cached provider found, attempting auto-connect...");
        setTimeout(connectWallet, 100);
    }
    */

    return {
        connectWallet,
        disconnectWallet,
        account: readonly(account),
        isConnected: readonly(isConnected),
    };
} 