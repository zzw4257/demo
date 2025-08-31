#!/usr/bin/env node

/**
 * DeSci Platform 生产环境快速测试脚本
 * 用于验证生产环境下的所有功能是否正常
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
    testTimeout: 60000, // 60秒超时
    retryAttempts: 3,
    services: {
        frontend: { port: 3000, url: 'http://localhost:3000' },
        api: { port: 3000, url: 'http://localhost:3000/api' },
        blockchain: { port: 8545, url: 'http://localhost:8545' }
    }
};

// 测试结果统计
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
};

// 日志函数
const log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    warning: (msg) => console.log(`⚠️  ${msg}`)
};

// 执行Shell命令
function execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, {
            timeout: config.testTimeout,
            ...options
        }, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

// 检查端口是否被占用
function checkPort(port) {
    return new Promise((resolve) => {
        exec(`lsof -ti:${port}`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(false); // 端口未被占用
            } else {
                resolve(true); // 端口被占用
            }
        });
    });
}

// 等待服务启动
async function waitForService(port, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const isOccupied = await checkPort(port);
        if (isOccupied) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
}

// 测试用例
const testCases = [
    {
        name: '依赖检查',
        description: '检查项目依赖是否正确安装',
        run: async () => {
            try {
                await execCommand('npm list --depth=0');
                return { success: true, message: '依赖检查通过' };
            } catch (error) {
                return { success: false, message: '依赖检查失败', error: error.error.message };
            }
        }
    },
    {
        name: '编译检查',
        description: '检查合约编译是否正常',
        run: async () => {
            try {
                await execCommand('npx hardhat compile', { cwd: process.cwd() });
                return { success: true, message: '合约编译成功' };
            } catch (error) {
                return { success: false, message: '合约编译失败', error: error.stderr };
            }
        }
    },
    {
        name: 'Docker镜像构建',
        description: '检查Docker镜像是否能正常构建',
        run: async () => {
            try {
                await execCommand('docker build -t desci-platform-test .', { cwd: process.cwd() });
                return { success: true, message: 'Docker镜像构建成功' };
            } catch (error) {
                return { success: false, message: 'Docker镜像构建失败', error: error.stderr };
            }
        }
    },
    {
        name: '配置验证',
        description: '验证生产环境配置文件',
        run: async () => {
            const configFiles = [
                '.env.production',
                'docker-compose.yml',
                'Dockerfile',
                'monitoring.sh'
            ];

            const missing = [];
            for (const file of configFiles) {
                if (!fs.existsSync(path.join(process.cwd(), file))) {
                    missing.push(file);
                }
            }

            if (missing.length === 0) {
                return { success: true, message: '所有配置文件存在' };
            } else {
                return { success: false, message: `缺少配置文件: ${missing.join(', ')}` };
            }
        }
    },
    {
        name: '脚本权限检查',
        description: '检查脚本文件权限是否正确',
        run: async () => {
            try {
                const stats = fs.statSync('monitoring.sh');
                const isExecutable = !!(stats.mode & parseInt('111', 8));

                if (isExecutable) {
                    return { success: true, message: '脚本权限正确' };
                } else {
                    return { success: false, message: '脚本缺少执行权限' };
                }
            } catch (error) {
                return { success: false, message: '脚本权限检查失败', error: error.message };
            }
        }
    }
];

// 运行单个测试
async function runTest(testCase) {
    results.total++;

    log.info(`开始测试: ${testCase.name}`);
    log.info(`描述: ${testCase.description}`);

    try {
        const result = await testCase.run();

        if (result.success) {
            results.passed++;
            log.success(`${testCase.name}: ${result.message}`);
            results.details.push({
                name: testCase.name,
                status: 'passed',
                message: result.message
            });
        } else {
            results.failed++;
            log.error(`${testCase.name}: ${result.message}`);
            if (result.error) {
                console.log(`   错误详情: ${result.error}`);
            }
            results.details.push({
                name: testCase.name,
                status: 'failed',
                message: result.message,
                error: result.error
            });
        }
    } catch (error) {
        results.failed++;
        log.error(`${testCase.name}: 测试执行失败`);
        console.log(`   错误: ${error.message}`);
        results.details.push({
            name: testCase.name,
            status: 'error',
            message: '测试执行失败',
            error: error.message
        });
    }

    console.log('');
}

// 显示测试结果
function displayResults() {
    console.log('='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log(`总测试数: ${results.total}`);
    console.log(`✅ 通过: ${results.passed}`);
    console.log(`❌ 失败: ${results.failed}`);
    console.log(`⏭️  跳过: ${results.skipped}`);
    console.log(`📈 成功率: ${results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0}%`);
    console.log('');

    if (results.failed > 0) {
        console.log('❌ 失败的测试:');
        results.details.filter(d => d.status !== 'passed').forEach((detail, index) => {
            console.log(`   ${index + 1}. ${detail.name}: ${detail.message}`);
            if (detail.error) {
                console.log(`      错误: ${detail.error}`);
            }
        });
        console.log('');
    }

    console.log('='.repeat(60));

    if (results.failed === 0) {
        log.success('🎉 所有测试通过！生产环境配置正确');
        return true;
    } else {
        log.error('⚠️  部分测试失败，请检查配置');
        return false;
    }
}

// 显示使用建议
function displayRecommendations() {
    console.log('\n💡 使用建议:');
    console.log('');

    if (results.failed === 0) {
        console.log('✅ 生产环境配置完整，建议执行以下命令启动服务:');
        console.log('   npm run production');
        console.log('');
        console.log('📊 监控建议:');
        console.log('   ./monitoring.sh -c -i 300  # 每5分钟监控一次');
        console.log('   npm run production:status   # 查看服务状态');
        console.log('   npm run production:health   # 检查服务健康');
    } else {
        console.log('🔧 修复建议:');
        results.details.filter(d => d.status !== 'passed').forEach(detail => {
            switch (detail.name) {
                case '依赖检查':
                    console.log('   • 运行: npm install');
                    break;
                case '编译检查':
                    console.log('   • 检查 Hardhat 配置');
                    console.log('   • 运行: npx hardhat compile');
                    break;
                case 'Docker镜像构建':
                    console.log('   • 检查 Dockerfile 配置');
                    console.log('   • 运行: docker build -t desci-platform .');
                    break;
                case '配置验证':
                    console.log('   • 检查缺少的配置文件');
                    console.log('   • 复制模板文件: cp .env.production .env');
                    break;
                case '脚本权限检查':
                    console.log('   • 运行: chmod +x monitoring.sh');
                    break;
            }
        });
    }

    console.log('');
    console.log('📚 文档:');
    console.log('   • README.md - 完整使用指南');
    console.log('   • QUICKSTART.md - 快速开始指南');
    console.log('   • monitoring.sh --help - 监控脚本帮助');
    console.log('');
}

// 主函数
async function main() {
    console.log('🚀 DeSci Platform 生产环境测试');
    console.log('================================\n');

    // 显示系统信息
    log.info('系统信息:');
    console.log(`   Node.js: ${process.version}`);
    console.log(`   平台: ${process.platform}`);
    console.log(`   架构: ${process.arch}`);
    console.log(`   工作目录: ${process.cwd()}`);
    console.log('');

    // 运行所有测试
    for (const testCase of testCases) {
        await runTest(testCase);
    }

    // 显示结果
    const success = displayResults();

    // 显示建议
    displayRecommendations();

    // 返回退出码
    process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('测试脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = { runTest, testCases };
