const http = require('http');
const path = require('path');
const fs = require('fs');

process.on('uncaughtException', (err) => {
  console.error('[Luno Server Guard]', err.message);
});

const PORT = process.env.PORT || 8080;

// Point strictly to __dirname (inner Luno) if luno.json exists, fallback to parent if necessary
const defaultDir = fs.existsSync(path.join(__dirname, 'luno.json')) ? __dirname : path.resolve(__dirname, '..');
const RUNTIME_STATE = { rootDir: defaultDir };

const server = http.createServer(async (req, res) => {
  try {
    // Flush Luno module cache so disk updates take effect instantly
    Object.keys(require.cache).forEach(key => {
      if (key.includes('LunoServer.js') || key.includes('LunoClassPatcher.js')) {
        delete require.cache[key];
      }
    });

    const LunoServer = require('./core/LunoServer.js');
    LunoServer.setRootDir(RUNTIME_STATE.rootDir);
    await LunoServer.handle(req, res);
    RUNTIME_STATE.rootDir = LunoServer.getRootDir();
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        status: 'error',
        error: 'Luno Server Exception',
        message: err.message,
        stack: err.stack
      }, null, 2));
    }
  }
});

server.listen(PORT, () => {
  console.log('[Luno Server] Active on http://localhost:' + PORT);
});