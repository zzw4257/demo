const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    console.log('Health endpoint called');
    res.json({ status: 'ok', message: 'Test server is working' });
});

app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ status: 'ok', message: 'Test endpoint working' });
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
    console.log(`Test endpoint: http://localhost:${PORT}/test`);
});
