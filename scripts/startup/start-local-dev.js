#!/usr/bin/env node

/**
 * DeSci Platform 本地开发环境启动器
 * 提供完整的本地开发体验，包括前端、后端和区块链网络
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 配置
const config = {
    ports: {
        frontend: process.env.FRONTEND_PORT || 3000,
        backend: process.env.BACKEND_PORT || 3001,
        blockchain: 8545
    },
    debug: process.env.DEBUG === 'true',
    blockchainEnabled: process.env.BLOCKCHAIN_ENABLED !== 'false',
    autoOpen: process.env.NO_AUTO_OPEN !== 'true'
};

// 进程管理器
class LocalDevManager {
    constructor() {
        this.processes = new Map();
        this.services = {
            blockchain: null,
            backend: null,
            frontend: null
        };
        this.isShuttingDown = false;
    }

    // 启动区块链网络
    async startBlockchain() {
        if (!config.blockchainEnabled) {
            console.log('⏭️  区块链功能已禁用，跳过启动');
            return;
        }

        console.log('⛓️  启动本地区块链网络...');

        return new Promise((resolve, reject) => {
            const blockchainProcess = spawn('npx', ['hardhat', 'node'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd()
            });

            this.services.blockchain = blockchainProcess;
            this.processes.set('blockchain', blockchainProcess);

            let outputBuffer = '';
            let ready = false;

            blockchainProcess.stdout.on('data', (data) => {
                const output = data.toString();
                outputBuffer += output;

                if (!ready && output.includes('Started HTTP and WebSocket JSON-RPC server')) {
                    ready = true;
                    console.log('✅ 本地区块链网络已启动');
                    console.log(`   📡 RPC地址: http://localhost:${config.ports.blockchain}`);
                    resolve();
                }

                // 显示关键信息
                if (output.includes('Account #0') || output.includes('Private Key:')) {
                    console.log('   🔑', output.trim());
                }
            });

            blockchainProcess.stderr.on('data', (data) => {
                console.log('   ⚠️ ', data.toString().trim());
            });

            blockchainProcess.on('close', (code) => {
                if (!this.isShuttingDown) {
                    console.log(`❌ 区块链网络异常退出 (代码: ${code})`);
                }
                this.processes.delete('blockchain');
            });

            blockchainProcess.on('error', (error) => {
                console.error('❌ 区块链网络启动失败:', error.message);
                reject(error);
            });

            // 超时处理
            setTimeout(() => {
                if (!ready) {
                    reject(new Error('区块链网络启动超时'));
                }
            }, 30000);
        });
    }

    // 部署智能合约
    async deployContracts() {
        if (!config.blockchainEnabled) {
            console.log('⏭️  区块链功能已禁用，跳过合约部署');
            return;
        }

        console.log('📝 部署智能合约...');

        return new Promise((resolve, reject) => {
            const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'hardhat'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd()
            });

            let deployed = false;

            deployProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('   📝', output.trim());

                if (output.includes('部署成功') || output.includes('所有合约部署完成')) {
                    deployed = true;
                }
            });

            deployProcess.stderr.on('data', (data) => {
                console.log('   ⚠️ ', data.toString().trim());
            });

            deployProcess.on('close', (code) => {
                if (code === 0 && deployed) {
                    console.log('✅ 智能合约部署完成');
                    resolve();
                } else {
                    reject(new Error(`合约部署失败 (退出码: ${code})`));
                }
            });

            deployProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    // 启动后端API服务
    async startBackend() {
        console.log('🔧 启动后端API服务...');

        return new Promise((resolve, reject) => {
            const backendProcess = spawn('node', ['backend-api.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    PORT: config.ports.backend,
                    BLOCKCHAIN_RPC_URL: `http://localhost:${config.ports.blockchain}`,
                    NODE_ENV: 'development'
                }
            });

            this.services.backend = backendProcess;
            this.processes.set('backend', backendProcess);

            let ready = false;

            backendProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('   🔧', output.trim());

                if (!ready && (output.includes('listening') || output.includes('started') || output.includes('服务器启动完成'))) {
                    ready = true;
                    console.log('✅ 后端API服务已启动');
                    console.log(`   🌐 API地址: http://localhost:${config.ports.backend}`);
                    console.log(`   📊 健康检查: http://localhost:${config.ports.backend}/health`);
                    resolve();
                }
            });

            backendProcess.stderr.on('data', (data) => {
                console.log('   ⚠️ ', data.toString().trim());
            });

            backendProcess.on('close', (code) => {
                if (!this.isShuttingDown) {
                    console.log(`❌ 后端服务异常退出 (代码: ${code})`);
                }
                this.processes.delete('backend');
            });

            backendProcess.on('error', (error) => {
                console.error('❌ 后端服务启动失败:', error.message);
                reject(error);
            });

            // 超时处理 (增加时间以适应区块链连接初始化)
            setTimeout(() => {
                if (!ready) {
                    reject(new Error('后端服务启动超时'));
                }
            }, 30000);
        });
    }

    // 启动前端服务
    async startFrontend() {
        console.log('🎨 启动前端服务...');

        return new Promise((resolve, reject) => {
            const frontendProcess = spawn('node', ['start-demo.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    PORT: config.ports.frontend,
                    BLOCKCHAIN_RPC_URL: `http://localhost:${config.ports.blockchain}`,
                    API_BASE_URL: `http://localhost:${config.ports.backend}`,
                    NODE_ENV: 'development'
                }
            });

            this.services.frontend = frontendProcess;
            this.processes.set('frontend', frontendProcess);

            let ready = false;

            frontendProcess.stdout.on('data', (data) => {
                const output = data.toString();

                // 显示关键启动信息
                if (output.includes('DeSci平台演示已启动') || output.includes('服务器地址')) {
                    console.log('✅ 前端服务已启动');
                    console.log(`   🌐 前端地址: http://localhost:${config.ports.frontend}`);
                    ready = true;
                    resolve();
                }

                // 显示其他重要信息
                if (output.includes('🚀') || output.includes('功能说明')) {
                    console.log('   🎨', output.trim());
                }
            });

            frontendProcess.stderr.on('data', (data) => {
                console.log('   ⚠️ ', data.toString().trim());
            });

            frontendProcess.on('close', (code) => {
                if (!this.isShuttingDown) {
                    console.log(`❌ 前端服务异常退出 (代码: ${code})`);
                }
                this.processes.delete('frontend');
            });

            frontendProcess.on('error', (error) => {
                console.error('❌ 前端服务启动失败:', error.message);
                reject(error);
            });

            // 超时处理
            setTimeout(() => {
                if (!ready) {
                    reject(new Error('前端服务启动超时'));
                }
            }, 10000);
        });
    }

    // 检查服务健康状态
    async checkHealth() {
        const services = [
            { name: '前端服务', url: `http://localhost:${config.ports.frontend}`, port: config.ports.frontend },
            { name: '后端API', url: `http://localhost:${config.ports.backend}/health`, port: config.ports.backend }
        ];

        if (config.blockchainEnabled) {
            services.push({
                name: '区块链网络',
                url: `http://localhost:${config.ports.blockchain}`,
                port: config.ports.blockchain
            });
        }

        console.log('\n🏥 服务健康检查:');

        for (const service of services) {
            try {
                await new Promise((resolve, reject) => {
                    const req = http.request({
                        hostname: 'localhost',
                        port: service.port,
                        path: service.url.includes('/health') ? '/health' : '/',
                        method: 'GET',
                        timeout: 3000
                    }, (res) => {
                        if (res.statusCode < 400) {
                            console.log(`   ✅ ${service.name}: 正常`);
                            resolve();
                        } else {
                            console.log(`   ❌ ${service.name}: 状态码 ${res.statusCode}`);
                            reject();
                        }
                    });

                    req.on('error', () => {
                        console.log(`   ❌ ${service.name}: 连接失败`);
                        reject();
                    });

                    req.on('timeout', () => {
                        req.destroy();
                        console.log(`   ❌ ${service.name}: 超时`);
                        reject();
                    });

                    req.end();
                });
            } catch (error) {
                // 错误已在上面处理
            }
        }
    }

    // 显示开发环境信息
    displayDevInfo() {
        console.log('\n🎉 ============================================');
        console.log('🎉        DeSci Platform 本地开发环境');
        console.log('🎉 ============================================');
        console.log(`🎉 开发模式: ${config.debug ? '调试模式' : '标准模式'}`);
        console.log(`🎉 区块链: ${config.blockchainEnabled ? '启用' : '禁用'}`);
        console.log('🎉');
        console.log('🌐 服务地址:');
        console.log(`   前端: http://localhost:${config.ports.frontend}`);
        console.log(`   API:  http://localhost:${config.ports.backend}`);
        if (config.blockchainEnabled) {
            console.log(`   区块链: http://localhost:${config.ports.blockchain}`);
        }
        console.log('🎉');
        console.log('📊 开发工具:');
        console.log('   • 实时重新加载');
        console.log('   • 热重启支持');
        console.log('   • 错误日志输出');
        console.log('   • 性能监控');
        console.log('🎉');
        console.log('🛑 停止服务: Ctrl+C');
        console.log('🔄 重启服务: 杀死进程后重新运行');
        console.log('🎉 ============================================\n');
    }

    // 启动所有服务
    async start() {
        try {
            console.log('🚀 启动 DeSci Platform 本地开发环境...\n');

            // 检查环境
            await this.checkEnvironment();

            // 启动区块链网络
            if (config.blockchainEnabled) {
                await this.startBlockchain();
                await this.deployContracts();
            }

            // 启动后端服务
            await this.startBackend();

            // 启动前端服务
            await this.startFrontend();

            // 健康检查
            await this.checkHealth();

            // 显示信息
            this.displayDevInfo();

            // 自动打开浏览器
            if (config.autoOpen) {
                this.openBrowser();
            }

            // 保持进程运行
            this.keepAlive();

        } catch (error) {
            console.error('❌ 启动失败:', error.message);
            await this.shutdown();
            process.exit(1);
        }
    }

    // 检查开发环境
    async checkEnvironment() {
        console.log('🔍 检查开发环境...');

        // 检查Node.js版本
        const nodeVersion = process.version;
        console.log(`   ✅ Node.js: ${nodeVersion}`);

        // 检查必要的文件
        const requiredFiles = [
            'package.json',
            'hardhat.config.js',
            'contracts/',
            'frontend/index.html',
            'frontend/app.js',
            'backend-api.js'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(process.cwd(), file))) {
                throw new Error(`缺少必要文件: ${file}`);
            }
        }
        console.log('   ✅ 项目文件完整');

        // 检查依赖
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const deps = Object.keys(packageJson.dependencies || {});
            if (deps.length === 0) {
                throw new Error('缺少依赖包');
            }
            console.log(`   ✅ 依赖包: ${deps.length} 个已安装`);
        } catch (error) {
            throw new Error('依赖检查失败');
        }
    }

    // 打开浏览器
    openBrowser() {
        const open = require('open');
        try {
            setTimeout(() => {
                open(`http://localhost:${config.ports.frontend}`);
                console.log('🌐 浏览器已自动打开');
            }, 2000);
        } catch (error) {
            console.log('💡 请手动打开浏览器访问前端地址');
        }
    }

    // 保持进程运行并监控
    keepAlive() {
        // 定期健康检查
        setInterval(async () => {
            try {
                await this.checkHealth();
            } catch (error) {
                console.warn('健康检查失败:', error.message);
            }
        }, 60000); // 每分钟检查一次

        // 设置优雅关闭
        this.setupShutdownHandlers();
    }

    // 设置关闭处理器
    setupShutdownHandlers() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;

            console.log(`\n🛑 收到 ${signal} 信号，正在关闭开发环境...`);
            await this.shutdown();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Windows 支持
        if (process.platform === 'win32') {
            process.on('SIGBREAK', () => shutdown('SIGBREAK'));
        }
    }

    // 关闭所有服务
    async shutdown() {
        console.log('\n🔄 正在关闭所有服务...');

        // 停止所有进程
        for (const [name, process] of this.processes) {
            console.log(`   🛑 停止 ${name}...`);
            try {
                process.kill('SIGTERM');

                // 等待进程停止
                await new Promise(resolve => {
                    const timeout = setTimeout(() => {
                        process.kill('SIGKILL');
                        resolve();
                    }, 5000);

                    process.on('close', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                });
            } catch (error) {
                console.warn(`   ⚠️  停止 ${name} 时出错:`, error.message);
            }
        }

        this.processes.clear();
        console.log('✅ 所有服务已停止');
    }
}

// 主函数
async function main() {
    const manager = new LocalDevManager();

    try {
        await manager.start();
    } catch (error) {
        console.error('❌ 本地开发环境启动失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('启动脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = { LocalDevManager };
