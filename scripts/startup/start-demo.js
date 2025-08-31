#!/usr/bin/env node

/**
 * DeSci平台演示启动脚本
 * 用于启动前端演示服务器并展示完整的DeSci工作流程
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // 处理静态文件请求
    let filePath = path.join(__dirname, 'frontend', req.url === '/' ? 'index.html' : req.url);

    // 安全检查：防止目录遍历攻击
    const resolvedPath = path.resolve(filePath);
    const frontendPath = path.resolve(__dirname, 'frontend');

    if (!resolvedPath.startsWith(frontendPath)) {
        res.writeHead(403);
        res.end('403 Forbidden');
        return;
    }

    // 检查文件是否存在
    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在，返回404
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                // 其他错误
                res.writeHead(500);
                res.end('500 Internal Server Error');
            }
            return;
        }

        if (stats.isDirectory()) {
            // 如果是目录，尝试提供index.html
            filePath = path.join(filePath, 'index.html');
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    res.writeHead(404);
                    res.end('404 Not Found');
                    return;
                }
                serveFile(filePath, res);
            });
        } else {
            serveFile(filePath, res);
        }
    });
});

// 提供文件服务
function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('500 Internal Server Error');
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

// 启动服务器
function startServer() {
    server.listen(PORT, HOST, () => {
        console.log('🚀 ============================================');
        console.log('🚀         DeSci平台演示已启动');
        console.log('🚀 ============================================');
        console.log(`🚀 服务器地址: http://${HOST}:${PORT}`);
        console.log('🚀');
        console.log('🚀 演示功能说明:');
        console.log('🚀 1. 仪表板 - 查看平台统计数据');
        console.log('🚀 2. 用户档案 - 创建和管理研究者档案');
        console.log('🚀 3. 研究发布 - 发布和浏览研究项目');
        console.log('🚀 4. 同行评议 - 参与同行评审流程');
        console.log('🚀 5. NFT收藏 - 查看研究NFT');
        console.log('🚀 6. 区块链浏览器 - 实时区块链状态监控');
        console.log('🚀 7. 数据分析 - 可视化分析和性能指标');
        console.log('🚀');
        console.log('🚀 自动演示:');
        console.log('🚀 - 点击"开始完整演示"按钮体验完整流程');
        console.log('🚀 - 演示将自动创建用户、发布研究、模拟评审');
        console.log('🚀 - 实时展示区块链交易和事件日志');
        console.log('🚀');
        console.log('🚀 特色功能:');
        console.log('🚀 ✓ 实时区块链状态监控');
        console.log('🚀 ✓ 智能合约交互演示');
        console.log('🚀 ✓ Gas消耗分析');
        console.log('🚀 ✓ 事件监听和日志');
        console.log('🚀 ✓ 数据可视化图表');
        console.log('🚀 ✓ 模拟数据生成');
        console.log('🚀 ✓ 性能指标监控');
        console.log('🚀 ============================================');

        // 自动打开浏览器（如果支持）
        const open = require('open');
        try {
            open(`http://${HOST}:${PORT}`);
        } catch (error) {
            console.log('💡 请手动打开浏览器访问上述地址');
        }
    });
}

// 错误处理
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请尝试其他端口或停止占用该端口的进程`);
        process.exit(1);
    } else {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

// 检查必要的文件是否存在
function checkFiles() {
    const requiredFiles = [
        'frontend/index.html',
        'frontend/style.css',
        'frontend/app.js',
        'frontend/demo-script.js',
        'frontend/mock-data.js'
    ];

    let missingFiles = [];

    for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
            missingFiles.push(file);
        }
    }

    if (missingFiles.length > 0) {
        console.error('❌ 缺少必要的文件:');
        missingFiles.forEach(file => console.error(`   - ${file}`));
        process.exit(1);
    }
}

// 检查Node.js版本
function checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    if (majorVersion < 14) {
        console.warn(`⚠️  建议使用Node.js 14+版本，当前版本: ${version}`);
    }
}

// 主函数
function main() {
    console.log('🔍 检查环境和文件...');

    checkNodeVersion();
    checkFiles();

    console.log('✅ 环境检查完成');
    console.log('🌟 启动DeSci平台演示服务器...');

    startServer();
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { startServer, checkFiles };
