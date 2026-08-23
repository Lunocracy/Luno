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
    console.log('🧪 Starting Luno 3.6 HTML Container Protocol & Multi-Project Test Suite...');

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    // Test 1: ES6 Class Body AST Method Replacement & Insertion
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

    // Test 2: Manifest Decision Engine Routing
    try {
      if (typeof LunoManifestDecisionEngine !== 'undefined') {
        const isClientFile = LunoManifestDecisionEngine.isStartupClientFile('app/ClientApp.js', {});
        const isServerFile = !LunoManifestDecisionEngine.isStartupClientFile('core/LunoServer.js', {});
        LunoTestRunner.assert('LunoManifestDecisionEngine: Client vs Server File Routing', isClientFile && isServerFile, 'App files routed to patch log; core server files routed to direct disk write');
      } else {
        LunoTestRunner.assert('LunoManifestDecisionEngine: Client vs Server File Routing', false, 'LunoManifestDecisionEngine unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoManifestDecisionEngine: Client vs Server File Routing', false, e.message);
    }

    // Test 3: Telemetry Logger Event Recording
    try {
      if (typeof LunoPlaybackLogger !== 'undefined') {
        const entry = LunoPlaybackLogger.patch('Test Event', 'Unit Test Assertion');
        const hasEntry = LunoPlaybackLogger.logs.some(l => l.title === 'Test Event');
        LunoTestRunner.assert('LunoPlaybackLogger: Telemetry Event Store', hasEntry, `Recorded event ID: ${entry.id}`);
      } else {
        LunoTestRunner.assert('LunoPlaybackLogger: Telemetry Event Store', false, 'LunoPlaybackLogger unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoPlaybackLogger: Telemetry Event Store', false, e.message);
    }

    // Test 4: LunoPayloadParser Ingestion & Fence Stripping
    try {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parse === 'function') {
        const closeScript = '</' + 'script>';
        const closeSvg = '</' + 'svg>';
        const htmlPayload = [
          '```script',
          '<' + 'script data-file="app/ClientApp.js" data-method="ClientApp.saveCode" data-action="patch">',
          'saveCode() { return true; }',
          closeScript,
          '<' + 'script data-action="run-server">',
          'console.log("server script");',
          closeScript,
          '<' + 'script type="application/luno-request" data-kind="METHOD" data-file="app/ClientApp.js" data-method="ClientApp.init">',
          closeScript,
          '<' + 'svg data-file="assets/test_logo.svg">',
          '<path d="M0 0h10v10H0z"/>',
          closeSvg,
          '```'
        ].join('\n');

        const parsed = LunoPayloadParser.parse(htmlPayload);
        const isFourFilesOrReqs = parsed.files.length === 2 && Boolean(parsed.serverScript) && parsed.requests.length === 1;
        const isSurgical = parsed.files[0] && parsed.files[0].action === 'patch' && parsed.files[0].methodSpec === 'ClientApp.saveCode';

        LunoTestRunner.assert(
          'LunoPayloadParser: HTML Container & Fence Stripping',
          isFourFilesOrReqs && isSurgical,
          `Parsed HTML blocks: ${parsed.files.length} files, ${parsed.requests.length} requests`
        );
      } else {
        LunoTestRunner.assert('LunoPayloadParser: HTML Container & Fence Stripping', false, 'LunoPayloadParser unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoPayloadParser: HTML Container & Fence Stripping', false, e.message);
    }

    // Test 5: Outbox Queue Smart Bundle Modal Method
    try {
      const hasModalMethod = typeof OutboxQueue !== 'undefined' && typeof OutboxQueue.promptBundleOptionsModal === 'function';
      LunoTestRunner.assert('OutboxQueue: Smart Bundle Modal Method Attached', hasModalMethod, 'OutboxQueue preserves satellite modal methods');
    } catch (e) {
      LunoTestRunner.assert('OutboxQueue: Smart Bundle Modal Method Attached', false, e.message);
    }

    // Test 6: API Fetcher Module Verification
    try {
      const hasApiClient = typeof LunoApiClient !== 'undefined' && typeof LunoApiClient.fetchFsList === 'function';
      LunoTestRunner.assert('LunoApiClient: API Fetcher Available', hasApiClient, 'DiskBrowser & Templates fetcher active');
    } catch (e) {
      LunoTestRunner.assert('LunoApiClient: API Fetcher Available', false, e.message);
    }

    // Test 7: Multi-Project Target Resolution & Save Isolation
    try {
      if (typeof LunoApiClient !== 'undefined') {
        const testProjName = 'test_project_isolation';
        const testFileRel = 'test_file.txt';
        const testContent = 'Isolation Proof ' + Date.now();
        
        // Save to test_project_isolation
        const saveRes = await LunoApiClient.savePayload({
          files: [{ filePath: testFileRel, action: 'direct', content: testContent }]
        }, testProjName);
        
        // Read back from test_project_isolation
        const readB = await LunoApiClient.fetchFsRead(testFileRel, testProjName);
        const isBWritten = readB && readB.content === testContent;
        
        LunoTestRunner.assert(
          'Multi-Project: Target Save Isolation',
          Boolean(saveRes && saveRes.success && isBWritten),
          `Saved & verified write in project [${testProjName}]`
        );
      } else {
        LunoTestRunner.assert('Multi-Project: Target Save Isolation', false, 'LunoApiClient unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('Multi-Project: Target Save Isolation', false, e.message);
    }

    // Test 8: Multi-Project Outbox Codebase Scoping (/api/all-code?project=...)
    try {
      if (typeof LunoApiClient !== 'undefined') {
        const testProjName = 'test_project_isolation';
        const codeRes = await LunoApiClient.fetchAllCode(testProjName);
        const hasManifest = Boolean(codeRes && codeRes.success && Array.isArray(codeRes.manifest));
        const containsTestFile = hasManifest && codeRes.manifest.includes('test_file.txt');
        LunoTestRunner.assert(
          'Multi-Project: Outbox Codebase Scoping',
          hasManifest && containsTestFile,
          `Fetched codebase for [${testProjName}], manifest contains ${codeRes.manifest ? codeRes.manifest.length : 0} file(s)`
        );
      } else {
        LunoTestRunner.assert('Multi-Project: Outbox Codebase Scoping', false, 'LunoApiClient unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('Multi-Project: Outbox Codebase Scoping', false, e.message);
    }

    // Test 9: Multi-Project Manifest Decision Engine Base Read Scoping
    try {
      if (typeof LunoManifestDecisionEngine !== 'undefined') {
        const testProjName = 'test_project_isolation';
        const samplePayload = {
          files: [{
            filePath: 'sample_patch.js',
            action: 'patch',
            methodSpec: 'SampleClass.foo',
            content: 'foo() { return "bar"; }'
          }]
        };
        const processed = await LunoManifestDecisionEngine.processPayload(samplePayload, {}, testProjName);
        const hasProcessed = processed && processed.files && processed.files.length === 1;
        LunoTestRunner.assert(
          'Multi-Project: Manifest AST Base Read Scoping',
          hasProcessed,
          `Processed AST patch against target [${testProjName}]`
        );
      } else {
        LunoTestRunner.assert('Multi-Project: Manifest AST Base Read Scoping', false, 'LunoManifestDecisionEngine unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('Multi-Project: Manifest AST Base Read Scoping', false, e.message);
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
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno 3.6 Diagnostic Test Runner'),
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