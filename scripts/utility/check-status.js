#!/usr/bin/env node

/**
 * DeSci平台状态检查脚本
 * 用于快速检查所有服务是否正常运行
 */

const http = require('http');

const SERVICES = {
    '演示服务器': { host: 'localhost', port: 3000 },
    'Hardhat网络': { host: 'localhost', port: 8545 },
};

function checkService(name, host, port) {
    return new Promise((resolve) => {
        const req = http.request({
            host,
            port,
            method: 'GET',
            timeout: 3000
        }, (res) => {
            resolve({ name, status: '运行中', port, code: res.statusCode });
        });

        req.on('error', () => {
            resolve({ name, status: '未运行', port, code: null });
        });

        req.on('timeout', () => {
            resolve({ name, status: '超时', port, code: null });
        });

        req.end();
    });
}

async function checkAllServices() {
    console.log('🔍 检查DeSci平台服务状态...\n');

    const results = await Promise.all(
        Object.entries(SERVICES).map(([name, config]) =>
            checkService(name, config.host, config.port)
        )
    );

    results.forEach(result => {
        const icon = result.status === '运行中' ? '✅' :
                    result.status === '超时' ? '⏱️' : '❌';
        console.log(`${icon} ${result.name}: ${result.status} (端口: ${result.port})`);
    });

    console.log('\n📋 服务状态汇总:');
    const running = results.filter(r => r.status === '运行中').length;
    const total = results.length;

    if (running === total) {
        console.log('🎉 所有服务正常运行！');
        console.log('🌐 演示地址: http://localhost:3000');
    } else {
        console.log(`⚠️  ${running}/${total} 个服务正常运行`);
        console.log('\n🔧 启动服务命令:');
        console.log('本地网络: npm run local');
        console.log('演示服务器: npm run demo');
    }

    return running === total;
}

// 如果直接运行此脚本
if (require.main === module) {
    checkAllServices();
}

module.exports = { checkAllServices, checkService };
