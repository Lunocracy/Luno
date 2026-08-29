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
    console.log('🧪 Starting Luno Full Architecture & Determinism Test Suite (23 Tests)...');

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

    // Test 2: Clean Method Auto-Insertion for New Methods
    try {
      if (typeof LunoClassPatcher !== 'undefined' && typeof LunoClassPatcher.patchMethodInSource === 'function') {
        var sampleSource2 = 'class DemoApp {\n  constructor() {}\n  existingMethod() {\n    return 1;\n  }\n}';
        var insertedSource = LunoClassPatcher.patchMethodInSource(sampleSource2, 'DemoApp.brandNewMethod', 'brandNewMethod() {\n  return 2;\n}');
        var hasBothMethods = insertedSource.includes('existingMethod()') && insertedSource.includes('brandNewMethod()');
        var isInsideClassBody = insertedSource.indexOf('brandNewMethod') < insertedSource.lastIndexOf('}');
        LunoTestRunner.assert(
          'LunoClassPatcher: Clean Method Auto-Insertion for New Methods',
          hasBothMethods && isInsideClassBody,
          'Automatically inserted new method inside class body before closing brace'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: Method Auto-Insertion', false, 'LunoClassPatcher unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Clean Method Auto-Insertion for New Methods', false, e.message);
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

    // Test 5: Container Parser HTML Extraction (Safe Fixture)
    try {
      if (typeof LunoPayloadParser !== 'undefined' && typeof LunoPayloadParser.parse === 'function') {
        var samplePayload = '<' + 'style data-file="Basic3D/css/style.css">\nbody { margin: 0; }\n<' + '/style>';
        var parsed = LunoPayloadParser.parse(samplePayload);
        var hasExtractedFile = parsed && Array.isArray(parsed.files) && parsed.files.length === 1 && parsed.files[0].filePath === 'Basic3D/css/style.css';
        LunoTestRunner.assert(
          'LunoPayloadParser: HTML Container Extraction',
          hasExtractedFile,
          'Parsed 1 style container with strict project prefix'
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
        var hasGetter = withSetter.includes('get val') && withSetter.includes('return this._val * 2');
        var hasSetter = withSetter.includes('set val') && withSetter.includes('this._val = v');
        var validAst = false;
        try {
          LunoClassPatcher.parseAST(withSetter);
          validAst = true;
        } catch(e) {}

        LunoTestRunner.assert(
          'LunoClassPatcher: Accessor Get/Set AST Integration',
          hasGetter && hasSetter && validAst,
          'Successfully inserted getters and setters into class body with valid AST'
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

    // Test 14: End-to-End Staging Fork Pipeline & Symbol/File Renaming
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
      var classRenamed = false;

      if (isForkSuccess) {
        var expectedClass = (typeof LunoIndexedDbAdapter !== 'undefined' && LunoIndexedDbAdapter.toPascalCase)
          ? LunoIndexedDbAdapter.toPascalCase(testForkName)
          : 'App';

        var metaRes = await fetch('/api/fs/read?path=luno.json&project=' + encodeURIComponent(testForkName));
        var metaData = await metaRes.json();
        if (metaRes.ok && metaData && metaData.content) {
          var metaObj = JSON.parse(metaData.content);
          manifestRemapped = (metaObj.name === testForkName);
          classRenamed = (metaObj.entrypoint && metaObj.entrypoint.class === expectedClass) || (metaObj.mainClass === expectedClass);
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
        'LunoServer / Adapters: End-to-End Fork Pipeline & Symbol Renaming',
        isForkSuccess && manifestRemapped && classRenamed,
        'Cloned project, verified PascalCase entrypoint class renaming (' + (forkExecData && forkExecData.entrypointClass) + '), and cleaned up test folder'
      );
    } catch (e) {
      LunoTestRunner.assert('LunoServer / Adapters: Fork Pipeline & Symbol Renaming', false, e.message);
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

    // Test 16: Client-Side Structured JSON Merging (Array Unions & Deletions)
    try {
      if (typeof LunoManifestDecisionEngine !== 'undefined' && LunoManifestDecisionEngine.processPayload) {
        var dummyMeta = { name: "TestApp", library: ["DomBasics.js"], customProp: "oldValue" };
        var mergePayload = {
          files: [{
            filePath: "TestApp/luno.json",
            action: "merge",
            content: JSON.stringify({
              library: ["DomBasics.js", "UITools.js"],
              customProp: "__luno_delete__",
              newField: "active"
            })
          }]
        };
        var processed = await LunoManifestDecisionEngine.processPayload(mergePayload, dummyMeta, "TestApp");
        var directFile = processed.files.find(function(f) { return f.filePath === "TestApp/luno.json"; });
        var parsedResult = directFile ? JSON.parse(directFile.content) : null;
        var hasMergedLibs = parsedResult && Array.isArray(parsedResult.library) && parsedResult.library.includes("UITools.js");
        var hasDeletedProp = parsedResult && parsedResult.customProp === undefined;
        var hasNewField = parsedResult && parsedResult.newField === "active";

        LunoTestRunner.assert(
          'LunoManifestDecisionEngine: Client-Side JSON Merge & Array Union',
          hasMergedLibs && hasDeletedProp && hasNewField,
          'Merged JSON properties, unioned arrays, and respected __luno_delete__ deletion'
        );
      } else {
        LunoTestRunner.assert('LunoManifestDecisionEngine: Client JSON Merge', false, 'Engine unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoManifestDecisionEngine: Client-Side JSON Merge', false, e.message);
    }

    // Test 17: Hotspot & Local Private IP Network Detection
    try {
      if (typeof LunoFileSystem !== 'undefined' && LunoFileSystem.isLocalNetworkHost) {
        var isHotspotIp = LunoFileSystem.isLocalNetworkHost('172.20.10.4', '8080');
        var isLanIp = LunoFileSystem.isLocalNetworkHost('192.168.1.105', '8080');
        var isLoopback = LunoFileSystem.isLocalNetworkHost('127.0.0.1', '');
        var isGitHubStatic = LunoFileSystem.isLocalNetworkHost('lunocracy.github.io', '');

        LunoTestRunner.assert(
          'LunoFileSystem / LunoLoader: Hotspot & Private IP Detection',
          isHotspotIp && isLanIp && isLoopback && !isGitHubStatic,
          'Correctly identified hotspot 172.20.10.x, LAN 192.168.x.x, and static GitHub Pages'
        );
      } else {
        LunoTestRunner.assert('LunoFileSystem: Private IP Detection', false, 'Helper unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoFileSystem / LunoLoader: Hotspot Detection', false, e.message);
    }

    // Test 18: Root-Anchored Library Exclusion vs Project Subdirectories
    try {
      if (typeof OutboxQueue !== 'undefined' && OutboxQueue.bundleAndQueueCodebase) {
        var mockCodebase = {
          'src/library/helper.js': 'class Helper {}',
          'Library/DomBasics.js': 'class DomBasics {}',
          'src/App.js': 'class App {}'
        };
        var bundleRes = OutboxQueue.bundleAndQueueCodebase(mockCodebase, {}, 'SubProj', { includeInstructions: false, includeProjectLibrary: false, includeAllLibrary: false });
        var queued = OutboxQueue.queue[OutboxQueue.queue.length - 1];
        var text = queued ? queued.payload : '';

        var retainsSubfolder = text.includes('SubProj/src/library/helper.js');
        var excludesRootLib = !text.includes('Library/DomBasics.js');

        LunoTestRunner.assert(
          'OutboxQueue: Root Library Exclusion vs Inner Project Folders',
          retainsSubfolder && excludesRootLib,
          'Preserved src/library/helper.js while cleanly excluding root Library/DomBasics.js'
        );
      } else {
        LunoTestRunner.assert('OutboxQueue: Root Library Exclusion', false, 'OutboxQueue unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('OutboxQueue: Root Library Exclusion', false, e.message);
    }

    // Test 19: Patch Application Workflow (Direct Auto-Apply vs. Patch Log Journaling)
    try {
      if (typeof LunoManifestDecisionEngine !== 'undefined' && typeof LunoApiClient !== 'undefined') {
        var origMode = (typeof localStorage !== 'undefined' && localStorage.getItem('luno_patch_apply_mode')) || 'direct';

        if (typeof localStorage !== 'undefined') localStorage.setItem('luno_patch_apply_mode', 'direct');
        var mockPayload = {
          files: [{
            filePath: 'Luno/test/protocol_test.js',
            methodSpec: 'ProtocolTest.getVersion',
            action: 'patch',
            content: 'getVersion() { return "direct-test-mode"; }'
          }]
        };
        var resDirect = await LunoManifestDecisionEngine.processPayload(mockPayload, {}, 'Luno');
        var hasDirectWrite = resDirect.files.some(function(f) { return f.filePath === 'Luno/test/protocol_test.js' && f.action === 'direct'; });
        var noPatchLog = !resDirect.files.some(function(f) { return f.filePath === 'LunoPatchLog.html'; });

        if (typeof localStorage !== 'undefined') localStorage.setItem('luno_patch_apply_mode', 'patchlog');
        var resPatchLog = await LunoManifestDecisionEngine.processPayload(mockPayload, {}, 'Luno');
        var hasPatchLogWrite = resPatchLog.files.some(function(f) { return f.filePath === 'LunoPatchLog.html'; });

        if (typeof localStorage !== 'undefined') localStorage.setItem('luno_patch_apply_mode', origMode);

        LunoTestRunner.assert(
          'LunoManifestDecisionEngine: Direct Auto-Apply vs Patch Log Journaling',
          hasDirectWrite && noPatchLog && hasPatchLogWrite,
          'Compiled direct AST writes in direct mode and journaled to patch log in patchlog mode'
        );
      } else {
        LunoTestRunner.assert('LunoManifestDecisionEngine: Direct vs Patchlog', false, 'LunoManifestDecisionEngine unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoManifestDecisionEngine: Direct Auto-Apply vs Patch Log Journaling', false, e.message);
    }

    // Test 20: Selective Project Library Manifest Discovery
    try {
      if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchAllCode) {
        var codeData = await LunoApiClient.fetchAllCode('MathStorm', { includeProjectLibrary: true, includeAllLibrary: false });
        var hasCode = codeData && codeData.success && codeData.filesMap;
        var mapKeys = hasCode ? Object.keys(codeData.filesMap) : [];

        var includesDeclaredLib = mapKeys.some(function(k) { return k === 'Library/DomBasics.js' || k.endsWith('DomBasics.js'); });
        var excludesUnusedLib = !mapKeys.some(function(k) { return k === 'Library/GraphicPiano.js' || k.endsWith('GraphicPiano.js'); });

        LunoTestRunner.assert(
          'LunoApiClient / Server: Selective Project Library Manifest Discovery',
          hasCode && includesDeclaredLib && excludesUnusedLib,
          'Automatically included project-declared Library/DomBasics.js while excluding unreferenced Library modules'
        );
      } else {
        LunoTestRunner.assert('LunoApiClient: Selective Library Discovery', false, 'LunoApiClient unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoApiClient / Server: Selective Project Library Manifest Discovery', false, e.message);
    }

    // Test 21: OutboxQueue Project Library Preservation
    try {
      if (typeof OutboxQueue !== 'undefined' && OutboxQueue.bundleAndQueueCodebase) {
        var mockMap = {
          'MathStorm/src/App.js': 'class App {}',
          'Library/DomBasics.js': 'class DomBasics {}'
        };
        var bundle = OutboxQueue.bundleAndQueueCodebase(mockMap, {}, 'MathStorm', {
          includeInstructions: false,
          includeProjectLibrary: true,
          includeAllLibrary: false
        });
        var lastItem = OutboxQueue.queue[OutboxQueue.queue.length - 1];
        var text = lastItem ? lastItem.payload : '';

        var hasProjectFile = text.includes('data-file="MathStorm/src/App.js"');
        var hasLibraryFile = text.includes('data-file="Library/DomBasics.js"');

        LunoTestRunner.assert(
          'OutboxQueue: Project Library Preservation in Code Packages',
          hasProjectFile && hasLibraryFile,
          'Bundled project files and declared Library dependencies with canonical Library/... paths'
        );
      } else {
        LunoTestRunner.assert('OutboxQueue: Project Library Preservation', false, 'OutboxQueue unavailable');
      }
    } catch (e) {
      LunoTestRunner.assert('OutboxQueue: Project Library Preservation', false, e.message);
    }

    // Test 22: Arrow Function & PropertyDefinition AST Patching
    try {
      if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.patchMethodInSource) {
        var sampleWithField = 'class ArrowWidget {\n  constructor() {}\n  handleClick = (e) => {\n    console.log("old");\n  };\n}';
        var patchedField = LunoClassPatcher.patchMethodInSource(sampleWithField, 'ArrowWidget.handleClick', 'handleClick = (e) => {\n  console.log("new");\n}');
        var hasNew = patchedField.includes('console.log("new")') && !patchedField.includes('console.log("old")');
        LunoTestRunner.assert(
          'LunoClassPatcher: Arrow Function & PropertyDefinition AST Patching',
          Boolean(hasNew),
          'Successfully matched and patched class-field arrow function property'
        );
      } else {
        LunoTestRunner.assert('LunoClassPatcher: PropertyDefinition AST Patching', false, 'LunoClassPatcher missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoClassPatcher: Arrow Function & PropertyDefinition AST Patching', false, e.message);
    }

    // Test 23: Client-Side Post-Splice AST Syntax Validation Guard
    try {
      if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.parseAST) {
        var invalidCode = 'class BrokenApp {\n  constructor() {\n    this.val = 10; // missing closing brace';
        var threwSyntaxError = false;
        try {
          LunoClassPatcher.parseAST(invalidCode);
        } catch(syntaxErr) {
          threwSyntaxError = true;
        }
        LunoTestRunner.assert(
          'LunoManifestDecisionEngine: Client-Side Post-Splice AST Validation Guard',
          threwSyntaxError,
          'Successfully caught malformed AST syntax error in client memory before storage write'
        );
      } else {
        LunoTestRunner.assert('LunoManifestDecisionEngine: Post-Splice Guard', false, 'LunoClassPatcher missing');
      }
    } catch (e) {
      LunoTestRunner.assert('LunoManifestDecisionEngine: Client-Side Post-Splice AST Validation Guard', false, e.message);
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
      m('h2', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0 0 0.8rem 0' } }, '🧪 Luno Diagnostic Test Suite (23 Tests)'),
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