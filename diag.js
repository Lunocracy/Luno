const fs = require('fs');
const { execSync } = require('child_process');

console.log('\n========================================');
console.log('🩺 LUNO TERMINAL BOOT DIAGNOSTIC');
console.log('========================================');

// 1. Check luno.json
if (!fs.existsSync('luno.json')) {
  console.log('❌ CRITICAL: luno.json is missing in current directory!');
  process.exit(1);
}

const lunoJson = JSON.parse(fs.readFileSync('luno.json', 'utf8'));
console.log('Target Project:', lunoJson.name, '(Version ' + lunoJson.version + ')');
console.log('Entrypoint:', JSON.stringify(lunoJson.entrypoint || {}));

// 2. Check all main scripts
let errors = 0;
let checked = 0;

(lunoJson.main || []).forEach(file => {
  const rel = file.replace(/^Luno\//, '');
  checked++;
  if (!fs.existsSync(rel)) {
    console.log('❌ MISSING FILE:', rel);
    errors++;
  } else {
    try {
      execSync('node -c "' + rel + '"', { stdio: 'pipe' });
    } catch (err) {
      console.log('\n❌ SYNTAX ERROR IN:', rel);
      console.log(err.stderr ? err.stderr.toString() : err.message);
      errors++;
    }
  }
});

// 3. Check LunoPatchLog.html if it exists
if (fs.existsSync('LunoPatchLog.html')) {
  const patchContent = fs.readFileSync('LunoPatchLog.html', 'utf8');
  console.log('\nPatch Log: Present (' + patchContent.length + ' bytes)');
} else if (fs.existsSync('../LunoPatchLog.html')) {
  const patchContent = fs.readFileSync('../LunoPatchLog.html', 'utf8');
  console.log('\nParent Patch Log: Present (' + patchContent.length + ' bytes)');
}

// 4. Check index.html
console.log('\n--- HTML SHELL CHECK ---');
if (!fs.existsSync('index.html')) {
  console.log('❌ index.html is missing!');
} else {
  const idx = fs.readFileSync('index.html', 'utf8');
  console.log('✅ index.html present (' + idx.length + ' bytes)');
  if (!idx.includes('LunoLoader')) {
    console.log('⚠️ Warning: index.html does not reference LunoLoader');
  }
}

console.log('\n========================================');
if (errors === 0) {
  console.log('✅ All ' + checked + ' startup scripts PASSED syntax check!');
} else {
  console.log('⚠️ Found ' + errors + ' issue(s) in startup scripts.');
}
console.log('========================================\n');
