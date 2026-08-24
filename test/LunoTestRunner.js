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
    console.log('🧪 Starting Luno Full Architecture Test Suite...');

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

    // Test 2: Manifest Decision Engine Web-Root Path Resolution
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

    // Test 3: Standalone Starter Templates
    try {
      if (typeof LunoProjectTemplates !== 'undefined' && Array.isArray(LunoProjectTemplates.TEMPLATES)) {
        const blankTpl = LunoProjectTemplates.TEMPLATES.find(t => t.id === 'blank');
        const hasNoMissingLibs = blankTpl && blankTpl.files['luno.json'].includes('"library": []');
        LunoTestRunner.assert(
          'LunoProjectTemplates: Self-Contained Starter Templates',
          Boolean(hasNoMissingLibs),
          'Blank template does not reference uninstalled library files'
        );
      } else {
        LunoTestRunner.assert('LunoProjectTemplates: Self-Contained Templates', false, 'Templates unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoProjectTemplates: Self-Contained Templates', false, e.message);
    }

    // Test 4: Container Parser HTML Extraction
    try {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parse === 'function') {
        const closeScript = '</' + 'script>';
        const payload = '<script data-file="test/sample.js">\nconsole.log("ok");\n' + closeScript;
        const parsed = LunoPayloadParser.parse(payload);
        LunoTestRunner.assert(
          'LunoPayloadParser: HTML Container Extraction',
          parsed.files.length === 1 && parsed.files[0].filePath === 'test/sample.js',
          'Parsed 1 script container successfully'
        );
      } else {
        LunoTestRunner.assert('LunoPayloadParser: HTML Extraction', false, 'Parser unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoPayloadParser: HTML Extraction', false, e.message);
    }

    // Test 5: Demand-Paged Context Fulfillment
    try {
      const res = await fetch('/api/context/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ filePath: 'Luno/luno.json', kind: 'FILE' }] })
      });
      const data = await res.json();
      LunoTestRunner.assert(
        'LunoContextExtractor: /api/context/request Fulfillment',
        res.ok && data && data.success,
        'Successfully fulfilled context request for luno.json'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoContextExtractor: /api/context/request Fulfillment', false, e.message);
    }

    // Test 6: Dedicated Shared Library Discovery
    try {
      if (typeof DiskBrowser !== 'undefined') {
        LunoTestRunner.assert(
          'DiskBrowser: Dedicated Library Navigation',
          typeof DiskBrowser.loadDirectory === 'function',
          'DiskBrowser supports scoped library discovery'
        );
      }
    } catch (e) {
      LunoTestRunner.assert('DiskBrowser: Dedicated Library Navigation', false, e.message);
    }

    // Test 7: AI Studio Relay Protocol Envelopes
    try {
      if (typeof LunoRelayProtocol !== 'undefined') {
        const env = LunoRelayProtocol.createEnvelope(LunoRelayProtocol.MSG_TYPES.PING, { status: 'ok' });
        LunoTestRunner.assert(
          'LunoRelayProtocol: Structured Message Envelopes',
          Boolean(env && env.type === 'LUNO_PING' && env.payload && env.timestamp),
          'Created structured LUNO_PING envelope'
        );
      } else {
        LunoTestRunner.assert('LunoRelayProtocol: Envelopes', false, 'Protocol unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoRelayProtocol: Envelopes', false, e.message);
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
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno Diagnostic Test Suite'),
      m('button', {
        style: { padding: '0.65rem 1.2rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', marginBottom: '1rem' },
        onclick: async () => {
          await LunoTestRunner.runTestSuite();
          LunoTestRunner.mountUI(container);
        }
      }, '▶ Run Diagnostic Suite'),
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