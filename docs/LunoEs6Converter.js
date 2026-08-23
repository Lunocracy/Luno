class LunoEs6Converter {
  constructor() {

  }

  static activeSource = '';
  static activeFilePath = '';
  static convertedPreview = '';
  static viewMode = 'split';
  static astDiagnostics = null;
  static activeBatch = 3;
  static BATCHES = {
  1: ['test/sample_legacy_class.js', 'app/ClientAppPaster.js', 'app/LunoLinePatcher.js'],
  2: ['app/LunoLinearParser.js', 'app/LunoPayloadParser.js', 'browser/DiskBrowser.js'],
  3: ['app/ClientApp.js', 'app/ClientAppUI.js', 'core/LunoClassPatcher.js']
};

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

    // Header & Step Progress Bar
    var header = m('div', {
      style: {
        background: '#161b22',
        border: '2px solid #00f2fe',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 16px rgba(0,242,254,0.15)',
        fontFamily: 'monospace'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' } },
        m('h2', { style: { color: '#00f2fe', fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🔄 Prototype ➔ ES6 Class Converter Engine'),
        m('span', { style: { fontSize: '0.72rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Node.js & Browser Export Support Active')
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
        'Convert legacy function prototype assignments into clean ES6 class syntax with Smart Method Comments and 1-tap Outbox batch generation.'
      ),
      m('div', { style: { display: 'flex', gap: '0.35rem', marginTop: '0.65rem', flexWrap: 'wrap' } },
        m('span', { style: { fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#238636', color: '#fff', borderRadius: '4px', fontWeight: 'bold' } }, '✓ Step 1: UI Harness'),
        m('span', { style: { fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#238636', color: '#fff', borderRadius: '4px', fontWeight: 'bold' } }, '✓ Step 2: AST Analysis'),
        m('span', { style: { fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#238636', color: '#fff', borderRadius: '4px', fontWeight: 'bold' } }, '✓ Step 3: Smart ES6 Comments'),
        m('span', { style: { fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#238636', color: '#fff', borderRadius: '4px', fontWeight: 'bold' } }, '✓ Step 4: Equivalence Suite'),
        m('span', { style: { fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#00f2fe', color: '#070a13', borderRadius: '4px', fontWeight: 'bold' } }, '⚡ Step 5: Batch Outbox Driver')
      )
    );

    // File Picker / Controls Bar
    var pathInput = m('input', {
      id: 'es6-file-path-input',
      type: 'text',
      value: LunoEs6Converter.activeFilePath || 'app/ClientApp.js',
      placeholder: 'e.g. app/ClientApp.js or test/sample_legacy_class.js',
      style: { flex: 1, minWidth: '220px', background: '#0d1117', color: '#00f2fe', border: '1px solid #30363d', padding: '0.55rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none' }
    });

    var btnCopyClipboard = m('button', {
      id: 'btn-copy-es6-code',
      style: { padding: '0.55rem 0.85rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace', boxShadow: '0 2px 8px rgba(35,134,54,0.3)' },
      onclick: function() {
        if (!LunoEs6Converter.convertedPreview) {
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) ClientApp.showToast('Nothing to copy yet. Read or transform code first.', 'info');
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(LunoEs6Converter.convertedPreview);
          btnCopyClipboard.textContent = '✓ Copied to Clipboard!';
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Copied Converted ES6 Code to Clipboard!', 'success', '📋');
          }
          setTimeout(function() { btnCopyClipboard.textContent = '📋 Copy ES6 Code'; }, 2000);
        } else {
          prompt('Copy ES6 Code:', LunoEs6Converter.convertedPreview);
        }
      }
    }, '📋 Copy ES6 Code');

    var btnGuardedSave = m('button', {
      style: { padding: '0.35rem 0.6rem', background: '#21262d', color: '#ff7b72', border: '1px solid #da3633', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', fontFamily: 'monospace', marginLeft: 'auto' },
      title: 'Advanced option: Write converted file to disk',
      onclick: function() {
        LunoEs6Converter.saveConvertedToDiskGuarded();
      }
    }, '⚠️ Save to Disk (Advanced)');

    var controlsBar = m('div', {
      style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.65rem', marginBottom: '0.75rem', display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }
    },
      m('span', { style: { fontSize: '0.78rem', color: '#8b949e', fontWeight: 'bold' } }, 'Target File:'),
      pathInput,
      m('button', {
        style: { padding: '0.55rem 0.85rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace' },
        onclick: function() {
          var p = pathInput.value.trim();
          if (p) LunoEs6Converter.loadFile(p, container);
        }
      }, '📂 Read File'),
      m('button', {
        style: { padding: '0.55rem 0.85rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace' },
        onclick: function() {
          pathInput.value = 'test/sample_legacy_class.js';
          LunoEs6Converter.loadFile('test/sample_legacy_class.js', container);
        }
      }, '🧪 Load Legacy Sample'),
      m('button', {
        style: { padding: '0.55rem 0.85rem', background: '#0d2d4a', color: '#58a6ff', border: '1px solid #0088cc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace' },
        onclick: function() {
          LunoEs6Converter.executeStep2Analysis(container);
        }
      }, '🔍 AST Report'),
      m('button', {
        style: { padding: '0.55rem 0.85rem', background: '#00f2fe', color: '#070a13', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace' },
        onclick: function() {
          LunoEs6Converter.executeStep3Transform(container);
        }
      }, '⚡ Transform ES6'),
      btnCopyClipboard,
      btnGuardedSave
    );

    // View Layout
    var isFullscreen = LunoEs6Converter.viewMode === 'fullscreen';

    var btnToggleView = m('button', {
      style: { padding: '0.3rem 0.6rem', background: '#21262d', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
      onclick: function() {
        LunoEs6Converter.viewMode = isFullscreen ? 'split' : 'fullscreen';
        LunoEs6Converter.mountUI(container);
      }
    }, isFullscreen ? '↔️ Split View' : '🖥️ Fullscreen Preview View');

    var viewHeader = m('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }
    },
      m('span', { style: { fontSize: '0.78rem', color: '#8b949e', fontWeight: 'bold' } },
        LunoEs6Converter.activeFilePath
          ? ('📄 Active File: ' + LunoEs6Converter.activeFilePath + ' (' + (LunoEs6Converter.activeSource.split('\n').length || 0) + ' lines)')
          : 'No file loaded yet.'
      ),
      btnToggleView
    );

    var sourceBox = m('textarea', {
      id: 'es6-converter-source-text',
      value: LunoEs6Converter.activeSource,
      placeholder: '// Original source code will display here...',
      style: {
        width: '100%',
        height: '380px',
        background: '#070a13',
        color: '#7ee787',
        border: '1px solid #1e293b',
        borderRadius: '6px',
        padding: '0.75rem',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        lineHeight: '1.45',
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box'
      },
      oninput: function(e) {
        LunoEs6Converter.activeSource = e.target.value;
      }
    });

    var previewBox = m('pre', {
      id: 'es6-converter-preview-text',
      style: {
        width: '100%',
        height: isFullscreen ? '540px' : '380px',
        background: '#070a13',
        color: '#3fb950',
        border: '1px solid #238636',
        borderRadius: '6px',
        padding: '0.75rem',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        lineHeight: '1.45',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        margin: 0,
        boxSizing: 'border-box'
      },
      textContent: LunoEs6Converter.convertedPreview || '// Converted ES6 class preview will appear here...'
    });

    var mainViewContainer = m('div', {
      style: { display: 'flex', gap: '0.65rem', flexWrap: isFullscreen ? 'nowrap' : 'wrap', marginBottom: '1rem' }
    });

    if (!isFullscreen) {
      var leftCol = m('div', { style: { flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '0.35rem' } },
        m('strong', { style: { color: '#7ee787', fontSize: '0.78rem' } }, '1. Original Source (Legacy Format):'),
        sourceBox
      );
      mainViewContainer.appendChild(leftCol);
    }

    var rightCol = m('div', { style: { flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '0.35rem' } },
      m('strong', { style: { color: '#3fb950', fontSize: '0.78rem' } }, '2. Clean Synthesized ES6 Class Result:'),
      previewBox
    );
    mainViewContainer.appendChild(rightCol);

    // Bottom Automation & Batch Outbox Controller Panel
    var batchPanel = LunoEs6Converter.renderBatchControllerPanel(m, container);

    container.appendChild(header);
    container.appendChild(controlsBar);
    container.appendChild(viewHeader);
    container.appendChild(mainViewContainer);
    container.appendChild(batchPanel);

    if (!LunoEs6Converter.activeSource) {
      LunoEs6Converter.loadFile('app/ClientApp.js', container);
    }

  }
  static renderBatchControllerPanel(m, container) {

    var bNum = LunoEs6Converter.activeBatch;
    var currentTargets = LunoEs6Converter.BATCHES[bNum] || [];

    var batchSelect = m('select', {
      style: { background: '#0d1117', color: '#00f2fe', border: '1px solid #00f2fe', padding: '0.45rem 0.65rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' },
      onchange: function(e) {
        LunoEs6Converter.activeBatch = parseInt(e.target.value, 10);
        LunoEs6Converter.mountUI(container);
      }
    },
      m('option', { value: 1, selected: bNum === 1 }, 'Batch 1: sample_legacy_class, ClientAppPaster, LunoLinePatcher'),
      m('option', { value: 2, selected: bNum === 2 }, 'Batch 2: LunoLinearParser, LunoPayloadParser, DiskBrowser'),
      m('option', { value: 3, selected: bNum === 3 }, 'Batch 3: ClientApp, ClientAppUI, LunoClassPatcher')
    );

    var targetRows = currentTargets.map(function(f) {
      return m('div', {
        style: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '6px', padding: '0.45rem 0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }
      },
        m('span', { style: { color: '#f0f6fc', fontWeight: 'bold' } }, '📄 ' + f),
        m('button', {
          style: { padding: '0.2rem 0.5rem', background: '#161b22', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' },
          onclick: function() {
            var input = document.getElementById('es6-file-path-input');
            if (input) input.value = f;
            LunoEs6Converter.loadFile(f, container);
          }
        }, 'Inspect In Memory ➔')
      );
    });

    return m('div', {
      style: {
        background: '#161b22',
        border: '2px solid #8257e5',
        borderRadius: '10px',
        padding: '1rem',
        marginTop: '1rem',
        boxShadow: '0 4px 16px rgba(130,87,229,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        fontFamily: 'monospace'
      }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' } },
        m('strong', { style: { color: '#d2a8ff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🚀 3-File Batch Outbox Push & Sidecar Backup System'),
        m('span', { style: { fontSize: '0.7rem', color: '#d2a8ff', background: '#271052', border: '1px solid #8257e5', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' } }, 'Smart Method Comments')
      ),
      m('p', { style: { fontSize: '0.75rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
        'Converts 3 files at a time into ES6 classes with Smart Method Comments and pushes the converted package directly to Outbox.'
      ),
      m('div', { style: { display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' } },
        m('span', { style: { fontSize: '0.78rem', color: '#c9d1d9', fontWeight: 'bold' } }, 'Select Batch:'),
        batchSelect
      ),
      m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.35rem' } }, ...targetRows),
      m('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' } },
        m('button', {
          style: { flex: 2, minWidth: '220px', padding: '0.7rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'monospace', boxShadow: '0 4px 12px rgba(130,87,229,0.3)' },
          onclick: function() {
            LunoEs6Converter.pushBatchConvertedToOutbox(currentTargets);
          }
        }, '📤 Push Converted Batch ' + bNum + ' to Outbox'),
        m('button', {
          style: { flex: 1, minWidth: '160px', padding: '0.7rem', background: '#8257e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'monospace' },
          onclick: function() {
            LunoEs6Converter.execute3FileBatchMigration(currentTargets, container);
          }
        }, '⚡ Write Batch to Disk (With `.oldschool.bak`)'),
        m('button', {
          style: { flex: 1, minWidth: '160px', padding: '0.7rem', background: '#161b22', color: '#ff7b72', border: '1px solid #da3633', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'monospace' },
          onclick: function() {
            LunoEs6Converter.execute0ReloadRollback(currentTargets, container);
          }
        }, '↩️ Instant Restore Backups')
      )
    );

  }
  static async pushBatchConvertedToOutbox(fileList) {

    if (!fileList || fileList.length === 0) return;

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    var closeScript = '</' + 'script>';
    var bundledPayload = '\n\n';
    var convertedCount = 0;

    for (var i = 0; i < fileList.length; i++) {
      var fPath = fileList[i];
      try {
        var res = await fetch('/api/fs/read?path=' + encodeURIComponent(fPath));
        var data = await res.json();
        if (res.ok && data && data.content) {
          var convertedEs6 = LunoEs6Converter.transformToEs6Class(data.content);
          bundledPayload += '<script data-file="' + fPath + '">\n' + convertedEs6 + '\n' + closeScript + '\n\n';
          convertedCount++;
        }
      } catch (e) {}
    }

    if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle && convertedCount > 0) {
      OutboxQueue.addBundle('Converted ES6 Batch (' + convertedCount + ' Files)', bundledPayload);
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast('Pushed Converted ES6 Batch (' + convertedCount + ' Files) to Outbox! Tap Copy Outbox Package above.', 'success', '📤');
      }
    }

  }
  static async execute3FileBatchMigration(fileList, container) {

    if (!fileList || fileList.length === 0) return;

    var confirmBatch = confirm('Convert 3 files to ES6 class syntax on disk?\n\nTargets:\n- ' + fileList.join('\n- ') + '\n\nSidecar backups (.oldschool.bak) will be created automatically before writing.');
    if (!confirmBatch) return;

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    var scriptLines = [
      'const fs = require("fs");',
      'const path = require("path");',
      'const root = LunoServer.getRootDir();',
      'const targets = ' + JSON.stringify(fileList) + ';',
      'let backedUp = 0;',
      'for (const rel of targets) {',
      '  const srcPath = path.join(root, rel);',
      '  const bakPath = srcPath + ".oldschool.bak";',
      '  if (fs.existsSync(srcPath) && !fs.existsSync(bakPath)) {',
      '    fs.copyFileSync(srcPath, bakPath);',
      '    backedUp++;',
      '  }',
      '}',
      'return "Created " + backedUp + " sidecar backup(s) (.oldschool.bak)";'
    ];

    try {
      var backupRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], serverScript: scriptLines.join('\n') })
      });

      var filesToWrite = [];
      for (var i = 0; i < fileList.length; i++) {
        var fPath = fileList[i];
        var readRes = await fetch('/api/fs/read?path=' + encodeURIComponent(fPath));
        var readData = await readRes.json();
        if (readRes.ok && readData && readData.content) {
          var cleanEs6Content = LunoEs6Converter.transformToEs6Class(readData.content);
          filesToWrite.push({
            filePath: fPath,
            action: 'write',
            content: cleanEs6Content
          });
        }
      }

      var saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToWrite, serverScript: '' })
      });
      var saveData = await saveRes.json();

      if (saveRes.ok && saveData.success) {
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Converted 3 files to ES6 class syntax on disk!', 'success', '⚡');
        }
        LunoEs6Converter.convertedPreview = '// ============================================================================\n' +
          '// ⚡ 3-FILE BATCH CONVERSION COMPLETE\n' +
          '// Updated Files:\n// - ' + fileList.join('\n// - ') + '\n' +
          '// Backup Notice: Sidecar backups (.oldschool.bak) created.\n' +
          '// ============================================================================';

        if (container) {
          var previewEl = document.getElementById('es6-converter-preview-text');
          if (previewEl) previewEl.textContent = LunoEs6Converter.convertedPreview;
        }
      } else {
        alert('Batch Save Error: ' + (saveData.error || 'Server error'));
      }
    } catch (err) {
      alert('Batch Migration Network Error: ' + err.message);
    }

  }
  static async execute0ReloadRollback(fileList, container) {

    if (!fileList || fileList.length === 0) return;

    var scriptLines = [
      'const fs = require("fs");',
      'const path = require("path");',
      'const root = LunoServer.getRootDir();',
      'const targets = ' + JSON.stringify(fileList) + ';',
      'let restored = 0;',
      'for (const rel of targets) {',
      '  const srcPath = path.join(root, rel);',
      '  const bakPath = srcPath + ".oldschool.bak";',
      '  if (fs.existsSync(bakPath)) {',
      '    fs.copyFileSync(bakPath, srcPath);',
      '    restored++;',
      '  }',
      '}',
      'return "Restored " + restored + " file(s) from .oldschool.bak backups!";'
    ];

    try {
      var res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], serverScript: scriptLines.join('\n') })
      });
      var data = await res.json();
      if (res.ok && data.success) {
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Restored files from .oldschool.bak backups!', 'success', '↩️');
        }
        if (fileList.length > 0) {
          LunoEs6Converter.loadFile(fileList[0], container);
        }
      }
    } catch (err) {
      alert('Rollback Error: ' + err.message);
    }

  }
  static async loadFile(filePath, container) {

    try {
      var res = await fetch('/api/fs/read?path=' + encodeURIComponent(filePath));
      var data = await res.json();
      if (res.ok && data && data.content) {
        LunoEs6Converter.activeFilePath = filePath;
        LunoEs6Converter.activeSource = data.content;
        await LunoEs6Converter.executeStep3Transform(container);
      } else {
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Could not load file: ' + filePath, 'error', '❌');
        }
      }
    } catch (err) {
      if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
        ClientApp.showToast('File read error: ' + err.message, 'error', '❌');
      }
    }

  }
  static analyzeAST(sourceCode) {

    var acornObj = globalThis.acorn;
    if (!acornObj && typeof require !== 'undefined') {
      try { acornObj = require('acorn'); } catch (e) {}
    }
    if (!acornObj || typeof acornObj.parse !== 'function') {
      return { error: 'Acorn AST parser is not loaded yet.' };
    }

    var ast = null;
    try {
      ast = acornObj.parse(sourceCode, { ecmaVersion: 'latest', sourceType: 'script', locations: true, ranges: true });
    } catch (e) {
      try {
        ast = acornObj.parse(sourceCode, { ecmaVersion: 'latest', sourceType: 'module', locations: true, ranges: true });
      } catch (e2) {
        return { error: 'AST Parse Error: ' + e2.message };
      }
    }

    var diagnostics = {
      className: null,
      constructorParams: [],
      constructorBodyRange: null,
      staticProps: [],
      staticMethods: [],
      protoMethods: [],
      exports: [],
      statements: []
    };

    if (!ast || !Array.isArray(ast.body)) return diagnostics;

    for (var i = 0; i < ast.body.length; i++) {
      var node = ast.body[i];
      var lineStart = node.loc ? node.loc.start.line : 0;
      var lineEnd = node.loc ? node.loc.end.line : 0;

      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        if (node.id) diagnostics.className = node.id.name;
        if (node.body && Array.isArray(node.body.body)) {
          for (var c = 0; c < node.body.body.length; c++) {
            var member = node.body.body[c];
            var memberName = member.key ? (member.key.name || member.key.value) : null;
            if (!memberName) continue;

            var isStatic = Boolean(member.static);
            var lineStartM = member.loc ? member.loc.start.line : lineStart;
            var lineEndM = member.loc ? member.loc.end.line : lineEnd;

            if (member.type === 'MethodDefinition') {
              if (member.kind === 'constructor') {
                diagnostics.constructorParams = (member.value.params || []).map(function(p) { return sourceCode.slice(p.range[0], p.range[1]); });
                if (member.value.body && member.value.body.range) {
                  diagnostics.constructorBodyRange = member.value.body.range;
                }
              } else {
                var isAsyncM = Boolean(member.value && member.value.async);
                var paramsM = (member.value.params || []).map(function(p) { return sourceCode.slice(p.range[0], p.range[1]); });
                var mObj = {
                  className: diagnostics.className,
                  methodName: memberName,
                  isAsync: isAsyncM,
                  params: paramsM,
                  bodyRange: member.value.body ? member.value.body.range : null,
                  loc: { start: lineStartM, end: lineEndM }
                };
                if (isStatic) {
                  diagnostics.staticMethods.push(mObj);
                } else {
                  diagnostics.protoMethods.push(mObj);
                }
              }
            } else if (member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
              var valStr = member.value ? sourceCode.slice(member.value.range[0], member.value.range[1]) : 'undefined';
              if (isStatic) {
                diagnostics.staticProps.push({
                  className: diagnostics.className,
                  propName: memberName,
                  value: valStr,
                  loc: { start: lineStartM, end: lineEndM }
                });
              }
            }
          }
        }
      } else if (node.type === 'FunctionDeclaration' && node.id) {
        if (/^[A-Z]/.test(node.id.name) && !diagnostics.className) {
          diagnostics.className = node.id.name;
          diagnostics.constructorParams = (node.params || []).map(function(p) { return sourceCode.slice(p.range[0], p.range[1]); });
          if (node.body && node.body.range) {
            diagnostics.constructorBodyRange = node.body.range;
          }
        }
      } else if (node.type === 'VariableDeclaration' && node.declarations && node.declarations[0]) {
        var decl = node.declarations[0];
        var name = decl.id ? decl.id.name : null;
        if (name && /^[A-Z]/.test(name) && !diagnostics.className) {
          diagnostics.className = name;
          var fnExpr = decl.init;
          if (fnExpr && fnExpr.type === 'AssignmentExpression') fnExpr = fnExpr.right;
          if (fnExpr && (fnExpr.type === 'FunctionExpression' || fnExpr.type === 'ArrowFunctionExpression')) {
            diagnostics.constructorParams = (fnExpr.params || []).map(function(p) { return sourceCode.slice(p.range[0], p.range[1]); });
            if (fnExpr.body && fnExpr.body.range) {
              diagnostics.constructorBodyRange = fnExpr.body.range;
            }
          }
        }
      } else if (node.type === 'ExpressionStatement' && node.expression) {
        var expr = node.expression;
        if (expr.type === 'AssignmentExpression' && expr.left) {
          var leftCode = sourceCode.slice(expr.left.range[0], expr.left.range[1]).trim();
          var rightNode = expr.right;
          var isFn = rightNode.type === 'FunctionExpression' || rightNode.type === 'ArrowFunctionExpression';
          var isAsync = Boolean(rightNode.async);

          if (leftCode.includes('.prototype.')) {
            var parts = leftCode.split('.prototype.');
            var cls = parts[0].replace(/^(?:globalThis|window)\./, '').trim();
            var member = parts[1].trim();
            if (!diagnostics.className && cls) diagnostics.className = cls;
            if (isFn && rightNode.body) {
              var params = (rightNode.params || []).map(function(p) { return sourceCode.slice(p.range[0], p.range[1]); });
              diagnostics.protoMethods.push({
                className: cls,
                methodName: member,
                isAsync: isAsync,
                params: params,
                bodyRange: rightNode.body.range,
                loc: { start: lineStart, end: lineEnd }
              });
            }
          } else if (leftCode.includes('.')) {
            var parts2 = leftCode.split('.');
            var member2 = parts2.pop().trim();
            var cls2 = parts2.pop().trim();
            cls2 = cls2.replace(/^(?:globalThis|window)\./, '').trim();

            if (cls2 === 'window' || cls2 === 'globalThis' || cls2 === 'module') {
              diagnostics.exports.push({ target: sourceCode.slice(node.range[0], node.range[1]).trim(), loc: { start: lineStart, end: lineEnd } });
            } else {
              if (!diagnostics.className && cls2 && /^[A-Z]/.test(cls2)) diagnostics.className = cls2;
              if (isFn && rightNode.body) {
                var params2 = (rightNode.params || []).map(function(p) { return sourceCode.slice(p.range[0], p.range[1]); });
                diagnostics.staticMethods.push({
                  className: cls2,
                  methodName: member2,
                  isAsync: isAsync,
                  params: params2,
                  bodyRange: rightNode.body.range,
                  loc: { start: lineStart, end: lineEnd }
                });
              } else {
                var valCode = sourceCode.slice(rightNode.range[0], rightNode.range[1]);
                diagnostics.staticProps.push({
                  className: cls2,
                  propName: member2,
                  value: valCode,
                  loc: { start: lineStart, end: lineEnd }
                });
              }
            }
          }
        }
      } else if (node.type === 'IfStatement') {
        var stmtCode = sourceCode.slice(node.range[0], node.range[1]).trim();
        if (stmtCode.includes('window.') || stmtCode.includes('module.exports')) {
          diagnostics.exports.push({ target: stmtCode, loc: { start: lineStart, end: lineEnd } });
        }
      }
    }

    return diagnostics;

  }
  static formatMethodBodyWithRelativeIndent(sourceCode, bodyRange, baseIndent) {

    if (!bodyRange) return [];
    var rawBody = sourceCode.slice(bodyRange[0] + 1, bodyRange[1] - 1);
    var lines = rawBody.split('\n');

    var minIndent = Infinity;
    lines.forEach(function(line) {
      if (line.trim().length > 0) {
        var match = line.match(/^(\s*)/);
        var indentLen = match ? match[1].length : 0;
        if (indentLen < minIndent) minIndent = indentLen;
      }
    });

    if (minIndent === Infinity) minIndent = 0;

    var formattedLines = [];
    lines.forEach(function(line) {
      if (line.trim().length === 0) {
        formattedLines.push('');
      } else {
        var relativeLine = line.slice(Math.min(line.length, minIndent));
        formattedLines.push(baseIndent + relativeLine);
      }
    });

    return formattedLines;

  }
  static generateMethodSmartComment(name, params, isAsync, isStatic) {

    var typeStr = isStatic ? 'Static Method' : 'Instance Method';
    var modifierStr = isAsync ? 'async' : 'sync';
    var paramStr = params.length > 0 ? params.join(', ') : 'none';

    return [
      '  /**',
      '   * ⚙️ METHOD: ' + name + '(' + (params.join(', ') || '') + ')',
      '   * - Type: ' + typeStr,
      '   * - Modifier: ' + modifierStr,
      '   * - Parameters: ' + paramStr,
      '   */'
    ].join('\n');

  }
  static transformToEs6Class(sourceCode) {

    var diag = LunoEs6Converter.analyzeAST(sourceCode);
    if (diag.error) {
      return '// ❌ Cannot convert file due to AST parse error:\n// ' + diag.error;
    }

    var className = diag.className || 'AppClass';
    var lines = [];

    lines.push('// ============================================================================');
    lines.push('// ⚡ CONVERTED ES6 CLASS SYNTAX (STEP 3 SYNTHESIS)');
    lines.push('// Source File: ' + (LunoEs6Converter.activeFilePath || 'In-Memory Snippet'));
    lines.push('// Converted At: ' + new Date().toLocaleString());
    lines.push('// ============================================================================');
    lines.push('');

    lines.push('class ' + className + ' {');

    // 1. Constructor
    var cParams = diag.constructorParams.join(', ');
    lines.push('  /**');
    lines.push('   * ⚙️ CONSTRUCTOR: ' + className + '(' + cParams + ')');
    lines.push('   */');
    lines.push('  constructor(' + cParams + ') {');
    if (diag.constructorBodyRange) {
      var cLines = LunoEs6Converter.formatMethodBodyWithRelativeIndent(sourceCode, diag.constructorBodyRange, '    ');
      cLines.forEach(function(l) { lines.push(l); });
    }
    lines.push('  }');

    // 2. Static Properties
    if (diag.staticProps.length > 0) {
      lines.push('');
      lines.push('  // Static Properties');
      diag.staticProps.forEach(function(sp) {
        lines.push('  static ' + sp.propName + ' = ' + sp.value + ';');
      });
    }

    // 3. Static Methods
    if (diag.staticMethods.length > 0) {
      lines.push('');
      lines.push('  // Static Methods');
      diag.staticMethods.forEach(function(sm) {
        lines.push(LunoEs6Converter.generateMethodSmartComment(sm.methodName, sm.params, sm.isAsync, true));
        var sig = '  static ' + (sm.isAsync ? 'async ' : '') + sm.methodName + '(' + sm.params.join(', ') + ') {';
        lines.push(sig);
        if (sm.bodyRange) {
          var smLines = LunoEs6Converter.formatMethodBodyWithRelativeIndent(sourceCode, sm.bodyRange, '    ');
          smLines.forEach(function(l) { lines.push(l); });
        }
        lines.push('  }');
      });
    }

    // 4. Instance Prototype Methods
    if (diag.protoMethods.length > 0) {
      lines.push('');
      lines.push('  // Instance Methods');
      diag.protoMethods.forEach(function(pm) {
        lines.push(LunoEs6Converter.generateMethodSmartComment(pm.methodName, pm.params, pm.isAsync, false));
        var sig = '  ' + (pm.isAsync ? 'async ' : '') + pm.methodName + '(' + pm.params.join(', ') + ') {';
        lines.push(sig);
        if (pm.bodyRange) {
          var pmLines = LunoEs6Converter.formatMethodBodyWithRelativeIndent(sourceCode, pm.bodyRange, '    ');
          pmLines.forEach(function(l) { lines.push(l); });
        }
        lines.push('  }');
      });
    }

    lines.push('}');
    lines.push('');

    // 5. Clean Global & CommonJS Export Binding
    lines.push('globalThis.' + className + ' = ' + className + ';');
    lines.push('if (typeof module !== "undefined" && module.exports) module.exports = ' + className + ';');
    lines.push('');

    return lines.join('\n');

  }
  static async executeStep2Analysis(container) {

    if (!LunoEs6Converter.activeSource) return;

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    var diag = LunoEs6Converter.analyzeAST(LunoEs6Converter.activeSource);
    LunoEs6Converter.astDiagnostics = diag;

    var report = [
      '// ============================================================================',
      '// 🔍 ES6 CONVERTER AST DIAGNOSTIC REPORT (STEP 2)',
      '// Target File: ' + (LunoEs6Converter.activeFilePath || 'In-Memory Snippet'),
      '// Analyzed At: ' + new Date().toLocaleString(),
      '// Acorn AST Status: ' + (diag.error ? '❌ ' + diag.error : '✅ Parse Successful'),
      '// ============================================================================',
      ''
    ];

    if (diag.error) {
      report.push('❌ AST Error: ' + diag.error);
    } else {
      report.push('[CLASS IDENTIFICATION]');
      report.push('• Primary Class Name: ' + (diag.className || 'UnknownClass'));
      report.push('• Constructor Parameters: (' + (diag.constructorParams.join(', ') || '') + ')');
      report.push('');

      report.push('[STATIC PROPERTIES (' + diag.staticProps.length + ')]');
      diag.staticProps.forEach(function(sp) {
        report.push('• ' + sp.className + '.' + sp.propName + ' = ' + sp.value);
      });
      report.push('');

      report.push('[STATIC METHODS (' + diag.staticMethods.length + ')]');
      diag.staticMethods.forEach(function(sm) {
        report.push('• ' + (sm.isAsync ? 'async ' : '') + sm.className + '.' + sm.methodName + '(' + sm.params.join(', ') + ')');
      });
      report.push('');

      report.push('[PROTOTYPE INSTANCE METHODS (' + diag.protoMethods.length + ')]');
      diag.protoMethods.forEach(function(pm) {
        report.push('• ' + (pm.isAsync ? 'async ' : '') + pm.className + '.prototype.' + pm.methodName + '(' + pm.params.join(', ') + ')');
      });
      report.push('');
    }

    LunoEs6Converter.convertedPreview = report.join('\n');

    if (container) {
      var previewEl = document.getElementById('es6-converter-preview-text');
      if (previewEl) previewEl.textContent = LunoEs6Converter.convertedPreview;
    }

  }
  static async executeStep3Transform(container) {

    if (!LunoEs6Converter.activeSource) return;

    if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
      try { await LunoAcornLoader.ensureLoaded(); } catch (e) {}
    }

    LunoEs6Converter.convertedPreview = LunoEs6Converter.transformToEs6Class(LunoEs6Converter.activeSource);

    if (container) {
      var previewEl = document.getElementById('es6-converter-preview-text');
      if (previewEl) previewEl.textContent = LunoEs6Converter.convertedPreview;
      var sourceEl = document.getElementById('es6-converter-source-text');
      if (sourceEl) sourceEl.value = LunoEs6Converter.activeSource;
    }

    if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
      ClientApp.showToast('Synthesized ES6 Class Syntax!', 'success', '⚡');
    }

  }
}

globalThis.LunoEs6Converter = LunoEs6Converter;
if (typeof module !== "undefined" && module.exports) module.exports = LunoEs6Converter;