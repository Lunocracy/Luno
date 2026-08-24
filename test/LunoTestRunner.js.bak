class LunoTestRunner {
  constructor() {}

  static results = [];

  static assert(title, condition, detail) {
    detail = detail || '';
    const item = { title, success: Boolean(condition), detail };
    LunoTestRunner.results.push(item);
    console.log((item.success ? '✅ PASSED: ' : '❌ FAILED: ') + title + (detail ? ` (${detail})` : ''));
    return item;
  }

  static async runTestSuite() {
    LunoTestRunner.results = [];
    console.log('🧪 Starting Luno 3.6.2 Web-Root Architecture Test Suite...');

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    // Test 1: Client-Side ES6 Class Body AST Method Replacement
    try {
      if (typeof LunoClassPatcher !== 'undefined' && typeof LunoClassPatcher.patchMethodInSource === 'function') {
        const sampleSource = 'class DemoApp {\n  constructor() {}\n  greet() {\n    return "hello";\n  }\n}';
        const patchedSource = LunoClassPatcher.patchMethodInSource(sampleSource, 'DemoApp.greet', 'greet() {\n  return "world";\n}');
        const hasNoPrototypeAppends = !patchedSource.includes('.prototype.');
        const isReplacedInBody = patchedSource.includes('return "world"') && patchedSource.indexOf('world') < patchedSource.lastIndexOf('}');
        LunoTestRunner.assert('LunoClassPatcher: ES6 Class Body AST Method Replacement', hasNoPrototypeAppends && isReplacedInBody, 'Replaced method cleanly inside ES6 class body');
      } else {
        LunoTestRunner.assert('LunoClassPatcher: ES6 Class Body AST Method Replacement', false, 'LunoClassPatcher unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: ES6 Class Body AST Method Replacement', false, e.message);
    }

    // Test 2: Manifest Decision Engine Web-Root Path Equivalence
    try {
      if (typeof LunoManifestDecisionEngine !== 'undefined') {
        const isClientWebRooted = LunoManifestDecisionEngine.isStartupClientFile('Luno/app/ClientApp.js', { main: ['Luno/app/ClientApp.js'] });
        const isClientRelative = LunoManifestDecisionEngine.isStartupClientFile('app/ClientApp.js', { main: ['Luno/app/ClientApp.js'] });
        const isServerDirect = !LunoManifestDecisionEngine.isStartupClientFile('Luno/core/LunoServer.js', { main: ['Luno/app/ClientApp.js'] });
        LunoTestRunner.assert(
          'LunoManifestDecisionEngine: Web-Root & Relative Path Equivalence',
          isClientWebRooted && isClientRelative && isServerDirect,
          'Recognizes both Luno/app/... and app/... client files'
        );
      } else {
        LunoTestRunner.assert('LunoManifestDecisionEngine: Path Equivalence', false, 'LunoManifestDecisionEngine unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoManifestDecisionEngine: Path Equivalence', false, e.message);
    }

    // Test 3: Web-Root Patch Log Query via API
    try {
      const res = await fetch('/api/fs/read?path=LunoPatchLog.html');
      const data = await res.json();
      const isLogAvailable = res.ok && data && data.success;
      LunoTestRunner.assert(
        'Web-Root Patch Log: Direct Query (/api/fs/read?path=LunoPatchLog.html)',
        isLogAvailable,
        `Read unified patch log (${data.lines || 0} lines)`
      );
    } catch (e) {
      LunoTestRunner.assert('Web-Root Patch Log Query', false, e.message);
    }

    // Test 4: LunoPayloadParser HTML Container Parsing & Directives
    try {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parse === 'function') {
        const closeScript = '</' + 'script>';
        const htmlPayload = [
          '<' + 'script data-file="Luno/app/ClientApp.js" data-method="ClientApp.saveCode" data-action="patch">',
          'saveCode() { return true; }',
          closeScript,
          '<' + 'script type="application/json" data-file="Luno/luno.json" data-action="merge">',
          '{ "testKey": "testValue" }',
          closeScript
        ].join('\n');

        const parsed = LunoPayloadParser.parse(htmlPayload);
        const isTwoFiles = parsed.files.length === 2;
        const hasMerge = parsed.files[1] && parsed.files[1].action === 'merge';

        LunoTestRunner.assert(
          'LunoPayloadParser: Web-Root Directives & JSON Merge Parsing',
          isTwoFiles && hasMerge,
          `Parsed ${parsed.files.length} container(s)`
        );
      } else {
        LunoTestRunner.assert('LunoPayloadParser: Parsing', false, 'LunoPayloadParser unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoPayloadParser: Parsing', false, e.message);
    }

    // Test 5: Outbox Codebase Scoping via /api/all-code
    try {
      const codeRes = await fetch('/api/all-code?project=Luno');
      const codeData = await codeRes.json();
      const hasManifest = Boolean(codeRes.ok && Array.isArray(codeData.manifest));
      const allWebRooted = hasManifest && codeData.manifest.some(f => f.startsWith('Luno/'));
      LunoTestRunner.assert(
        'Outbox Bundler: Web-Rooted Codebase Scoping',
        hasManifest && allWebRooted,
        `Manifest contains ${codeData.manifest ? codeData.manifest.length : 0} web-rooted files`
      );
    } catch (e) {
      LunoTestRunner.assert('Outbox Bundler: Scoping', false, e.message);
    }

    return {
      total: LunoTestRunner.results.length,
      passed: LunoTestRunner.results.filter(r => r.success).length,
      failed: LunoTestRunner.results.filter(r => !r.success).length,
      details: LunoTestRunner.results
    };
  }

  static async mountUI(container) {
    if (!container || typeof document === 'undefined') return;
    container.innerHTML = '';
    const m = (tag, attrs, ...children) => {
      const el = document.createElement(tag);
      if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
      children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    };

    const card = m('div', {
      style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '10px', padding: '1rem', color: '#c9d1d9', fontFamily: 'monospace', maxWidth: '680px', margin: '1rem auto' }
    },
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno 3.6.2 Diagnostic Test Runner'),
      m('button', {
        style: { padding: '0.65rem 1.2rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', marginBottom: '1rem' },
        onclick: async () => {
          await LunoTestRunner.runTestSuite();
          LunoTestRunner.mountUI(container);
        }
      }, '▶ Run Diagnostic Test Suite'),
      m('div', { id: 'test-results-list', style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
        ...LunoTestRunner.results.map(r => m('div', {
          style: { background: '#0d1117', border: '1px solid ' + (r.success ? '#238636' : '#da3633'), borderRadius: '6px', padding: '0.6rem', fontSize: '0.8rem', color: r.success ? '#7ee787' : '#ff7b72' }
        }, (r.success ? '✅ ' : '❌ ') + r.title + (r.detail ? ` - ${r.detail}` : '')))
      )
    );

    container.appendChild(card);
    await LunoTestRunner.runTestSuite();
  }
}

globalThis.LunoTestRunner = LunoTestRunner;
if (typeof module !== "undefined" && module.exports) module.exports = LunoTestRunner;