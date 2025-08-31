#!/usr/bin/env node

/**
 * DeSci Platform 生产环境启动脚本
 * 提供生产级的系统启动和管理功能
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 配置
const config = {
    ports: {
        frontend: process.env.FRONTEND_PORT || 3000,
        backend: process.env.BACKEND_PORT || 3000,
        hardhat: 8545
    },
    environment: process.env.NODE_ENV || 'production',
    debug: process.env.DEBUG === 'true',
    blockchain: process.env.BLOCKCHAIN_ENABLED !== 'false',
    timeout: 30000, // 30秒超时
    retries: 3
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

// 进程管理器
class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.startTimes = new Map();
    }

    spawnProcess(name, command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            logger.info(`启动进程: ${name}`);
            logger.info(`命令: ${command} ${args.join(' ')}`);

            const proc = spawn(command, args, {
                stdio: 'pipe',
                ...options
            });

            this.processes.set(name, proc);
            this.startTimes.set(name, Date.now());

            proc.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    logger.info(`[${name}] ${output}`);
                }
            });

            proc.stderr.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    logger.warn(`[${name}] ${output}`);
                }
            });

            proc.on('close', (code) => {
                const runtime = Date.now() - this.startTimes.get(name);
                if (code === 0) {
                    logger.success(`${name} 进程正常退出 (运行时间: ${runtime}ms)`);
                } else {
                    logger.error(`${name} 进程异常退出 (退出码: ${code}, 运行时间: ${runtime}ms)`);
                }
                this.processes.delete(name);
                this.startTimes.delete(name);
            });

            proc.on('error', (error) => {
                logger.error(`${name} 进程启动失败:`, error.message);
                this.processes.delete(name);
                this.startTimes.delete(name);
                reject(error);
            });

            // 等待进程启动
            setTimeout(() => {
                if (proc.pid) {
                    resolve(proc);
                } else {
                    reject(new Error(`${name} 进程启动超时`));
                }
            }, 2000);
        });
    }

    killProcess(name) {
        const proc = this.processes.get(name);
        if (proc) {
            logger.info(`停止进程: ${name}`);
            proc.kill('SIGTERM');

            // 强制终止
            setTimeout(() => {
                if (this.processes.has(name)) {
                    proc.kill('SIGKILL');
                }
            }, 5000);

            return true;
        }
        return false;
    }

    killAll() {
        logger.info('停止所有进程...');
        for (const [name] of this.processes) {
            this.killProcess(name);
        }
    }

    getStatus() {
        const status = {};
        for (const [name, proc] of this.processes) {
            const startTime = this.startTimes.get(name);
            status[name] = {
                pid: proc.pid,
                running: !proc.killed,
                uptime: startTime ? Date.now() - startTime : 0
            };
        }
        return status;
    }
}

// 服务健康检查
class HealthChecker {
    checkService(name, host, port, path = '/') {
        return new Promise((resolve) => {
            const options = {
                hostname: host,
                port: port,
                path: path,
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                resolve({
                    name,
                    status: res.statusCode,
                    available: res.statusCode < 400,
                    responseTime: Date.now() - startTime
                });
            });

            const startTime = Date.now();

            req.on('error', () => {
                resolve({
                    name,
                    status: null,
                    available: false,
                    responseTime: Date.now() - startTime
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    name,
                    status: null,
                    available: false,
                    responseTime: Date.now() - startTime
                });
            });

            req.end();
        });
    }

    async checkAllServices() {
        const services = [
            { name: '前端服务', host: 'localhost', port: config.ports.frontend, path: '/' },
            { name: '后端API', host: 'localhost', port: config.ports.backend, path: '/health' }
        ];

        if (config.blockchain) {
            services.push({ name: 'Hardhat网络', host: 'localhost', port: config.ports.hardhat, path: '/' });
        }

        const results = await Promise.all(
            services.map(service => this.checkService(service.name, service.host, service.port, service.path))
        );

        return results;
    }
}

// 系统监控器
class SystemMonitor {
    constructor() {
        this.healthChecker = new HealthChecker();
        this.isMonitoring = false;
        this.monitorInterval = null;
    }

    startMonitoring(interval = 30000) { // 默认30秒检查一次
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        logger.info(`启动系统监控 (检查间隔: ${interval}ms)`);

        this.monitorInterval = setInterval(async () => {
            try {
                const healthResults = await this.healthChecker.checkAllServices();
                this.displayHealthStatus(healthResults);
            } catch (error) {
                logger.error('健康检查失败:', error.message);
            }
        }, interval);
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
            this.isMonitoring = false;
            logger.info('停止系统监控');
        }
    }

    displayHealthStatus(results) {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] 🔍 系统健康状态:`);

        results.forEach(result => {
            const status = result.available ? '✅ 正常' : '❌ 异常';
            const responseTime = result.responseTime ? `(${result.responseTime}ms)` : '';
            console.log(`   ${result.name}: ${status} ${responseTime}`);
        });

        const allHealthy = results.every(r => r.available);
        if (!allHealthy) {
            console.log('⚠️  检测到服务异常，请检查系统状态');
        }
    }
}

// 主应用类
class DeSciProductionApp {
    constructor() {
        this.processManager = new ProcessManager();
        this.monitor = new SystemMonitor();
        this.services = [];
        this.isShuttingDown = false;
    }

    async start() {
        try {
            logger.info('🚀 启动 DeSci Platform (生产环境)');
            logger.info(`环境: ${config.environment}`);
            logger.info(`调试模式: ${config.debug ? '启用' : '禁用'}`);
            logger.info(`区块链集成: ${config.blockchain ? '启用' : '禁用'}`);
            console.log('');

            // 设置进程退出处理
            this.setupShutdownHandlers();

            // 启动服务
            await this.startServices();

            // 启动监控
            this.monitor.startMonitoring();

            // 显示启动成功信息
            this.displayStartupInfo();

            // 保持进程运行
            this.keepAlive();

        } catch (error) {
            logger.error('启动失败:', error.message);
            await this.shutdown();
            process.exit(1);
        }
    }

    async startServices() {
        const services = [];

        // 启动区块链网络（如果启用）
        if (config.blockchain) {
            services.push(this.startHardhatNetwork());
        }

        // 启动后端API
        services.push(this.startBackendAPI());

        // 启动前端服务
        services.push(this.startFrontend());

        // 并行启动所有服务
        await Promise.all(services);

        logger.success('所有服务启动完成');
    }

    async startHardhatNetwork() {
        try {
            logger.info('启动 Hardhat 本地区块链网络...');
            await this.processManager.spawnProcess(
                'hardhat',
                'npx',
                ['hardhat', 'node'],
                { cwd: process.cwd() }
            );

            // 等待网络启动
            await this.waitForService('localhost', config.ports.hardhat, 10000);

            // 部署合约
            logger.info('部署智能合约...');
            await this.deployContracts();

        } catch (error) {
            logger.error('Hardhat网络启动失败:', error.message);
            throw error;
        }
    }

    async startBackendAPI() {
        try {
            logger.info('启动后端API服务...');
            await this.processManager.spawnProcess(
                'backend',
                'node',
                ['backend-api.js'],
                { cwd: process.cwd() }
            );

            // 等待API启动
            await this.waitForService('localhost', config.ports.backend, 5000, '/health');

        } catch (error) {
            logger.error('后端API启动失败:', error.message);
            throw error;
        }
    }

    async startFrontend() {
        try {
            logger.info('启动前端服务...');
            await this.processManager.spawnProcess(
                'frontend',
                'node',
                ['start-demo.js'],
                { cwd: process.cwd() }
            );

            // 等待前端启动
            await this.waitForService('localhost', config.ports.frontend, 5000);

        } catch (error) {
            logger.error('前端启动失败:', error.message);
            throw error;
        }
    }

    async deployContracts() {
        return new Promise((resolve, reject) => {
            logger.info('执行合约部署...');

            const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'hardhat'], {
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            let output = '';
            let errorOutput = '';

            deployProcess.stdout.on('data', (data) => {
                output += data.toString();
                logger.info(`[部署] ${data.toString().trim()}`);
            });

            deployProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                logger.warn(`[部署] ${data.toString().trim()}`);
            });

            deployProcess.on('close', (code) => {
                if (code === 0) {
                    logger.success('合约部署成功');
                    resolve();
                } else {
                    logger.error('合约部署失败:', errorOutput);
                    reject(new Error(`部署失败 (退出码: ${code})`));
                }
            });

            deployProcess.on('error', (error) => {
                logger.error('部署进程错误:', error.message);
                reject(error);
            });
        });
    }

    async waitForService(host, port, timeout = 10000, path = '/') {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                await new Promise((resolve, reject) => {
                    const req = http.request({
                        hostname: host,
                        port: port,
                        path: path,
                        method: 'GET',
                        timeout: 2000
                    }, (res) => {
                        if (res.statusCode < 400) {
                            resolve();
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}`));
                        }
                    });

                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('timeout'));
                    });
                    req.end();
                });

                return; // 服务已就绪
            } catch (error) {
                // 继续等待
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error(`服务启动超时 (${timeout}ms)`);
    }

    setupShutdownHandlers() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;

            logger.info(`收到 ${signal} 信号，正在关闭系统...`);
            await this.shutdown();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

        process.on('uncaughtException', (error) => {
            logger.error('未捕获的异常:', error);
            shutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('未处理的Promise拒绝:', reason);
            shutdown('unhandledRejection');
        });
    }

    async shutdown() {
        logger.info('开始关闭系统...');

        // 停止监控
        this.monitor.stopMonitoring();

        // 停止所有进程
        this.processManager.killAll();

        // 等待进程完全停止
        await new Promise(resolve => setTimeout(resolve, 2000));

        logger.info('系统关闭完成');
    }

    displayStartupInfo() {
        console.log('\n🎉 ============================================');
        console.log('🎉        DeSci Platform 启动成功');
        console.log('🎉 ============================================');
        console.log(`🎉 环境: ${config.environment}`);
        console.log(`🎉 区块链: ${config.blockchain ? '启用' : '禁用'}`);
        console.log('🎉');
        console.log('🌐 服务地址:');
        console.log(`   前端: http://localhost:${config.ports.frontend}`);
        console.log(`   API:  http://localhost:${config.ports.backend}/api`);
        if (config.blockchain) {
            console.log(`   区块链: http://localhost:${config.ports.hardhat}`);
        }
        console.log('🎉');
        console.log('📊 监控状态: 运行中');
        console.log('🛑 按 Ctrl+C 停止服务');
        console.log('🎉 ============================================\n');
    }

    keepAlive() {
        // 定期输出状态信息
        setInterval(() => {
            const status = this.processManager.getStatus();
            if (Object.keys(status).length > 0) {
                logger.info('进程状态:', status);
            }
        }, 60000); // 每分钟输出一次
    }
}

// 命令行界面
function displayHelp() {
    console.log(`
DeSci Platform 生产环境启动器

用法:
  node start-production.js [command] [options]

命令:
  start          启动所有服务 (默认)
  stop           停止所有服务
  status         显示服务状态
  health         检查服务健康状态
  logs           显示服务日志
  restart        重启所有服务

选项:
  --no-blockchain    禁用区块链功能
  --debug           启用调试模式
  --port <port>     指定前端端口
  --api-port <port> 指定API端口

示例:
  node start-production.js start
  node start-production.js start --no-blockchain --debug
  node start-production.js status
  node start-production.js stop
`);
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    // 解析命令行参数
    args.forEach((arg, index) => {
        if (arg === '--no-blockchain') {
            config.blockchain = false;
        } else if (arg === '--debug') {
            config.debug = true;
        } else if (arg === '--port' && args[index + 1]) {
            config.ports.frontend = parseInt(args[index + 1]);
        } else if (arg === '--api-port' && args[index + 1]) {
            config.ports.backend = parseInt(args[index + 1]);
        }
    });

    const app = new DeSciProductionApp();

    try {
        switch (command) {
            case 'start':
                await app.start();
                break;

            case 'stop':
                await app.shutdown();
                logger.success('服务已停止');
                break;

            case 'status':
                const status = app.processManager.getStatus();
                console.log('服务状态:', status);
                break;

            case 'health':
                const healthChecker = new HealthChecker();
                const results = await healthChecker.checkAllServices();
                results.forEach(result => {
                    const status = result.available ? '✅ 正常' : '❌ 异常';
                    console.log(`${result.name}: ${status}`);
                });
                break;

            case 'restart':
                await app.shutdown();
                await new Promise(resolve => setTimeout(resolve, 2000));
                await app.start();
                break;

            case 'help':
            case '--help':
            case '-h':
            default:
                displayHelp();
                break;
        }
    } catch (error) {
        logger.error('命令执行失败:', error.message);
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

module.exports = { DeSciProductionApp, ProcessManager, HealthChecker, SystemMonitor };
