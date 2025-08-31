#!/usr/bin/env node

/**
 * DeSci Platform API 测试脚本
 * 用于验证后端API功能是否正常工作
 */

const http = require('http');
const https = require('https');

// 配置
const config = {
    baseUrl: process.env.API_URL || 'http://localhost:3000',
    timeout: 10000,
    debug: process.env.DEBUG === 'true'
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

/**
 * 发送HTTP请求
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const requestOptions = {
            headers: {
                'User-Agent': 'DeSci-API-Test/1.0',
                'Content-Type': 'application/json',
                ...options.headers
            },
            method: options.method || 'GET',
            timeout: config.timeout
        };

        const req = protocol.request(url, requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: data ? JSON.parse(data) : null,
                        url: url,
                        method: options.method || 'GET'
                    };
                    resolve(response);
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data,
                        url: url,
                        method: options.method || 'GET',
                        parseError: error.message
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({
                url: url,
                method: options.method || 'GET',
                error: error.message,
                code: error.code
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject({
                url: url,
                method: options.method || 'GET',
                error: 'Request timeout',
                code: 'TIMEOUT'
            });
        });

        // 发送请求体
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

/**
 * 测试用例
 */
const testCases = [
    {
        name: '健康检查',
        url: '/health',
        method: 'GET',
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   response.data.status === 'healthy' &&
                   response.data.timestamp;
        }
    },
    {
        name: 'API版本信息',
        url: '/api/version',
        method: 'GET',
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   response.data.name === 'DeSci Platform API' &&
                   response.data.version;
        }
    },
    {
        name: '区块链状态',
        url: '/api/blockchain/status',
        method: 'GET',
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   typeof response.data.connected === 'boolean' &&
                   response.data.contracts;
        }
    },
    {
        name: '获取项目列表',
        url: '/api/projects?limit=5&offset=0',
        method: 'GET',
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   Array.isArray(response.data.data) &&
                   response.data.pagination &&
                   typeof response.data.pagination.total === 'number';
        }
    },
    {
        name: '获取平台统计',
        url: '/api/stats',
        method: 'GET',
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   typeof response.data.total === 'number' &&
                   response.data.byStatus &&
                   response.data.byCategory;
        }
    },
    {
        name: '性能监控',
        url: '/api/performance',
        method: 'GET',
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   response.data.uptime &&
                   response.data.memory &&
                   response.data.cpu;
        }
    },
    {
        name: '用户登录测试',
        url: '/api/auth/login',
        method: 'POST',
        body: {
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        },
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   response.data.user &&
                   response.data.user.wallet_address;
        }
    },
    {
        name: '创建项目测试',
        url: '/api/projects',
        method: 'POST',
        body: {
            title: 'API测试项目',
            description: '通过API测试创建的项目',
            category: '测试',
            funding_amount: 1000
        },
        expectStatus: 200,
        validate: (response) => {
            return response.data &&
                   (response.data.id || response.data.message);
        }
    }
];

/**
 * 运行单个测试
 */
async function runTest(testCase) {
    const startTime = Date.now();
    const fullUrl = config.baseUrl + testCase.url;

    try {
        logger.info(`开始测试: ${testCase.name}`);
        logger.info(`请求: ${testCase.method} ${fullUrl}`);

        const response = await makeRequest(fullUrl, {
            method: testCase.method,
            body: testCase.body,
            headers: testCase.headers
        });

        const duration = Date.now() - startTime;

        // 检查状态码
        if (response.status !== testCase.expectStatus) {
            logger.error(`状态码不匹配: 期望 ${testCase.expectStatus}, 实际 ${response.status}`);
            return { success: false, testCase, response, duration };
        }

        // 验证响应内容
        if (testCase.validate && !testCase.validate(response)) {
            logger.error('响应内容验证失败');
            if (config.debug) {
                console.log('响应数据:', response.data);
            }
            return { success: false, testCase, response, duration };
        }

        logger.success(`${testCase.name} 测试通过 (${duration}ms)`);
        return { success: true, testCase, response, duration };

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${testCase.name} 测试失败: ${error.error || error.message}`);
        return { success: false, testCase, error, duration };
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('🚀 ============================================');
    console.log('🚀        DeSci Platform API 测试');
    console.log('🚀 ============================================');
    console.log(`🚀 测试目标: ${config.baseUrl}`);
    console.log(`🚀 超时设置: ${config.timeout}ms`);
    console.log(`🚀 调试模式: ${config.debug ? '✅ 启用' : '❌ 禁用'}`);
    console.log('🚀');

    const results = [];
    const startTime = Date.now();

    for (const testCase of testCases) {
        const result = await runTest(testCase);
        results.push(result);

        // 在测试之间添加延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const totalTime = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    console.log('\n📊 ============================================');
    console.log('📊              测试结果汇总');
    console.log('📊 ============================================');
    console.log(`📊 总测试数: ${results.length}`);
    console.log(`📊 通过测试: ${passed}`);
    console.log(`📊 失败测试: ${failed}`);
    console.log(`📊 总耗时: ${totalTime}ms`);
    console.log(`📊 平均耗时: ${Math.round(totalTime / results.length)}ms/测试`);
    console.log('📊');

    if (failed > 0) {
        console.log('❌ 失败的测试:');
        results.filter(r => !r.success).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.testCase.name}`);
            if (result.error) {
                console.log(`      错误: ${result.error.error || result.error.message}`);
            } else if (result.response) {
                console.log(`      状态码: ${result.response.status}`);
            }
        });
        console.log('❌');
    }

    // 详细结果（调试模式）
    if (config.debug && failed > 0) {
        console.log('🔍 详细错误信息:');
        results.filter(r => !r.success).forEach((result, index) => {
            console.log(`\n--- 测试 ${index + 1}: ${result.testCase.name} ---`);
            if (result.error) {
                console.log('错误详情:', result.error);
            }
            if (result.response) {
                console.log('响应状态:', result.response.status);
                console.log('响应头:', result.response.headers);
                if (result.response.data) {
                    console.log('响应数据:', JSON.stringify(result.response.data, null, 2));
                }
            }
        });
    }

    console.log('📊 ============================================');

    if (passed === results.length) {
        console.log('🎉 所有测试通过！API功能正常');
        process.exit(0);
    } else {
        console.log('⚠️  部分测试失败，请检查API服务');
        process.exit(1);
    }
}

/**
 * 检查服务是否可访问
 */
async function checkServiceAvailability() {
    try {
        logger.info('检查API服务可用性...');
        const response = await makeRequest(config.baseUrl + '/health', {
            method: 'GET',
            timeout: 5000
        });

        if (response.status === 200) {
            logger.success('API服务可访问');
            return true;
        } else {
            logger.error(`API服务响应异常: ${response.status}`);
            return false;
        }
    } catch (error) {
        logger.error('API服务不可访问:', error.error || error.message);
        logger.info('请确保API服务正在运行:');
        logger.info('  npm run backend');
        logger.info('或');
        logger.info('  npm run unified');
        return false;
    }
}

// 主函数
async function main() {
    // 检查服务可用性
    const isAvailable = await checkServiceAvailability();
    if (!isAvailable) {
        logger.error('无法连接到API服务，请检查服务状态');
        process.exit(1);
    }

    // 运行测试
    await runAllTests();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        logger.error('测试脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests, runTest, makeRequest };
