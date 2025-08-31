const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// 定义/health路由
console.log('定义/health路由...');
app.get('/health', (req, res) => {
    console.log('/health 被调用');
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Simple server is working'
    });
});

// 定义/test路由
console.log('定义/test路由...');
app.get('/test', (req, res) => {
    console.log('/test 被调用');
    res.json({
        status: 'ok',
        message: 'Test endpoint working'
    });
});

// 404处理
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
    console.log(`简单服务器运行在端口 ${PORT}`);
    console.log(`健康检查端点: http://localhost:${PORT}/health`);
    console.log(`测试端点: http://localhost:${PORT}/test`);
});
