class LunoClassPatcher {
  constructor() {}

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
            var appAcorn = p.join(root, 'app', 'acorn.js');
            if (require('fs').existsSync(appAcorn)) {
              acornObj = require(appAcorn);
            }
          } catch (e2) {}
        }
        if (!acornObj) {
          try {
            var p = require('path');
            var root = (typeof LunoServer !== 'undefined' && LunoServer.getRootDir) ? LunoServer.getRootDir() : process.cwd();
            acornObj = require(p.join(root, 'node_modules', 'acorn'));
          } catch (e3) {}
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

  static normalizeMethodCode(memberName, methodCode, isStatic, targetKind) {
    var rawStr = String(methodCode !== undefined && methodCode !== null ? methodCode : '').trim();
    if (!rawStr) {
      return (isStatic === true ? 'static ' : '') + memberName + '() {}';
    }

    var clean = rawStr;
    if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

    if (clean.includes('=')) {
      var equalsIdx = clean.indexOf('=');
      var leftPart = clean.slice(0, equalsIdx).trim();
      if (leftPart.includes('.prototype.') || leftPart.includes('.')) {
        clean = clean.slice(equalsIdx + 1).trim();
        if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();
      }
    }

    var stripped = clean;
    var maxPasses = 20;
    while (maxPasses > 0 && (stripped.startsWith('//') || stripped.startsWith('/*'))) {
      maxPasses--;
      if (stripped.startsWith('//')) {
        var nl = stripped.indexOf('\n');
        stripped = nl !== -1 ? stripped.slice(nl + 1).trim() : '';
      } else if (stripped.startsWith('/*')) {
        var endComment = stripped.indexOf('*/');
        stripped = endComment !== -1 ? stripped.slice(endComment + 2).trim() : '';
      }
    }
    clean = stripped || clean;

    var firstBraceIdx = clean.indexOf('{');
    if (firstBraceIdx === -1) {
      var prefix = (isStatic === true ? 'static ' : '');
      if (memberName === 'constructor') return 'constructor() { ' + clean + ' }';
      return prefix + memberName + '() { ' + clean + ' }';
    }

    var headerPart = clean.slice(0, firstBraceIdx).trim();
    var bodyPart = clean.slice(firstBraceIdx).trim();

    var hasStatic = /\bstatic\b/.test(headerPart) || (isStatic === true);
    var hasAsync = /\basync\b/.test(headerPart) || bodyPart.includes('await ');
    var isGenerator = headerPart.includes('*');
    var isGet = /\bget\b/.test(headerPart) || targetKind === 'get';
    var isSet = /\bset\b/.test(headerPart) || targetKind === 'set';

    var params = '()';
    var openParenIdx = headerPart.indexOf('(');
    var closeParenIdx = headerPart.lastIndexOf(')');
    if (openParenIdx !== -1 && closeParenIdx !== -1 && closeParenIdx > openParenIdx) {
      params = headerPart.slice(openParenIdx, closeParenIdx + 1);
    }

    if (memberName === 'constructor') {
      return 'constructor' + params + ' ' + bodyPart;
    }

    var out = '';
    if (hasStatic) out += 'static ';
    if (hasAsync && !isGet && !isSet) out += 'async ';
    if (isGenerator) out += '*';
    if (isGet) out += 'get ';
    if (isSet) out += 'set ';

    out += memberName + params + ' ' + bodyPart;
    return String(out).trim();
  }

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
        if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
          var keyName = member.key ? (member.key.name || member.key.value) : null;
          var staticMatch = (parsed.isStatic === null) ? true : (Boolean(member.static) === Boolean(parsed.isStatic));
          var memberKind = member.kind || (member.type === 'PropertyDefinition' ? 'property' : 'method');
          var kindMatch = (parsed.kind === 'get' || parsed.kind === 'set')
            ? (memberKind === parsed.kind)
            : (memberKind === 'method' || memberKind === 'constructor' || memberKind === 'property');
  
          if (keyName === parsed.memberName && staticMatch && kindMatch) {
            if (member.range) {
              return { startIdx: member.range[0], endIdx: member.range[1] };
            }
          }
        }
      }
      return null;
    }

  static deleteMethodInSource(existingSource, targetSpec) {
      if (!existingSource || typeof existingSource !== 'string' || !existingSource.trim()) {
        return existingSource;
      }
  
      var parsed = LunoClassPatcher.parseSpec(targetSpec);
      var ast = LunoClassPatcher.parseAST(existingSource);
      var classNodes = LunoClassPatcher.findClassNodes(ast, parsed.className);
  
      if (classNodes.length === 0) {
        throw new Error('[Luno AST Guard] Cannot delete member: Target class "' + parsed.className + '" not found in source AST.');
      }
  
      var targetClass = classNodes[0];
      if (!targetClass.bodyNode || !Array.isArray(targetClass.bodyNode.body)) return existingSource;
  
      var memberNode = null;
      var available = [];
  
      for (var i = 0; i < targetClass.bodyNode.body.length; i++) {
        var member = targetClass.bodyNode.body[i];
        if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
          var keyName = member.key ? (member.key.name || member.key.value) : null;
          if (keyName) {
            available.push((member.static ? 'static ' : '') + keyName);
          }
  
          var staticMatch = (parsed.isStatic === null) ? true : (Boolean(member.static) === Boolean(parsed.isStatic));
          var memberKind = member.kind || (member.type === 'PropertyDefinition' ? 'property' : 'method');
          var kindMatch = (parsed.kind === 'get' || parsed.kind === 'set')
            ? (memberKind === parsed.kind)
            : (memberKind === 'method' || memberKind === 'constructor' || memberKind === 'property');
  
          if (keyName === parsed.memberName && staticMatch && kindMatch) {
            memberNode = member;
            break;
          }
        }
      }
  
      if (!memberNode) {
        throw new Error(
          '[Luno AST Guard] Cannot delete member "' + (parsed.isStatic ? 'static ' : '') + parsed.memberName + '" from class "' + parsed.className + '": ' +
          'Member not found in class body. Available members: [' + available.join(', ') + '].'
        );
      }
  
      if (memberNode && memberNode.range) {
        var start = memberNode.range[0];
        var end = memberNode.range[1];
  
        var idx = start - 1;
        while (idx >= 0 && (existingSource[idx] === ' ' || existingSource[idx] === '\t' || existingSource[idx] === '\r' || existingSource[idx] === '\n')) {
          idx--;
        }
        if (idx >= 1 && existingSource[idx] === '/' && existingSource[idx - 1] === '*') {
          var commentStart = existingSource.lastIndexOf('/*', idx);
          if (commentStart !== -1) {
            idx = commentStart - 1;
            while (idx >= 0 && (existingSource[idx] === ' ' || existingSource[idx] === '\t' || existingSource[idx] === '\r' || existingSource[idx] === '\n')) {
              idx--;
            }
          }
        }
        start = Math.max(0, idx + 1);
  
        return existingSource.slice(0, start) + '\n' + existingSource.slice(end).replace(/^[\r\n]+/, '');
      }
  
      return existingSource;
    }

  static patchMethodInSource(existingSource, targetSpec, methodCode, options) {
      if (!existingSource || typeof existingSource !== 'string' || !existingSource.trim()) {
        throw new Error('[Luno AST Guard] Cannot patch method: existingSource is empty.');
      }
  
      var opts = options || {};
      var allowInsert = (opts.allowInsert !== false && opts.insertIfMissing !== false);
      var parsed = LunoClassPatcher.parseSpec(targetSpec);
      var className = parsed.className;
      var memberName = parsed.memberName;
      var isStatic = parsed.isStatic;
      var targetKind = parsed.kind;
  
      var cleanMethod = String(LunoClassPatcher.normalizeMethodCode(memberName, methodCode, isStatic, targetKind) || '').trim();
      if (!cleanMethod) return existingSource;
  
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
      var availableMembers = [];
  
      for (var i = 0; i < classBody.body.length; i++) {
        var member = classBody.body[i];
        if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
          var keyName = member.key ? (member.key.name || member.key.value) : null;
          if (keyName) {
            availableMembers.push((member.static ? 'static ' : '') + keyName);
          }
  
          var staticMatch = (isStatic === null) ? true : (Boolean(member.static) === Boolean(isStatic));
          var memberKind = member.kind || (member.type === 'PropertyDefinition' ? 'property' : 'method');
          var kindMatch = false;
  
          if (targetKind === 'get' || targetKind === 'set') {
            kindMatch = (memberKind === targetKind);
          } else if (targetKind === 'constructor') {
            kindMatch = (memberKind === 'constructor');
          } else {
            kindMatch = (memberKind === 'method' || memberKind === 'constructor' || memberKind === 'property');
          }
  
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
  
      if (!allowInsert) {
        throw new Error(
          '[Luno AST Guard] Target member "' + (isStatic ? 'static ' : '') + memberName + '" was not found in class "' + className + '". ' +
          'Available members: [' + availableMembers.join(', ') + '].'
        );
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