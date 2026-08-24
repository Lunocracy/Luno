class LunoEs6Converter {
  constructor() {}

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

    var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

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
        m('span', { style: { fontSize: '0.72rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Target: ' + currentTarget)
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
        'Convert legacy function prototype assignments into clean ES6 class syntax with Smart Method Comments and 1-tap Outbox batch generation.'
      )
    );

    var pathInput = m('input', {
      id: 'es6-file-path-input',
      type: 'text',
      value: LunoEs6Converter.activeFilePath || 'Luno/app/ClientApp.js',
      placeholder: 'e.g. Luno/app/ClientApp.js',
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
          btnCopyClipboard.textContent = '✓ Copied!';
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Copied Converted ES6 Code to Clipboard!', 'success', '📋');
          }
          setTimeout(function() { btnCopyClipboard.textContent = '📋 Copy ES6 Code'; }, 2000);
        } else {
          prompt('Copy ES6 Code:', LunoEs6Converter.convertedPreview);
        }
      }
    }, '📋 Copy ES6 Code');

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
      btnCopyClipboard
    );

    var isFullscreen = LunoEs6Converter.viewMode === 'fullscreen';

    var btnToggleView = m('button', {
      style: { padding: '0.3rem 0.6rem', background: '#21262d', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
      onclick: function() {
        LunoEs6Converter.viewMode = isFullscreen ? 'split' : 'fullscreen';
        LunoEs6Converter.mountUI(container);
      }
    }, isFullscreen ? '↔️ Split View' : '🖥️ Fullscreen Preview');

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

    container.appendChild(header);
    container.appendChild(controlsBar);
    container.appendChild(viewHeader);
    container.appendChild(mainViewContainer);

    if (!LunoEs6Converter.activeSource) {
      LunoEs6Converter.loadFile('Luno/app/ClientApp.js', container);
    }
  }

  static async loadFile(filePath, container) {
    try {
      var targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';
      var res = await fetch('/api/fs/read?path=' + encodeURIComponent(filePath) + '&project=' + encodeURIComponent(targetProj));
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

    lines.push('class ' + className + ' {');

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

    if (diag.staticProps.length > 0) {
      lines.push('');
      lines.push('  // Static Properties');
      diag.staticProps.forEach(function(sp) {
        lines.push('  static ' + sp.propName + ' = ' + sp.value + ';');
      });
    }

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
    lines.push('globalThis.' + className + ' = ' + className + ';');
    lines.push('if (typeof module !== "undefined" && module.exports) module.exports = ' + className + ';');

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
      '// 🔍 ES6 CONVERTER AST DIAGNOSTIC REPORT',
      '// Target File: ' + (LunoEs6Converter.activeFilePath || 'In-Memory Snippet'),
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
      diag.staticProps.forEach(sp => report.push('• ' + sp.className + '.' + sp.propName + ' = ' + sp.value));
      report.push('');
      report.push('[STATIC METHODS (' + diag.staticMethods.length + ')]');
      diag.staticMethods.forEach(sm => report.push('• ' + (sm.isAsync ? 'async ' : '') + sm.className + '.' + sm.methodName + '(' + sm.params.join(', ') + ')'));
      report.push('');
      report.push('[PROTOTYPE METHODS (' + diag.protoMethods.length + ')]');
      diag.protoMethods.forEach(pm => report.push('• ' + (pm.isAsync ? 'async ' : '') + pm.className + '.prototype.' + pm.methodName + '(' + pm.params.join(', ') + ')'));
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