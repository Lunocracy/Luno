const { spawn, execSync } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const lunoDir = '/storage/emulated/0/Luno/web/Luno';
const luno2Dir = '/storage/emulated/0/luno2/web/Luno';
const stableDir = '/storage/emulated/0/Luno_Stable/web/Luno';

const C_CYAN = '\u001b[36m';
const C_GREEN = '\u001b[32m';
const C_YELLOW = '\u001b[33m';
const C_RED = '\u001b[31m';
const C_MAGENTA = '\u001b[35m';
const C_RESET = '\u001b[0m';

let lunoProcess = null;
let luno2Process = null;
let stableProcess = null;

const supervisorKeepAlive = setInterval(function() {}, 10000);

function killProcesses() {
  if (lunoProcess) { try { lunoProcess.kill('SIGTERM'); } catch(e){} lunoProcess = null; }
  if (luno2Process) { try { luno2Process.kill('SIGTERM'); } catch(e){} luno2Process = null; }
  if (stableProcess) { try { stableProcess.kill('SIGTERM'); } catch(e){} stableProcess = null; }
  try { execSync('pkill -f "node server.js" 2>/dev/null'); } catch(e){}
}

function startServers() {
  killProcesses();
  console.clear();
  console.log(C_CYAN + '================================================' + C_RESET);
  console.log(C_MAGENTA + '🌙 Luno Multi-Port Supervisor' + C_RESET);
  console.log(C_CYAN + '================================================' + C_RESET);

  if (fs.existsSync(lunoDir)) {
    lunoProcess = spawn('node', ['server.js'], {
      cwd: lunoDir,
      env: Object.assign({}, process.env, { PORT: '8080' }),
      stdio: 'inherit'
    });
    console.log(C_GREEN + '  ✅ Luno 1.0 Main (8080)   -> http://localhost:8080' + C_RESET);
  }

  if (fs.existsSync(luno2Dir)) {
    luno2Process = spawn('node', ['server.js'], {
      cwd: luno2Dir,
      env: Object.assign({}, process.env, { PORT: '8081' }),
      stdio: 'inherit'
    });
    console.log(C_CYAN + '  🚀 Luno 2.0 Engine (8081) -> http://localhost:8081' + C_RESET);
  }

  if (fs.existsSync(stableDir)) {
    stableProcess = spawn('node', ['server.js'], {
      cwd: stableDir,
      env: Object.assign({}, process.env, { PORT: '8088' }),
      stdio: 'inherit'
    });
    console.log(C_MAGENTA + '  🛡️ Stable Copy (8088)      -> http://localhost:8088' + C_RESET);
  }

  console.log('\n' + C_YELLOW + '  [r] Restart All  |  [q] Quit Controller' + C_RESET);
  console.log(C_CYAN + '------------------------------------------------\n' + C_RESET);
}

if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  try { process.stdin.setRawMode(true); } catch(e){}
  process.stdin.resume();

  process.stdin.on('keypress', function(str, key) {
    if (key.name === 'q' || (key && key.ctrl && key.name === 'c')) {
      console.log('\n' + C_RED + '🛑 Stopping all Luno servers...' + C_RESET);
      killProcesses();
      clearInterval(supervisorKeepAlive);
      process.exit(0);
    } else if (key.name === 'r') {
      console.log('\n' + C_YELLOW + '🔄 Restarting all servers...' + C_RESET);
      startServers();
    }
  });
}

startServers();