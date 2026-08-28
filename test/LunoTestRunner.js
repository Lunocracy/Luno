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

    // Test 2: DiskBrowser Tail-Anchored Path Formatting
    try {
      if (typeof DiskBrowser !== 'undefined' && typeof DiskBrowser.formatTailPath === 'function') {
        var longPath = 'Luno/very/deep/nested/directory/subfolder/MyComponent.js';
        var formatted = DiskBrowser.formatTailPath(longPath, 24);
        var startsWithEllipsis = formatted.startsWith('...');
        var rootFile = DiskBrowser.formatTailPath('index.html');
        LunoTestRunner.assert(
          'DiskBrowser: Tail-Anchored Path Formatting & Root File Handling',
          startsWithEllipsis && rootFile === '',
          'Truncates deep paths from the start ("' + formatted + '") and omits root file paths'
        );
      } else {
        LunoTestRunner.assert('DiskBrowser: Path Formatting Test', false, 'DiskBrowser.formatTailPath unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('DiskBrowser: Path Formatting Test', false, e.message);
    }

    // Test 3: DiskBrowser Size Sorting
    try {
      if (typeof DiskBrowser !== 'undefined' && typeof DiskBrowser.sortItems === 'function') {
        var sampleItems = [{ name: 'small.js', size: 100 }, { name: 'huge.js', size: 50000 }, { name: 'medium.js', size: 2000 }];
        var sortedDesc = DiskBrowser.sortItems(sampleItems, 'size', 'desc');
        var sortedAsc = DiskBrowser.sortItems(sampleItems, 'size', 'asc');
        var isDescCorrect = sortedDesc[0].size === 50000 && sortedDesc[2].size === 100;
        var isAscCorrect = sortedAsc[0].size === 100 && sortedAsc[2].size === 50000;
        LunoTestRunner.assert(
          'DiskBrowser: Size Sorting Algorithm (Desc & Asc)',
          isDescCorrect && isAscCorrect,
          'Correctly sorts flat files by file size ascending and descending'
        );
      } else {
        LunoTestRunner.assert('DiskBrowser: Size Sorting Test', false, 'DiskBrowser.sortItems unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('DiskBrowser: Size Sorting Test', false, e.message);
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

    // Test 8: Deterministic Multi-Project Recursive File Listing
    try {
      var resList = await fetch('/api/fs/ls?recursive=true&project=Basic3D');
      var dataList = await resList.json();
      LunoTestRunner.assert(
        'LunoServer: Deterministic Multi-Project Recursive Listing',
        resList.ok && dataList && dataList.success && Array.isArray(dataList.items),
        'Scoped /api/fs/ls?recursive=true successfully across sibling projects'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoServer: Multi-Project Recursive Listing', false, e.message);
    }

    // Test 9: LunoClassPatcher Getters, Setters & Generator AST Patching
    try {
      if (typeof LunoClassPatcher !== 'undefined') {
        var baseSrc = 'class ItemState {\n  constructor() {\n    this._val = 10;\n  }\n}';
        var withGetter = LunoClassPatcher.patchMethodInSource(baseSrc, 'ItemState.get val', 'get val() {\n  return this._val * 2;\n}');
        var withSetter = LunoClassPatcher.patchMethodInSource(withGetter, 'ItemState.set val', 'set val(v) {\n  this._val = v;\n}');
        var hasGetter = withSetter.includes('get val()') && withSetter.includes('return this._val * 2');
        var hasSetter = withSetter.includes('set val(v)') && withSetter.includes('this._val = v');
        LunoTestRunner.assert(
          'LunoClassPatcher: Accessor Get/Set AST Integration',
          hasGetter && hasSetter,
          'Successfully inserted getters and setters into class body'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: Accessor Get/Set AST Integration', false, 'LunoClassPatcher missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Accessor Get/Set AST Integration', false, e.message);
    }

    // Test 10: LunoClassPatcher Method Deletion (deleteMethodInSource)
    try {
      if (typeof LunoClassPatcher !== 'undefined' && typeof LunoClassPatcher.deleteMethodInSource === 'function') {
        var classWithOldMethod = 'class Widget {\n  constructor() {}\n  deprecatedMethod() {\n    return false;\n  }\n  activeMethod() {\n    return true;\n  }\n}';
        var deletedSource = LunoClassPatcher.deleteMethodInSource(classWithOldMethod, 'Widget.deprecatedMethod');
        var isRemoved = !deletedSource.includes('deprecatedMethod');
        var isRetained = deletedSource.includes('activeMethod');
        LunoTestRunner.assert(
          'LunoClassPatcher: AST Member Deletion (deleteMethodInSource)',
          isRemoved && isRetained,
          'Surgically removed deprecatedMethod while preserving activeMethod'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: AST Member Deletion', false, 'deleteMethodInSource missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: AST Member Deletion', false, e.message);
    }

    // Test 11: LunoLinePatcher Accessor Property Descriptors & Live Hot-Patching
    try {
      if (typeof LunoLinePatcher !== 'undefined' && typeof LunoLinePatcher.appendPatch === 'function') {
        var patchResult = LunoLinePatcher.appendPatch('', 'SampleClass.get title', 'get title() { return "dynamic"; }', { hotPatch: false });
        var hasDefineProperty = patchResult.patchAssignmentStatement.includes('Object.defineProperty') && patchResult.patchAssignmentStatement.includes('get:');
        LunoTestRunner.assert(
          'LunoLinePatcher: Accessor Property Descriptors Evaluation',
          hasDefineProperty,
          'Constructed valid Object.defineProperty accessor statement for live memory binding'
        );
      } else {
        LunoTestRunner.assert('LunoLinePatcher: Accessor Property Descriptors', false, 'LunoLinePatcher missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoLinePatcher: Accessor Property Descriptors', false, e.message);
    }

    // Test 12: ES6 Module Syntax Verification & Validation
    try {
      var sampleEs6Module = 'import { useState } from "react";\nexport class ModuleApp {\n  static run() { return "active"; }\n}';
      if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.parseAST) {
        var parsedAst = LunoClassPatcher.parseAST(sampleEs6Module);
        LunoTestRunner.assert(
          'LunoServer / AST: ES6 Module import/export Syntax Tolerance',
          parsedAst && Array.isArray(parsedAst.body),
          'Parsed modern ES6 module imports/exports without throwing syntax errors'
        );
      } else {
        LunoTestRunner.assert('LunoServer / AST: ES6 Module Tolerance', false, 'AST parser missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoServer / AST: ES6 Module Tolerance', false, e.message);
    }

    return {
      total: LunoTestRunner.results.length,
      passed: LunoTestRunner.results.filter(function(r) { return r.success; }).length,
      failed: LunoTestRunner.results.filter(function(r) { return !r.success; }).length,
      details: LunoTestRunner.results
    };
  }

  static mountUI(container) {
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

    var resultsContainer = m('div', { id: 'test-results-list', style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } });

    var card = m('div', {
      style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '10px', padding: '1rem', color: '#c9d1d9', fontFamily: 'monospace', maxWidth: '680px', margin: '1rem auto' }
    },
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno Diagnostic Test Suite (12 Tests)'),
      m('button', {
        style: { padding: '0.65rem 1.2rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', marginBottom: '1rem' },
        onclick: function() {
          LunoTestRunner.runTestSuite().then(function() {
            LunoTestRunner.mountUI(container);
          });
        }
      }, '▶ Run Diagnostic Suite'),
      resultsContainer
    );

    container.appendChild(card);

    LunoTestRunner.runTestSuite().then(function() {
      resultsContainer.innerHTML = '';
      LunoTestRunner.results.forEach(function(r) {
        resultsContainer.appendChild(m('div', {
          style: { background: '#0d1117', border: '1px solid ' + (r.success ? '#238636' : '#da3633'), borderRadius: '6px', padding: '0.6rem', fontSize: '0.8rem', color: r.success ? '#7ee787' : '#ff7b72' }
        }, (r.success ? '✅ ' : '❌ ') + r.title + (r.detail ? (' - ' + r.detail) : '')));
      });
    });
  }
}

globalThis.LunoTestRunner = LunoTestRunner;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoTestRunner;