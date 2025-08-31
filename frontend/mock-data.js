// DeSci平台模拟数据
// 用于演示和测试的丰富数据集合

const MOCK_DATA = {
    // 模拟用户数据
    users: [
        {
            name: 'Dr. Alice Chen',
            age: 35,
            email: 'alice.chen@tsinghua.edu.cn',
            specialty: '量子计算',
            institution: '清华大学',
            reputation: 95,
            publications: 42,
            citations: 1250,
            avatar: '👩‍🔬',
            bio: '量子计算与量子信息专家，专注于量子算法设计和量子安全研究',
            skills: ['量子算法', '密码学', '量子信息'],
            socialLinks: {
                github: 'alicechen-quantum',
                linkedin: 'alicechen-research'
            }
        },
        {
            name: 'Prof. Bob Wilson',
            age: 42,
            email: 'bob.wilson@stanford.edu',
            specialty: '机器学习',
            institution: '斯坦福大学',
            reputation: 88,
            publications: 67,
            citations: 2100,
            avatar: '👨‍🏫',
            bio: '机器学习和人工智能专家，在深度学习和计算机视觉领域有深入研究',
            skills: ['深度学习', '计算机视觉', '神经网络'],
            socialLinks: {
                github: 'bobwilson-ml',
                linkedin: 'bobwilson-ai'
            }
        },
        {
            name: 'Dr. Carol Zhang',
            age: 38,
            email: 'carol.zhang@cas.cn',
            specialty: '生物信息学',
            institution: '中国科学院',
            reputation: 92,
            publications: 38,
            citations: 980,
            avatar: '👩‍💼',
            bio: '生物信息学专家，专注于基因组学和计算生物学研究',
            skills: ['基因组学', '计算生物学', '数据分析'],
            socialLinks: {
                github: 'carolzhang-bio',
                linkedin: 'carolzhang-research'
            }
        },
        {
            name: 'Dr. David Liu',
            age: 31,
            email: 'david.liu@mit.edu',
            specialty: '区块链安全',
            institution: '麻省理工学院',
            reputation: 85,
            publications: 29,
            citations: 650,
            avatar: '👨‍💻',
            bio: '区块链安全和密码学专家，专注于智能合约安全和去中心化系统',
            skills: ['区块链', '智能合约', '密码学'],
            socialLinks: {
                github: 'davidliu-blockchain',
                linkedin: 'davidliu-security'
            }
        },
        {
            name: 'Prof. Eva Wang',
            age: 45,
            email: 'eva.wang@oxford.ac.uk',
            specialty: '气候科学',
            institution: '牛津大学',
            reputation: 90,
            publications: 55,
            citations: 1800,
            avatar: '👩‍🌾',
            bio: '气候科学家，专注于气候变化影响和环境可持续发展研究',
            skills: ['气候模型', '环境科学', '可持续发展'],
            socialLinks: {
                github: 'evawang-climate',
                linkedin: 'evawang-environment'
            }
        }
    ],

    // 模拟研究项目数据
    research: [
        {
            id: 'quantum-crypto-001',
            title: '量子计算对传统密码系统的威胁分析与防御策略研究',
            abstract: '本文深入探讨了量子计算技术对当前广泛使用的RSA和ECC密码系统的潜在威胁。通过理论分析和模拟实验，我们评估了量子算法如Shor算法和Grover算法对现有密码系统的破坏能力。同时，我们提出了基于量子安全密码学的新一代防御策略，包括格基密码和多元密码等后量子密码算法。研究结果表明，量子计算确实对传统密码系统构成严重威胁，但通过及时采用量子安全密码学可以有效应对这一挑战。',
            authors: ['Dr. Alice Chen', 'Dr. David Liu'],
            type: '理论研究',
            category: '计算机科学',
            tags: ['量子计算', '密码学', '量子安全', 'Shor算法'],
            status: 'Published',
            publishedDate: '2024-01-15',
            datasetHash: 'QmX7cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            ipfsHash: 'QmY9cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            citations: 45,
            downloads: 320,
            reviews: [
                {
                    reviewer: 'Prof. Michael Johnson',
                    rating: 9,
                    comments: '这是一项非常及时和重要的研究。作者对量子威胁的分析深入到位，提出的防御策略具有前瞻性。',
                    date: '2024-01-20'
                },
                {
                    reviewer: 'Dr. Sarah Davis',
                    rating: 8,
                    comments: '理论基础扎实，实验设计合理。建议进一步探讨量子安全密码的性能优化。',
                    date: '2024-01-22'
                }
            ],
            funding: '国家自然科学基金',
            doi: '10.1234/qc.2024.001'
        },
        {
            id: 'ml-medical-002',
            title: '基于深度学习的医疗影像辅助诊断系统开发与临床应用',
            abstract: '本研究开发了一种基于深度卷积神经网络的医疗影像辅助诊断系统。该系统能够自动识别和分析X光、CT和MRI影像，帮助医生提高诊断准确率和效率。我们采用了迁移学习技术和数据增强方法来解决医疗影像数据量有限的问题。通过在多个临床数据集上的验证，系统在肺炎、肿瘤和骨折检测等方面均取得了超过95%的准确率。临床试验结果表明，该系统能够显著提高医生的诊断效率，并减少误诊率。',
            authors: ['Prof. Bob Wilson', 'Dr. Lisa Chen'],
            type: '应用研究',
            category: '人工智能',
            tags: ['深度学习', '医疗影像', '辅助诊断', '卷积神经网络'],
            status: 'Published',
            publishedDate: '2024-02-01',
            datasetHash: 'QmZ1cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            ipfsHash: 'QmW2cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            citations: 67,
            downloads: 450,
            reviews: [
                {
                    reviewer: 'Dr. James Miller',
                    rating: 9,
                    comments: '系统设计合理，临床应用价值高。实验结果令人信服。',
                    date: '2024-02-10'
                }
            ],
            funding: '国家科技重大专项',
            doi: '10.1234/ml.2024.002'
        },
        {
            id: 'bioinformatics-003',
            title: '大规模基因组数据分析与复杂疾病遗传机制研究',
            abstract: '本研究利用大数据分析技术对大规模基因组数据进行挖掘，探索复杂疾病的遗传机制。我们分析了来自10万个体的全基因组测序数据，识别出与糖尿病、心血管疾病和癌症相关的数千个遗传变异位点。通过机器学习算法，我们构建了疾病风险预测模型，并验证了模型在独立队列中的预测效能。研究发现了多个新的疾病相关基因和生物学通路，为疾病的早期诊断和个性化治疗提供了重要线索。',
            authors: ['Dr. Carol Zhang', 'Prof. Robert Brown'],
            type: '生物信息学',
            category: '生命科学',
            tags: ['基因组学', '复杂疾病', '大数据分析', '疾病预测'],
            status: 'UnderReview',
            publishedDate: '2024-02-15',
            datasetHash: 'QmV3cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            ipfsHash: 'QmU4cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            citations: 23,
            downloads: 180,
            reviews: [
                {
                    reviewer: 'Prof. Anna Taylor',
                    rating: 9,
                    comments: '数据规模大，分析方法先进，发现很有价值。',
                    date: '2024-02-20'
                }
            ],
            funding: '国家重点研发计划',
            doi: '10.1234/bio.2024.003'
        },
        {
            id: 'blockchain-supply-004',
            title: '区块链技术在全球供应链溯源中的应用研究',
            abstract: '本研究探讨了区块链技术在全球供应链管理中的应用，特别是在产品溯源和质量控制方面的潜力。我们设计并实现了一个基于区块链的供应链溯源系统，能够实时跟踪产品的生产、运输和销售全过程。通过智能合约自动化执行供应链规则，并利用零知识证明技术保护商业机密。系统在模拟的全球供应链环境中进行了测试，证明了其在提高透明度、降低欺诈风险和优化供应链效率方面的有效性。',
            authors: ['Dr. David Liu', 'Dr. Mark Johnson'],
            type: '应用研究',
            category: '信息系统',
            tags: ['区块链', '供应链', '溯源', '智能合约'],
            status: 'Draft',
            publishedDate: null,
            datasetHash: 'QmT5cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            ipfsHash: 'QmS6cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            citations: 0,
            downloads: 0,
            reviews: [],
            funding: '企业合作项目',
            doi: null
        },
        {
            id: 'climate-ecosystem-005',
            title: '气候变化对森林生态系统结构和功能的影响研究',
            abstract: '本研究基于30年的长期观测数据，分析了气候变化对温带森林生态系统的影响。我们研究了温度升高和降水变化对森林组成、生物多样性和生态系统功能的影响。通过遥感数据和地面观测相结合的方法，我们量化了气候变化引起的森林动态变化。研究发现，气候变化导致某些树种分布北移，森林生物多样性发生显著变化。结果为森林资源管理和气候适应策略的制定提供了科学依据。',
            authors: ['Prof. Eva Wang', 'Dr. Thomas Green'],
            type: '环境科学',
            category: '生态学',
            tags: ['气候变化', '森林生态', '生物多样性', '遥感'],
            status: 'Published',
            publishedDate: '2024-01-30',
            datasetHash: 'QmR7cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            ipfsHash: 'QmQ8cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            citations: 34,
            downloads: 290,
            reviews: [
                {
                    reviewer: 'Dr. Linda White',
                    rating: 8,
                    comments: '研究方法科学，数据可靠，结论具有重要意义。',
                    date: '2024-02-05'
                }
            ],
            funding: '国家自然科学基金',
            doi: '10.1234/cli.2024.005'
        }
    ],

    // 模拟数据集
    datasets: [
        {
            id: 'quantum-dataset-001',
            name: '量子计算基准测试数据集',
            description: '包含多种量子算法的基准测试数据，包括Shor算法、Grover算法等在不同量子比特数下的性能表现数据',
            creator: 'Dr. Alice Chen',
            size: '2.3 GB',
            format: 'JSON/HDF5',
            license: 'CC-BY-4.0',
            tags: ['量子计算', '基准测试', '算法性能'],
            downloads: 156,
            views: 423,
            isPublic: true,
            price: 0,
            ipfsHash: 'QmP9cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            createdAt: '2024-01-10'
        },
        {
            id: 'medical-imaging-002',
            name: '多中心医疗影像数据集',
            description: '来自5家三级医院的胸部X光影像数据，包含正常和肺炎病例，共计10000张影像',
            creator: 'Prof. Bob Wilson',
            size: '15.7 GB',
            format: 'DICOM/JPEG',
            license: 'Research Use Only',
            tags: ['医疗影像', '肺炎', '深度学习'],
            downloads: 89,
            views: 567,
            isPublic: false,
            price: 1000, // wei
            ipfsHash: 'QmO0cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            createdAt: '2024-02-01'
        },
        {
            id: 'genome-data-003',
            name: '东亚人群基因组变异数据集',
            description: '包含5000个东亚个体的全基因组测序数据，重点标注疾病相关变异位点',
            creator: 'Dr. Carol Zhang',
            size: '45.2 GB',
            format: 'VCF/BAM',
            license: 'Controlled Access',
            tags: ['基因组学', '变异', '东亚人群'],
            downloads: 34,
            views: 289,
            isPublic: false,
            price: 5000, // wei
            ipfsHash: 'QmN1cKsJyF8VzBvNJzRn8L8K6HfVzJ8L8K6HfVzJ8L8K6',
            createdAt: '2024-01-25'
        }
    ],

    // 模拟区块链交易数据
    transactions: [
        {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            type: 'User Registration',
            from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            value: '0',
            gasUsed: 21000,
            gasPrice: '20000000000',
            status: 'success',
            timestamp: '2024-01-15T10:30:00Z',
            blockNumber: 12345678
        },
        {
            hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            type: 'Research Publication',
            from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            to: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
            value: '0',
            gasUsed: 125000,
            gasPrice: '25000000000',
            status: 'success',
            timestamp: '2024-01-15T11:15:00Z',
            blockNumber: 12345679
        },
        {
            hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
            type: 'NFT Mint',
            from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            to: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            value: '0',
            gasUsed: 85000,
            gasPrice: '22000000000',
            status: 'success',
            timestamp: '2024-01-15T12:00:00Z',
            blockNumber: 12345680
        }
    ],

    // 模拟性能指标
    performance: {
        avgResponseTime: 145, // ms
        contractSuccessRate: 98.5, // %
        avgGasUsed: 42000, // gas
        activeUsers: 1247,
        totalTransactions: 15678,
        networkLatency: 23, // ms
        uptime: 99.9 // %
    },

    // 模拟图表数据
    charts: {
        userGrowth: [
            { month: '2023-08', users: 0 },
            { month: '2023-09', users: 5 },
            { month: '2023-10', users: 12 },
            { month: '2023-11', users: 28 },
            { month: '2023-12', users: 45 },
            { month: '2024-01', users: 78 },
            { month: '2024-02', users: 124 }
        ],
        researchTypes: [
            { type: '理论研究', count: 45 },
            { type: '应用研究', count: 32 },
            { type: '实验研究', count: 28 },
            { type: '综述', count: 15 },
            { type: '其他', count: 8 }
        ],
        gasUsage: [
            { operation: '用户注册', gas: 21000 },
            { operation: '发布研究', gas: 125000 },
            { operation: '提交评审', gas: 78000 },
            { operation: '铸造NFT', gas: 85000 },
            { operation: '数据访问', gas: 45000 }
        ],
        reputation: [
            { level: '初级研究者', range: '0-50', count: 156 },
            { level: '中级研究者', range: '51-100', count: 89 },
            { level: '高级研究者', range: '101-150', count: 45 },
            { level: '资深专家', range: '151+', count: 23 }
        ]
    }
};

// 导出模拟数据
window.MOCK_DATA = MOCK_DATA;
