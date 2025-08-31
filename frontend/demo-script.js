// DeSci平台自动演示脚本
// 用于展示完整的去中心化科研工作流程

// 辅助函数定义（如果全局函数不可用）
if (typeof addEventToLog === 'undefined') {
    window.addEventToLog = function(eventType, message, status = 'info') {
        console.log(`[${eventType}] ${message}`);
    };
}

if (typeof updateCharts === 'undefined') {
    window.updateCharts = async function() {
        console.log('更新图表数据');
    };
}

if (typeof updatePerformanceMetrics === 'undefined') {
    window.updatePerformanceMetrics = async function() {
        console.log('更新性能指标');
    };
}

if (typeof updateBlockchainStats === 'undefined') {
    window.updateBlockchainStats = async function() {
        console.log('更新区块链状态');
    };
}

if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'info') {
        console.log(`[${type}] ${message}`);
    };
}

class DeSciDemo {
    constructor() {
        this.isRunning = false;
        this.currentStep = 0;
        this.demoUsers = [];
        this.demoResearch = [];
        this.demoReviews = [];
    }

    // 启动演示
    async startDemo() {
        if (this.isRunning) {
            showToast('演示已在运行中', 'warning');
            return;
        }

        this.isRunning = true;
        this.currentStep = 0;
        showToast('开始DeSci平台演示...', 'success');
        addEventToLog('demo', '演示开始：展示完整的DeSci工作流程', 'success');

        try {
            await this.runDemoSequence();
        } catch (error) {
            console.error('演示运行失败:', error);
            showToast('演示运行失败', 'error');
        } finally {
            this.isRunning = false;
        }
    }

    // 停止演示
    stopDemo() {
        this.isRunning = false;
        showToast('演示已停止', 'warning');
        addEventToLog('demo', '演示已手动停止', 'warning');
    }

    // 演示主流程
    async runDemoSequence() {
        const steps = [
            { name: '初始化平台', action: this.initializePlatform.bind(this) },
            { name: '创建研究者用户', action: this.createResearcherUsers.bind(this) },
            { name: '发布研究项目', action: this.publishResearchProjects.bind(this) },
            { name: '模拟同行评审', action: this.simulatePeerReview.bind(this) },
            { name: '铸造研究NFT', action: this.simulateMintNFTs.bind(this) },
            { name: '展示数据分析', action: this.showDataAnalytics.bind(this) },
            { name: '演示区块链浏览器', action: this.demoBlockchainExplorer.bind(this) }
        ];

        for (let i = 0; i < steps.length && this.isRunning; i++) {
            this.currentStep = i;
            const step = steps[i];

            try {
                showToast(`步骤 ${i + 1}/${steps.length}: ${step.name}`, 'info');
                addEventToLog('demo', `执行步骤: ${step.name}`, 'info');

                await step.action();
                await this.wait(2000); // 步骤间暂停

            } catch (error) {
                console.error(`步骤 ${step.name} 失败:`, error);
                addEventToLog('demo', `步骤失败: ${step.name}`, 'error');
                break;
            }
        }

        if (this.isRunning) {
            showToast('演示完成！🎉', 'success');
            addEventToLog('demo', '演示完成：展示了完整的DeSci工作流程', 'success');
        }
    }

    // 步骤1: 初始化平台
    async initializePlatform() {
        addEventToLog('blockchain', '连接到区块链网络', 'success');
        addEventToLog('contract', '加载智能合约', 'success');
        addEventToLog('user', '初始化用户管理系统', 'success');

        // 模拟初始化过程
        await this.wait(1500);

        // 更新区块链状态
        await updateBlockchainStats();
        displayContractAddresses();

        addEventToLog('demo', '平台初始化完成', 'success');
    }

    // 步骤2: 创建研究者用户
    async createResearcherUsers() {
        const researchers = [
            {
                name: 'Dr. Alice Chen',
                age: 35,
                email: 'alice.chen@research.edu',
                specialty: '量子计算',
                institution: '清华大学'
            },
            {
                name: 'Prof. Bob Wilson',
                age: 42,
                email: 'bob.wilson@university.org',
                specialty: '机器学习',
                institution: '斯坦福大学'
            },
            {
                name: 'Dr. Carol Zhang',
                age: 38,
                email: 'carol.zhang@lab.cn',
                specialty: '生物信息学',
                institution: '中科院'
            },
            {
                name: 'Dr. David Liu',
                age: 31,
                email: 'david.liu@tech.com',
                specialty: '区块链安全',
                institution: 'MIT'
            },
            {
                name: 'Prof. Eva Wang',
                age: 45,
                email: 'eva.wang@academy.edu',
                specialty: '气候科学',
                institution: '牛津大学'
            }
        ];

        for (const researcher of researchers) {
            if (!this.isRunning) break;

            await this.createDemoUser(researcher);
            await this.wait(800);
        }

        addEventToLog('demo', `成功创建 ${researchers.length} 位研究者用户`, 'success');
    }

    // 步骤3: 发布研究项目
    async publishResearchProjects() {
        const researchProjects = [
            {
                title: '量子计算在密码学中的应用研究',
                description: '探讨量子算法对传统密码系统的潜在威胁，并提出相应的防御策略',
                type: '理论研究',
                author: 'Dr. Alice Chen',
                tags: ['量子计算', '密码学', '安全性']
            },
            {
                title: '基于深度学习的医疗影像诊断系统',
                description: '开发基于深度学习算法的医疗影像自动诊断系统，提高诊断准确率',
                type: '应用研究',
                author: 'Prof. Bob Wilson',
                tags: ['深度学习', '医疗影像', 'AI诊断']
            },
            {
                title: '基因组数据分析与疾病预测模型',
                description: '利用大数据分析技术对基因组数据进行挖掘，建立疾病预测模型',
                type: '生物信息学',
                author: 'Dr. Carol Zhang',
                tags: ['基因组学', '大数据', '疾病预测']
            },
            {
                title: '区块链在供应链溯源中的应用',
                description: '研究区块链技术在供应链管理中的应用，实现产品全生命周期溯源',
                type: '应用研究',
                author: 'Dr. David Liu',
                tags: ['区块链', '供应链', '溯源']
            },
            {
                title: '气候变化对生态系统的影响研究',
                description: '基于长期观测数据分析气候变化对森林生态系统的影响',
                type: '环境科学',
                author: 'Prof. Eva Wang',
                tags: ['气候变化', '生态系统', '环境科学']
            }
        ];

        for (const project of researchProjects) {
            if (!this.isRunning) break;

            await this.publishDemoResearch(project);
            await this.wait(1000);
        }

        addEventToLog('demo', `成功发布 ${researchProjects.length} 个研究项目`, 'success');
    }

    // 步骤4: 模拟同行评审
    async simulatePeerReview() {
        const reviews = [
            {
                researchTitle: '量子计算在密码学中的应用研究',
                reviewer: 'Dr. David Liu',
                rating: 9,
                comments: '这是一项非常前沿的研究，理论基础扎实，分析深入。建议进一步探讨量子安全性的实际应用场景。'
            },
            {
                researchTitle: '基于深度学习的医疗影像诊断系统',
                reviewer: 'Dr. Carol Zhang',
                rating: 8,
                comments: '算法设计合理，实验结果令人信服。建议增加更多临床数据的验证。'
            },
            {
                researchTitle: '基因组数据分析与疾病预测模型',
                reviewer: 'Prof. Eva Wang',
                rating: 9,
                comments: '数据处理方法创新，预测模型准确性高。是一项很有价值的研究。'
            },
            {
                researchTitle: '区块链在供应链溯源中的应用',
                reviewer: 'Dr. Alice Chen',
                rating: 8,
                comments: '技术实现可行，应用前景广阔。建议优化区块链性能。'
            },
            {
                researchTitle: '气候变化对生态系统的影响研究',
                reviewer: 'Prof. Bob Wilson',
                rating: 9,
                comments: '研究方法科学，数据分析严谨。结论对环境保护具有重要意义。'
            }
        ];

        for (const review of reviews) {
            if (!this.isRunning) break;

            await this.submitDemoReview(review);
            await this.wait(1200);
        }

        addEventToLog('demo', `完成 ${reviews.length} 次同行评审`, 'success');
    }

    // 步骤5: 铸造研究NFT
    async simulateMintNFTs() {
        const highRatedResearch = [
            '量子计算在密码学中的应用研究',
            '基因组数据分析与疾病预测模型',
            '气候变化对生态系统的影响研究'
        ];

        for (const title of highRatedResearch) {
            if (!this.isRunning) break;

            await this.mintDemoNFT(title);
            await this.wait(1500);
        }

        addEventToLog('demo', `为 ${highRatedResearch.length} 个优质研究铸造NFT`, 'success');
    }

    // 步骤6: 展示数据分析
    async showDataAnalytics() {
        // 更新图表数据
        await updateCharts();
        await updatePerformanceMetrics();

        addEventToLog('demo', '更新数据分析图表', 'success');
        await this.wait(2000);

        // 切换到分析标签页
        document.querySelector('[data-tab="analytics"]').click();
        addEventToLog('demo', '展示数据分析面板', 'success');
    }

    // 步骤7: 演示区块链浏览器
    async demoBlockchainExplorer() {
        // 切换到区块链浏览器标签页
        document.querySelector('[data-tab="blockchain"]').click();

        // 更新区块链数据
        await updateBlockchainStats();
        await this.wait(1000);

        // 模拟一些交易记录
        addTransactionToHistory('合约部署', '0x1234...abcd', 'success');
        addTransactionToHistory('用户注册', '0x5678...efgh', 'success');
        addTransactionToHistory('研究发布', '0x9abc...ijkl', 'success');
        addTransactionToHistory('NFT铸造', '0xdef0...mnop', 'success');

        addEventToLog('demo', '展示区块链浏览器功能', 'success');
        addEventToLog('demo', '演示完成！', 'success');
    }

    // 辅助方法：创建演示用户
    async createDemoUser(userData) {
        try {
            // 模拟用户创建
            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            addTransactionToHistory('用户注册', txHash, 'success');

            addEventToLog('user', `创建用户: ${userData.name} (${userData.specialty})`, 'success');

            this.demoUsers.push({
                ...userData,
                address: '0x' + Math.random().toString(16).substr(2, 10),
                createdAt: new Date(),
                reputation: Math.floor(Math.random() * 50) + 50
            });

            // 更新仪表板
            await loadDashboard();

        } catch (error) {
            console.error('创建演示用户失败:', error);
            throw error;
        }
    }

    // 辅助方法：发布演示研究
    async publishDemoResearch(researchData) {
        try {
            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            addTransactionToHistory('研究发布', txHash, 'success');

            addEventToLog('research', `发布研究: ${researchData.title}`, 'success');

            this.demoResearch.push({
                ...researchData,
                id: Math.random().toString(36).substr(2, 9),
                publishedAt: new Date(),
                status: 'UnderReview',
                datasetHash: 'Qm' + Math.random().toString(36).substr(2, 44),
                ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44)
            });

            // 更新仪表板
            await loadDashboard();

        } catch (error) {
            console.error('发布演示研究失败:', error);
            throw error;
        }
    }

    // 辅助方法：提交演示评审
    async submitDemoReview(reviewData) {
        try {
            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            addTransactionToHistory('同行评审', txHash, 'success');

            addEventToLog('review', `评审完成: ${reviewData.researchTitle} (${reviewData.rating}/10)`, 'success');

            this.demoReviews.push({
                ...reviewData,
                id: Math.random().toString(36).substr(2, 9),
                submittedAt: new Date(),
                ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44)
            });

            // 更新仪表板
            await loadDashboard();

        } catch (error) {
            console.error('提交演示评审失败:', error);
            throw error;
        }
    }

    // 辅助方法：铸造演示NFT
    async mintDemoNFT(title) {
        try {
            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            addTransactionToHistory('NFT铸造', txHash, 'success');

            addEventToLog('nft', `铸造NFT: ${title}`, 'success');

            // 更新仪表板
            await loadDashboard();

        } catch (error) {
            console.error('铸造演示NFT失败:', error);
            throw error;
        }
    }

    // 等待工具方法
    async wait(ms) {
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                if (this.isRunning) {
                    resolve();
                }
            }, ms);

            // 如果演示停止，清除定时器
            const checkRunning = () => {
                if (!this.isRunning) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(checkRunning, 100);
                }
            };
            checkRunning();
        });
    }

    // 获取演示状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentStep: this.currentStep,
            usersCount: this.demoUsers.length,
            researchCount: this.demoResearch.length,
            reviewsCount: this.demoReviews.length
        };
    }
}

// 全局演示实例
const deSciDemo = new DeSciDemo();

// 导出给全局使用
window.DeSciDemo = DeSciDemo;
window.deSciDemo = deSciDemo;
