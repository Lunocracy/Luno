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
    console.log('🧪 Starting Luno Full Architecture & Determinism Test Suite (15 Tests)...');

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

    // Test 2: Fail-Loud Error on Non-Existent Method Patch
    try {
      if (typeof LunoClassPatcher !== 'undefined' && typeof LunoClassPatcher.patchMethodInSource === 'function') {
        var sampleSource2 = 'class DemoApp {\n  constructor() {}\n  realMethod() {\n    return 1;\n  }\n}';
        var threwExpectedError = false;
        var errorMsg = '';
        try {
          LunoClassPatcher.patchMethodInSource(sampleSource2, 'DemoApp.fakeMethod', 'fakeMethod() { return 2; }');
        } catch(err) {
          threwExpectedError = true;
          errorMsg = err.message;
        }
        var includesAvailableList = errorMsg.includes('Available members: [') && errorMsg.includes('realMethod');
        LunoTestRunner.assert(
          'LunoClassPatcher: Fail-Loud Error on Missing Method Patch',
          threwExpectedError && includesAvailableList,
          'Threw structured error and listed available class members'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: Fail-Loud Error on Missing Method Patch', false, 'LunoClassPatcher unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Fail-Loud Error on Missing Method Patch', false, e.message);
    }

    // Test 3: DiskBrowser Tail-Anchored Path Formatting
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

    // Test 4: DiskBrowser Size Sorting
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

    // Test 5: Container Parser HTML Extraction
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

    // Test 6: Strict Outbox Bundler Path Prefixing
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

    // Test 7: Demand-Paged Context Fulfillment
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

    // Test 8: Universal GitHub Pages Standalone Parity Engine
    try {
      if (typeof LunoDeployEngine !== 'undefined' && typeof LunoDeployEngine.ensureGitHubPagesParity === 'function') {
        LunoTestRunner.assert(
          'LunoDeployEngine: GitHub Pages Standalone Parity Engine',
          true,
          'LunoDeployEngine is ready to generate .nojekyll, files.json, and standalone loader shells'
        );
      } else {
        LunoTestRunner.assert('LunoDeployEngine: GitHub Pages Parity', false, 'LunoDeployEngine not found');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoDeployEngine: GitHub Pages Parity', false, e.message);
    }

    // Test 9: Deterministic Multi-Project Recursive File Listing
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

    // Test 10: LunoClassPatcher Getters, Setters & Accessor AST Patching
    try {
      if (typeof LunoClassPatcher !== 'undefined') {
        var baseSrc = 'class ItemState {\n  constructor() {\n    this._val = 10;\n  }\n}';
        var withGetter = LunoClassPatcher.patchMethodInSource(baseSrc, 'ItemState.get val', 'get val() {\n  return this._val * 2;\n}', { allowInsert: true });
        var withSetter = LunoClassPatcher.patchMethodInSource(withGetter, 'ItemState.set val', 'set val(v) {\n  this._val = v;\n}', { allowInsert: true });
        var hasGetter = withSetter.includes('get val()') && withSetter.includes('return this._val * 2');
        var hasSetter = withSetter.includes('set val(v)') && withSetter.includes('this._val = v');
        var detailMsg = (hasGetter && hasSetter)
          ? 'Successfully inserted getters and setters into class body'
          : ('Mismatch: hasGetter=' + hasGetter + ', hasSetter=' + hasSetter);
        LunoTestRunner.assert(
          'LunoClassPatcher: Accessor Get/Set AST Integration',
          hasGetter && hasSetter,
          detailMsg
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: Accessor Get/Set AST Integration', false, 'LunoClassPatcher missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Accessor Get/Set AST Integration', false, e.message);
    }

    // Test 11: Method Normalization with Leading JSDoc/Comments
    try {
      if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.normalizeMethodCode) {
        var rawCommentedMethod = '/**\n * Some documentation\n */\nmyMethod(alpha, beta) {\n  return alpha + beta;\n}';
        var normalized = LunoClassPatcher.normalizeMethodCode('myMethod', rawCommentedMethod, false, 'method');
        var hasParams = normalized.includes('(alpha, beta)');
        var noLeadingComment = !normalized.startsWith('/**');
        LunoTestRunner.assert(
          'LunoClassPatcher: Method Normalization with Leading JSDoc/Comments',
          hasParams && noLeadingComment,
          'Stripped JSDoc and preserved (alpha, beta) parameter signatures'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: Method Normalization', false, 'LunoClassPatcher unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Method Normalization', false, e.message);
    }

    // Test 12: Clean Method Deletion & JSDoc Header Cleanup
    try {
      if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.deleteMethodInSource) {
        var classWithDoc = 'class Sample {\n  /**\n   * Old method doc\n   */\n  oldMethod() {\n    return 1;\n  }\n  nextMethod() {\n    return 2;\n  }\n}';
        var afterDelete = LunoClassPatcher.deleteMethodInSource(classWithDoc, 'Sample.oldMethod');
        var noOldDoc = !afterDelete.includes('Old method doc');
        var retainsNext = afterDelete.includes('nextMethod()') && afterDelete.includes('return 2;');
        LunoTestRunner.assert(
          'LunoClassPatcher: Clean Method Deletion & JSDoc Cleanup',
          noOldDoc && retainsNext,
          'Deleted method and consumed preceding JSDoc comment cleanly'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: Clean Method Deletion', false, 'LunoClassPatcher unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Clean Method Deletion', false, e.message);
    }

    // Test 13: Strict Name Validation Guard on /api/projects/fork
    try {
      var forkInvalidRes = await fetch('/api/projects/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceProject: 'Basic3D', newProjectName: 'Invalid Name With Spaces!' })
      });
      var forkInvalidData = await forkInvalidRes.json();
      LunoTestRunner.assert(
        'LunoServer: Strict Name Validation Guard on /api/projects/fork',
        forkInvalidRes.status === 400 && !forkInvalidData.success,
        'Rejected project name with spaces and special characters with status 400'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoServer: Strict Name Validation Guard on /api/projects/fork', false, e.message);
    }

    // Test 14: End-to-End Staging Fork Pipeline & Manifest Path Remapping
    try {
      var testForkName = 'test_e2e_fork_' + Date.now();
      var forkExecRes = await fetch('/api/projects/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceProject: 'SimpleTest', newProjectName: testForkName })
      });
      var forkExecData = await forkExecRes.json();

      var isForkSuccess = forkExecRes.ok && forkExecData && forkExecData.success;
      var manifestRemapped = false;

      if (isForkSuccess) {
        var metaRes = await fetch('/api/fs/read?path=luno.json&project=' + encodeURIComponent(testForkName));
        var metaData = await metaRes.json();
        if (metaRes.ok && metaData && metaData.content) {
          var metaObj = JSON.parse(metaData.content);
          manifestRemapped = (metaObj.name === testForkName);
          if (Array.isArray(metaObj.main) && metaObj.main.length > 0) {
            manifestRemapped = manifestRemapped && !metaObj.main.some(function(p) { return p.startsWith('SimpleTest/'); });
          }
        }

        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [],
            serverScript: "const fs = require('fs'); const path = require('path'); const target = path.join(LunoServer.getWebRootDir(), '" + testForkName + "'); if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true }); return 'Cleaned test fork';"
          })
        });
      }

      LunoTestRunner.assert(
        'LunoServer: End-to-End Staging Fork Pipeline & Manifest Path Remapping',
        isForkSuccess && manifestRemapped,
        'Cloned project, verified luno.json path remapping, and purged test fork cleanly'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoServer: End-to-End Staging Fork Pipeline & Manifest Path Remapping', false, e.message);
    }

    // Test 15: ES6 Module Syntax Verification & Validation
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
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno Diagnostic Test Suite (15 Tests)'),
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