// 简单的API测试脚本
async function testAPI() {
    console.log('开始测试API...');

    const endpoints = [
        'http://localhost:3000/health',
        'http://localhost:3000/api/version',
        'http://localhost:3000/api/stats'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n测试 ${endpoint}...`);
            const response = await fetch(endpoint);
            console.log(`状态码: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                console.log('响应数据:', JSON.stringify(data, null, 2));
            } else {
                console.log('错误响应:', response.statusText);
            }
        } catch (error) {
            console.error(`请求失败 ${endpoint}:`, error.message);
        }
    }
}

// 运行测试
testAPI().catch(console.error);
