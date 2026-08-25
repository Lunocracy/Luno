class LunoClassPatcher {
  constructor() {}

  static parseAST(sourceText) {
    if (!sourceText || typeof sourceText !== 'string' || !sourceText.trim()) {
      throw new Error('[Luno AST Guard] parseAST received empty source text.');
    }

    var acornObj = (typeof window !== 'undefined' && window.acorn) || (typeof globalThis !== 'undefined' && globalThis.acorn);
    if (!acornObj && typeof require !== 'undefined') {
      try { acornObj = require('acorn'); } catch (e) {}
    }

    if (!acornObj || typeof acornObj.parse !== 'function') {
      throw new Error('[Luno AST Guard] Acorn AST parser is not loaded in memory.');
    }

    try {
      return acornObj.parse(sourceText, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowHashBang: true,
        ranges: true
      });
    } catch (e) {
      try {
        return acornObj.parse(sourceText, {
          ecmaVersion: 'latest',
          sourceType: 'script',
          allowReturnOutsideFunction: true,
          allowImportExportEverywhere: true,
          allowHashBang: true,
          ranges: true
        });
      } catch (e2) {
        throw new Error('[Luno AST Guard] Acorn failed to parse source AST: ' + e2.message);
      }
    }
  }

  static parseSpec(targetSpec) {
    if (!targetSpec || typeof targetSpec !== 'string' || !targetSpec.trim()) {
      throw new Error('[Luno AST Guard] Cannot parse targetSpec: targetSpec is empty.');
    }
    var clean = targetSpec.trim();
    if (clean.includes('@')) clean = clean.split('@').pop().trim();
    clean = clean.replace(/^(?:globalThis|window)\./, '');

    var className = '';
    var memberName = '';
    var isStatic = false;

    if (clean.includes('.prototype.')) {
      var parts = clean.split('.prototype.');
      className = parts[0].trim();
      memberName = parts[1].trim();
      isStatic = false;
    } else if (clean.includes('.')) {
      var parts2 = clean.split('.');
      memberName = parts2.pop().trim();
      className = parts2.join('.').trim();
      isStatic = true;
    } else {
      memberName = clean;
    }

    if (!memberName) {
      throw new Error('[Luno AST Guard] Invalid targetSpec "' + targetSpec + '": Could not extract member name.');
    }

    return { className: className, memberName: memberName, isStatic: isStatic };
  }

  /**
   * ⚙️ METHOD: normalizeMethodCode(memberName, methodCode, isStatic)
   * Robust header parsing that never corrupts method signatures with body parenthesis.
   */
  static normalizeMethodCode(memberName, methodCode, isStatic) {
    if (!methodCode || typeof methodCode !== 'string' || !methodCode.trim()) {
      throw new Error('[Luno AST Guard] Cannot normalize method code: methodCode is empty for "' + memberName + '".');
    }
    var clean = methodCode.trim();
    if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

    // If it's a property assignment like: ClassName.member = function(...) { ... }
    if (clean.includes('=')) {
      var equalsIdx = clean.indexOf('=');
      var leftPart = clean.slice(0, equalsIdx).trim();
      if (leftPart.includes('.prototype.') || leftPart.includes('.')) {
        clean = clean.slice(equalsIdx + 1).trim();
        if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();
      }
    }

    // If it starts with `function` or `async function`
    if (/^(?:async\s+)?function\s*\(/.test(clean)) {
      var isAsyncFn = clean.startsWith('async ');
      var fnKeywordIdx = clean.indexOf('function');
      var rest = clean.slice(fnKeywordIdx + 8).trim();
      return (isStatic ? 'static ' : '') + (isAsyncFn ? 'async ' : '') + memberName + rest;
    }

    // Match method header: [static] [async] methodName(...)
    var headerMatch = clean.match(/^(?:(static)\s+)?(?:(async)\s+)?([A-Za-z0-9_$]+)\s*\(/);
    if (headerMatch) {
      var hasStatic = Boolean(headerMatch[1]) || Boolean(isStatic);
      var hasAsync = Boolean(headerMatch[2]) || clean.includes('await ');
      var matchedName = headerMatch[3];

      // Strip existing leading static / async
      var body = clean.replace(/^(?:static\s+)?(?:async\s+)?/, '');

      if (matchedName !== memberName) {
        body = memberName + body.slice(matchedName.length);
      }

      var prefix = (hasStatic ? 'static ' : '') + (hasAsync ? 'async ' : '');
      return prefix + body;
    }

    return (isStatic ? 'static ' : '') + memberName + '() ' + clean;
  }

  static patchMethodInSource(existingSource, targetSpec, methodCode) {
    if (!existingSource || typeof existingSource !== 'string' || !existingSource.trim()) {
      throw new Error('[Luno AST Guard] Cannot patch method: existingSource is empty.');
    }

    var parsed = LunoClassPatcher.parseSpec(targetSpec);
    var className = parsed.className;
    var memberName = parsed.memberName;
    var isStatic = parsed.isStatic;
    var cleanMethod = LunoClassPatcher.normalizeMethodCode(memberName, methodCode, isStatic);

    var ast = LunoClassPatcher.parseAST(existingSource);

    var targetClassNode = null;
    var foundClasses = [];

    var walk = function(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        var clsName = node.id ? node.id.name : null;
        if (clsName) foundClasses.push(clsName);
        if (!className || clsName === className) {
          targetClassNode = node;
          return;
        }
      }
      for (var k in node) {
        if (k === 'parent') continue;
        var child = node[k];
        if (Array.isArray(child)) {
          for (var i = 0; i < child.length; i++) {
            if (child[i] && typeof child[i].type === 'string') walk(child[i]);
          }
        } else if (child && typeof child.type === 'string') {
          walk(child);
        }
      }
    };
    walk(ast);

    if (!targetClassNode) {
      throw new Error('[Luno AST Guard] Target class "' + (className || 'target') + '" not found in source AST. Available classes: [' + foundClasses.join(', ') + '].');
    }

    if (!targetClassNode.body || !Array.isArray(targetClassNode.body.body) || !targetClassNode.body.range) {
      throw new Error('[Luno AST Guard] Target class "' + className + '" has an invalid class body in AST.');
    }

    var classBody = targetClassNode.body;
    var existingMethodNode = null;

    for (var i = 0; i < classBody.body.length; i++) {
      var member = classBody.body[i];
      if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition') {
        var keyName = member.key ? (member.key.name || member.key.value) : null;
        if (keyName === memberName) {
          existingMethodNode = member;
          break;
        }
      }
    }

    // Replace existing method node
    if (existingMethodNode && existingMethodNode.range) {
      var startIdx = existingMethodNode.range[0];
      var endIdx = existingMethodNode.range[1];
      var indentedMethod = '  ' + cleanMethod.split('\n').join('\n  ');
      return existingSource.slice(0, startIdx) + indentedMethod + existingSource.slice(endIdx);
    }

    // Insert new method strictly before the closing class bracket
    var closeBraceIdx = classBody.range[1] - 1;
    var indentedNewMethod = '\n  ' + cleanMethod.split('\n').join('\n  ') + '\n';
    return existingSource.slice(0, closeBraceIdx) + indentedNewMethod + existingSource.slice(closeBraceIdx);
  }
}

if (typeof window !== 'undefined') window.LunoClassPatcher = LunoClassPatcher;
globalThis.LunoClassPatcher = LunoClassPatcher;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoClassPatcher;