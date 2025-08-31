#!/usr/bin/env node

/**
 * DeSci Platform 统一启动脚本
 * 同时启动后端API服务和前端服务
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 ============================================');
console.log('🚀         DeSci Platform 统一启动器');
console.log('🚀 ============================================');

const processes = [];
let shuttingDown = false;

// 启动后端API服务
function startBackendAPI() {
    console.log('🔧 启动后端API服务...');

    const backendProcess = spawn('node', ['backend-api.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    backendProcess.on('error', (error) => {
        console.error('❌ 后端API服务启动失败:', error.message);
    });

    backendProcess.on('exit', (code) => {
        if (!shuttingDown) {
            console.log(`🔴 后端API服务退出 (代码: ${code})`);
        }
    });

    processes.push(backendProcess);
    return backendProcess;
}

// 启动Vue.js前端服务
function startVueFrontend() {
    console.log('🎨 启动Vue.js前端服务...');

    const vueProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'BS'),
        stdio: 'inherit'
    });

    vueProcess.on('error', (error) => {
        console.error('❌ Vue.js前端服务启动失败:', error.message);
        console.log('💡 请确保已安装Vue.js应用的依赖: cd BS && npm install');
    });

    vueProcess.on('exit', (code) => {
        if (!shuttingDown) {
            console.log(`🔴 Vue.js前端服务退出 (代码: ${code})`);
        }
    });

    processes.push(vueProcess);
    return vueProcess;
}

// 启动原生HTML前端服务
function startHTMLFrontend() {
    console.log('🌐 启动原生HTML前端服务...');

    const htmlProcess = spawn('node', ['start-demo.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    htmlProcess.on('error', (error) => {
        console.error('❌ 原生HTML前端服务启动失败:', error.message);
    });

    htmlProcess.on('exit', (code) => {
        if (!shuttingDown) {
            console.log(`🔴 原生HTML前端服务退出 (代码: ${code})`);
        }
    });

    processes.push(htmlProcess);
    return htmlProcess;
}

// 优雅关闭所有进程
function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('\n🛑 正在关闭所有服务...');

    processes.forEach((process, index) => {
        try {
            process.kill('SIGTERM');
        } catch (error) {
            console.error(`关闭进程 ${index + 1} 失败:`, error.message);
        }
    });

    setTimeout(() => {
        console.log('✅ 所有服务已关闭');
        process.exit(0);
    }, 2000);
}

// 监听进程信号
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 检查命令行参数
const args = process.argv.slice(2);
const startVue = args.includes('--vue') || args.includes('-v');
const startHTML = args.includes('--html') || args.includes('-h');
const startAll = args.includes('--all') || args.includes('-a') || args.length === 0;

// 启动服务
async function startServices() {
    try {
        // 启动后端API
        startBackendAPI();

        // 等待一秒让后端启动
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (startAll || startVue) {
            startVueFrontend();
        }

        if (startAll || startHTML) {
            startHTMLFrontend();
        }

        if (!startVue && !startHTML && !startAll) {
            console.log('💡 使用方法:');
            console.log('  npm run unified          # 启动所有服务');
            console.log('  npm run unified --vue    # 只启动Vue.js前端');
            console.log('  npm run unified --html   # 只启动HTML前端');
            console.log('  npm run unified --all    # 启动所有服务');
        }

        console.log('\n🎉 服务启动完成！');
        console.log('📊 后端API: http://localhost:3000');
        if (startVue || startAll) {
            console.log('🎨 Vue.js前端: http://localhost:3001');
        }
        if (startHTML || startAll) {
            console.log('🌐 HTML前端: http://localhost:3000');
        }
        console.log('\n⚡ 按 Ctrl+C 停止所有服务');

    } catch (error) {
        console.error('❌ 启动服务失败:', error.message);
        process.exit(1);
    }
}

// 启动服务
startServices();
