class LunoClassPatcher {
  constructor() {}

  /**
   * ⚙️ METHOD: parseAST(sourceText)
   */
  static parseAST(sourceText) {
    if (!sourceText || typeof sourceText !== 'string' || !sourceText.trim()) {
      throw new Error('[Luno AST Guard] parseAST received empty source text.');
    }

    var acornObj = (typeof window !== 'undefined' && window.acorn) || (typeof globalThis !== 'undefined' && globalThis.acorn);
    if (!acornObj && typeof require !== 'undefined') {
      try { acornObj = require('acorn'); } catch (e) {}
      if (!acornObj) {
        try {
          var p = require('path');
          var root = (typeof LunoServer !== 'undefined' && LunoServer.getRootDir) ? LunoServer.getRootDir() : process.cwd();
          acornObj = require(p.join(root, 'node_modules', 'acorn'));
        } catch (e2) {}
      }
    }

    if (!acornObj || typeof acornObj.parse !== 'function') {
      throw new Error('[Luno AST Guard] Acorn AST parser is not loaded in memory.');
    }

    var parseOpts = {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowHashBang: true,
      ranges: true,
      locations: true
    };

    try {
      return acornObj.parse(sourceText, parseOpts);
    } catch (e) {
      try {
        parseOpts.sourceType = 'script';
        return acornObj.parse(sourceText, parseOpts);
      } catch (e2) {
        throw new Error('[Luno AST Guard] Acorn failed to parse source AST: ' + e2.message);
      }
    }
  }

  /**
   * ⚙️ METHOD: parseSpec(targetSpec)
   */
  static parseSpec(targetSpec) {
    if (!targetSpec || typeof targetSpec !== 'string' || !targetSpec.trim()) {
      throw new Error('[Luno AST Guard] Cannot parse targetSpec: targetSpec is empty.');
    }

    var clean = targetSpec.trim();
    if (clean.includes('@')) clean = clean.split('@').pop().trim();
    clean = clean.replace(/^(?:globalThis|window)\./, '');

    var kind = 'method';
    if (clean.startsWith('get ') || clean.includes('.get ')) {
      kind = 'get';
      clean = clean.replace(/\bget\s+/, '');
    } else if (clean.startsWith('set ') || clean.includes('.set ')) {
      kind = 'set';
      clean = clean.replace(/\bset\s+/, '');
    }

    var className = '';
    var memberName = '';
    var isStatic = null;

    if (clean.includes('.prototype.')) {
      var parts = clean.split('.prototype.');
      className = parts[0].trim();
      memberName = parts[1].trim();
      isStatic = false;
    } else if (clean.includes('.')) {
      var parts2 = clean.split('.');
      memberName = parts2.pop().trim();
      className = parts2.join('.').trim();
      isStatic = null;
    } else {
      memberName = clean;
      isStatic = null;
    }

    if (memberName === 'constructor') {
      isStatic = false;
      kind = 'constructor';
    }

    if (!memberName) {
      throw new Error('[Luno AST Guard] Invalid targetSpec "' + targetSpec + '": Could not extract member name.');
    }

    return { className: className, memberName: memberName, isStatic: isStatic, kind: kind };
  }

  /**
   * ⚙️ METHOD: normalizeMethodCode(memberName, methodCode, isStatic, targetKind)
   */
  static normalizeMethodCode(memberName, methodCode, isStatic, targetKind) {
    if (!methodCode || typeof methodCode !== 'string' || !methodCode.trim()) {
      throw new Error('[Luno AST Guard] Cannot normalize method code: methodCode is empty for "' + memberName + '".');
    }

    var clean = methodCode.trim();
    if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

    if (clean.includes('=')) {
      var equalsIdx = clean.indexOf('=');
      var leftPart = clean.slice(0, equalsIdx).trim();
      if (leftPart.includes('.prototype.') || leftPart.includes('.')) {
        clean = clean.slice(equalsIdx + 1).trim();
        if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();
      }
    }

    if (/^(?:async\s+)?function\s*\(/.test(clean)) {
      var isAsyncFn = clean.startsWith('async ');
      var fnKeywordIdx = clean.indexOf('function');
      var rest = clean.slice(fnKeywordIdx + 8).trim();
      var prefix = (isStatic === true ? 'static ' : '') + (isAsyncFn ? 'async ' : '');
      return prefix + memberName + rest;
    }

    var headerRegex = /^(?:(static)\s+)?(?:(async)\s+)?(\*)?\s*(?:(get|set)\s+)?([A-Za-z0-9_$#]+)\s*(\([\s\S]*?\))?\s*(\{[\s\S]*\})$/;
    var match = clean.match(headerRegex);

    if (match) {
      var hasStatic = Boolean(match[1]) || (isStatic === true);
      var hasAsync = Boolean(match[2]) || clean.includes('await ');
      var isGenerator = Boolean(match[3]);
      var memberKind = match[4] || targetKind || 'method';
      var params = match[6] || '()';
      var body = match[7];

      if (memberName === 'constructor') {
        return 'constructor' + params + ' ' + body;
      }

      var out = '';
      if (hasStatic) out += 'static ';
      if (hasAsync && memberKind !== 'get' && memberKind !== 'set') out += 'async ';
      if (isGenerator) out += '*';
      if (memberKind === 'get') out += 'get ';
      if (memberKind === 'set') out += 'set ';

      out += memberName + (memberKind === 'get' && params === '()' ? '() ' : params + ' ') + body;
      return out.trim();
    }

    var prefixFallback = (isStatic === true ? 'static ' : '');
    if (memberName === 'constructor') return 'constructor() ' + clean;
    return prefixFallback + memberName + '() ' + clean;
  }

  /**
   * ⚙️ METHOD: findClassNodes(ast, targetClassName)
   */
  static findClassNodes(ast, targetClassName) {
    var results = [];
    if (!ast || typeof ast !== 'object') return results;

    var walk = function(node) {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        var name = (node.id && node.id.name) ? node.id.name : null;
        var namesSet = new Set();
        if (name) namesSet.add(name);

        if (!targetClassName || namesSet.has(targetClassName)) {
          results.push({
            node: node,
            name: name,
            names: namesSet,
            bodyNode: node.body,
            range: node.range
          });
        }
      }

      for (var key in node) {
        if (key === 'parent') continue;
        var child = node[key];
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
    return results;
  }

  /**
   * ⚙️ METHOD: findMethodBounds(sourceCode, rawTarget)
   */
  static findMethodBounds(sourceCode, rawTarget) {
    if (!sourceCode || !rawTarget) return null;
    var parsed = LunoClassPatcher.parseSpec(rawTarget);
    var ast = LunoClassPatcher.parseAST(sourceCode);
    var classNodes = LunoClassPatcher.findClassNodes(ast, parsed.className);

    if (classNodes.length === 0) return null;
    var targetClass = classNodes[0];
    if (!targetClass.bodyNode || !Array.isArray(targetClass.bodyNode.body)) return null;

    for (var i = 0; i < targetClass.bodyNode.body.length; i++) {
      var member = targetClass.bodyNode.body[i];
      if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition') {
        var keyName = member.key ? (member.key.name || member.key.value) : null;
        var staticMatch = (parsed.isStatic === null) ? true : (Boolean(member.static) === Boolean(parsed.isStatic));
        if (keyName === parsed.memberName && staticMatch) {
          if (member.range) {
            return { startIdx: member.range[0], endIdx: member.range[1] };
          }
        }
      }
    }
    return null;
  }

  /**
   * ⚙️ METHOD: deleteMethodInSource(existingSource, targetSpec)
   */
  static deleteMethodInSource(existingSource, targetSpec) {
    if (!existingSource || typeof existingSource !== 'string' || !existingSource.trim()) {
      return existingSource;
    }

    try {
      var parsed = LunoClassPatcher.parseSpec(targetSpec);
      var ast = LunoClassPatcher.parseAST(existingSource);
      var classNodes = LunoClassPatcher.findClassNodes(ast, parsed.className);

      if (classNodes.length === 0) return existingSource;
      var targetClass = classNodes[0];
      if (!targetClass.bodyNode || !Array.isArray(targetClass.bodyNode.body)) return existingSource;

      var memberNode = null;
      for (var i = 0; i < targetClass.bodyNode.body.length; i++) {
        var member = targetClass.bodyNode.body[i];
        if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition') {
          var keyName = member.key ? (member.key.name || member.key.value) : null;
          var staticMatch = (parsed.isStatic === null) ? true : (Boolean(member.static) === Boolean(parsed.isStatic));
          var kindMatch = parsed.kind === 'method' || member.kind === parsed.kind;
          if (keyName === parsed.memberName && staticMatch && kindMatch) {
            memberNode = member;
            break;
          }
        }
      }

      if (memberNode && memberNode.range) {
        var start = memberNode.range[0];
        var end = memberNode.range[1];

        while (start > 0 && (existingSource[start - 1] === ' ' || existingSource[start - 1] === '\t')) {
          start--;
        }
        if (start > 0 && existingSource[start - 1] === '\n') {
          start--;
          if (start > 0 && existingSource[start - 1] === '\r') start--;
        }
        return existingSource.slice(0, start) + existingSource.slice(end);
      }
    } catch(e) {
      console.warn('[LunoClassPatcher] deleteMethodInSource notice:', e.message);
    }
    return existingSource;
  }

  /**
   * ⚙️ METHOD: patchMethodInSource(existingSource, targetSpec, methodCode)
   */
  static patchMethodInSource(existingSource, targetSpec, methodCode) {
    if (!existingSource || typeof existingSource !== 'string' || !existingSource.trim()) {
      throw new Error('[Luno AST Guard] Cannot patch method: existingSource is empty.');
    }

    var parsed = LunoClassPatcher.parseSpec(targetSpec);
    var className = parsed.className;
    var memberName = parsed.memberName;
    var isStatic = parsed.isStatic;
    var targetKind = parsed.kind;

    var cleanMethod = LunoClassPatcher.normalizeMethodCode(memberName, methodCode, isStatic, targetKind);
    var ast = LunoClassPatcher.parseAST(existingSource);
    var classNodes = LunoClassPatcher.findClassNodes(ast, className);

    if (classNodes.length === 0) {
      var allFound = LunoClassPatcher.findClassNodes(ast).map(function(c) { return c.name || 'Anonymous'; });
      throw new Error('[Luno AST Guard] Target class "' + (className || 'target') + '" not found in source AST. Available classes: [' + allFound.join(', ') + '].');
    }

    var targetClassNode = classNodes[0].node;
    var classBody = targetClassNode.body;

    if (!classBody || !Array.isArray(classBody.body) || !classBody.range) {
      throw new Error('[Luno AST Guard] Target class "' + className + '" has an invalid class body in AST.');
    }

    var existingMemberNode = null;
    for (var i = 0; i < classBody.body.length; i++) {
      var member = classBody.body[i];
      if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition') {
        var keyName = member.key ? (member.key.name || member.key.value) : null;
        var staticMatch = (isStatic === null) ? true : (Boolean(member.static) === Boolean(isStatic));
        var kindMatch = targetKind === 'method' || member.kind === targetKind;
        if (keyName === memberName && staticMatch && kindMatch) {
          existingMemberNode = member;
          break;
        }
      }
    }

    var baseIndentation = '  ';

    if (existingMemberNode && existingMemberNode.range) {
      var startIdx = existingMemberNode.range[0];
      var endIdx = existingMemberNode.range[1];

      var indentedMethod = baseIndentation + cleanMethod.split('\n').map(function(line, idx) {
        return idx === 0 ? line : (baseIndentation + line);
      }).join('\n');

      return existingSource.slice(0, startIdx) + indentedMethod.trimStart() + existingSource.slice(endIdx);
    }

    var closeBraceIdx = classBody.range[1] - 1;
    var indentedNewMethod = '\n' + baseIndentation + cleanMethod.split('\n').map(function(line, idx) {
      return idx === 0 ? line : (baseIndentation + line);
    }).join('\n') + '\n';

    return existingSource.slice(0, closeBraceIdx) + indentedNewMethod + existingSource.slice(closeBraceIdx);
  }
}

if (typeof window !== 'undefined') window.LunoClassPatcher = LunoClassPatcher;
globalThis.LunoClassPatcher = LunoClassPatcher;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoClassPatcher;