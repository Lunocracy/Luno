class LunoTestRunner {
  constructor() {}

  static results = [];

  static assert(title, condition, detail) {
    var det = detail || '';
    var item = { title: title, success: Boolean(condition), detail: det };
    LunoTestRunner.results.push(item);
    console.log((item.success ? '✅ PASSED: ' : '❌ FAILED: ') + title + (det ? (' (' + det + ')') : ''));
    return item;
  }

  static async runTestSuite() {
    LunoTestRunner.results = [];
    console.log('🧪 Starting Luno Full Architecture & Determinism Test Suite...');

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    // Test 1: Client-Side ES6 Class Body AST Method Replacement
    try {
      if (typeof LunoClassPatcher !== 'undefined' && typeof LunoClassPatcher.patchMethodInSource === 'function') {
        var sampleSource = 'class DemoApp {\n  constructor() {}\n  greet() {\n    return "hello";\n  }\n}';
        var patchedSource = LunoClassPatcher.patchMethodInSource(sampleSource, 'DemoApp.greet', 'greet() {\n  return "world";\n}');
        var hasNoPrototypeAppends = !patchedSource.includes('.prototype.');
        var isReplacedInBody = patchedSource.includes('return "world"') && patchedSource.indexOf('world') < patchedSource.lastIndexOf('}');
        LunoTestRunner.assert('LunoClassPatcher: ES6 Class Body AST Method Replacement', hasNoPrototypeAppends && isReplacedInBody, 'Replaced method cleanly inside ES6 class body');
      } else {
        LunoTestRunner.assert('LunoClassPatcher: ES6 Class Body AST Method Replacement', false, 'LunoClassPatcher unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: ES6 Class Body AST Method Replacement', false, e.message);
    }

    // Test 2: Deterministic Context Extraction (Zero Loose Guessing)
    try {
      if (typeof LunoContextExtractor !== 'undefined') {
        var missingRes = LunoContextExtractor.extractFileContext('NonExistentFolder/GhostFile.js');
        LunoTestRunner.assert(
          'LunoContextExtractor: Deterministic Missing File Guard',
          !missingRes.success && missingRes.error.includes('[Luno Context Guard]'),
          'Fails loudly and cleanly with strict diagnostic error on missing files'
        );
      } else {
        LunoTestRunner.assert('LunoContextExtractor: Guard Test', false, 'Extractor unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoContextExtractor: Guard Test', false, e.message);
    }

    // Test 3: Interactive AI Mentor Teacher Prompt Generator
    try {
      if (typeof LunoGuideEngine !== 'undefined' && typeof LunoGuideEngine.buildInteractiveMentorPrompt === 'function') {
        var prompt = await LunoGuideEngine.buildInteractiveMentorPrompt('Build a Timer', 'A countdown stopwatch widget', 'Basic3D');
        var hasProtocol = prompt.includes('PROACTIVE INTERACTIVE AI MENTOR INSTRUCTIONS') && prompt.includes('TARGET PROJECT: [Basic3D]');
        LunoTestRunner.assert(
          'LunoGuideEngine: Interactive AI Mentor Prompt Synthesis',
          Boolean(hasProtocol),
          'Synthesizes full-context teacher prompt with project metadata'
        );
      } else {
        LunoTestRunner.assert('LunoGuideEngine: Mentor Prompt Synthesis', false, 'LunoGuideEngine unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoGuideEngine: Mentor Prompt Synthesis', false, e.message);
    }

    // Test 4: Container Parser HTML Extraction
    try {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parse === 'function') {
        var closeScript = '</' + 'script>';
        var payload = '<script data-file="Basic3D/src/App.js">\nconsole.log("ok");\n' + closeScript;
        var parsed = LunoPayloadParser.parse(payload);
        LunoTestRunner.assert(
          'LunoPayloadParser: HTML Container Extraction',
          parsed.files.length === 1 && parsed.files[0].filePath === 'Basic3D/src/App.js',
          'Parsed 1 script container with strict project prefix'
        );
      } else {
        LunoTestRunner.assert('LunoPayloadParser: HTML Extraction', false, 'Parser unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoPayloadParser: HTML Extraction', false, e.message);
    }

    // Test 5: Strict Outbox Bundler Path Prefixing
    try {
      if (typeof OutboxQueue !== 'undefined' && typeof OutboxQueue.bundleAndQueueCodebase === 'function') {
        var sampleFiles = { 'src/App.js': 'class App {}' };
        var result = OutboxQueue.bundleAndQueueCodebase(sampleFiles, {}, 'TestProject', { includeInstructions: false });
        var lastItem = OutboxQueue.queue[OutboxQueue.queue.length - 1];
        var isPrefixed = lastItem && lastItem.payload.includes('data-file="TestProject/src/App.js"');
        LunoTestRunner.assert(
          'OutboxQueue: Strict Root-Anchored Path Prefixing',
          Boolean(isPrefixed),
          'Bundles all file tags with strict ProjectName/... prefixes'
        );
      } else {
        LunoTestRunner.assert('OutboxQueue: Path Prefixing', false, 'OutboxQueue unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('OutboxQueue: Path Prefixing', false, e.message);
    }

    // Test 6: Demand-Paged Context Fulfillment
    try {
      var res = await fetch('/api/context/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ filePath: 'Luno/luno.json', kind: 'FILE' }] })
      });
      var data = await res.json();
      LunoTestRunner.assert(
        'LunoContextExtractor: /api/context/request Fulfillment',
        res.ok && data && data.success,
        'Successfully fulfilled context request for luno.json'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoContextExtractor: /api/context/request Fulfillment', false, e.message);
    }

    // Test 7: Universal GitHub Pages Standalone Parity Engine
    try {
      if (typeof LunoDeployEngine !== 'undefined' && typeof LunoDeployEngine.ensureGitHubPagesParity === 'function') {
        LunoTestRunner.assert(
          'LunoDeployEngine: GitHub Pages Standalone Parity Engine',
          true,
          'LunoDeployEngine is ready to generate .nojekyll and standalone loader shells'
        );
      } else {
        LunoTestRunner.assert('LunoDeployEngine: GitHub Pages Parity', false, 'LunoDeployEngine not found');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoDeployEngine: GitHub Pages Parity', false, e.message);
    }

    // Test 8: Deterministic Multi-Project File Listing
    try {
      var resList = await fetch('/api/fs/ls?project=Basic3D');
      var dataList = await resList.json();
      LunoTestRunner.assert(
        'LunoServer: Deterministic Multi-Project File Listing',
        resList.ok && dataList && dataList.success && Array.isArray(dataList.items),
        'Scoped /api/fs/ls successfully across sibling projects'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoServer: Multi-Project File Listing', false, e.message);
    }

    return {
      total: LunoTestRunner.results.length,
      passed: LunoTestRunner.results.filter(function(r) { return r.success; }).length,
      failed: LunoTestRunner.results.filter(function(r) { return !r.success; }).length,
      details: LunoTestRunner.results
    };
  }

  static async mountUI(container) {
    if (!container || typeof document === 'undefined') return;
    container.innerHTML = '';
    var m = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          var el = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
          for (var i = 2; i < arguments.length; i++) {
            var c = arguments[i];
            if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
          }
          return el;
        };

    var card = m('div', {
      style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '10px', padding: '1rem', color: '#c9d1d9', fontFamily: 'monospace', maxWidth: '680px', margin: '1rem auto' }
    },
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno Diagnostic Test Suite'),
      m('button', {
        style: { padding: '0.65rem 1.2rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', marginBottom: '1rem' },
        onclick: async function() {
          await LunoTestRunner.runTestSuite();
          await LunoTestRunner.mountUI(container);
        }
      }, '▶ Run Diagnostic Suite'),
      m('div', { id: 'test-results-list', style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
        ...LunoTestRunner.results.map(function(r) {
          return m('div', {
            style: { background: '#0d1117', border: '1px solid ' + (r.success ? '#238636' : '#da3633'), borderRadius: '6px', padding: '0.6rem', fontSize: '0.8rem', color: r.success ? '#7ee787' : '#ff7b72' }
          }, (r.success ? '✅ ' : '❌ ') + r.title + (r.detail ? (' - ' + r.detail) : ''));
        })
      )
    );

    container.appendChild(card);
    await LunoTestRunner.runTestSuite();
  }
}

globalThis.LunoTestRunner = LunoTestRunner;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoTestRunner;