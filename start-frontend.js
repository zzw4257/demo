const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'frontend', req.url === '/' ? 'index.html' : req.url);
    
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🌐 DeSci Platform Frontend Server running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n🚀 Ready to test the DeSci Platform!`);
    console.log(`\n📋 Before using the frontend:`);
    console.log(`   1. Make sure Hardhat local node is running: npm run node`);
    console.log(`   2. Deploy contracts: npx hardhat run scripts/deployDeSciPlatform.js --network localhost`);
    console.log(`   3. Connect MetaMask to localhost:8545`);
    console.log(`   4. Import test accounts from Hardhat`);
    console.log(`\n🔧 Test Features:`);
    console.log(`   • Create user profiles`);
    console.log(`   • Publish research papers`);
    console.log(`   • Submit peer reviews`);
    console.log(`   • View platform statistics`);
    console.log(`   • Manage research NFTs`);
});
