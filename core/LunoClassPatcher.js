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

      // Strip trailing argument signature if the LLM provided method arguments in data-method (e.g. "App.init()" or "App.run(env)")
      clean = clean.replace(/\s*\([\s\S]*?\)\s*$/, '').trim();

      var isStatic = null;
      var isAsync = false;
      var isGenerator = false;
      var kind = 'method';

      // Global modifier scanning across the whole spec string (e.g. "App.static async methodName" or "static App.methodName")
      if (/\bstatic\b/.test(clean) || clean.includes('.static.')) {
        isStatic = true;
        clean = clean.replace(/\bstatic\b\s*/g, '').replace(/\.static\./g, '.');
      }

      if (/\basync\b/.test(clean)) {
        isAsync = true;
        clean = clean.replace(/\basync\b\s*/g, '');
      }

      if (clean.includes('*')) {
        isGenerator = true;
        clean = clean.replace(/\*/g, '');
      }

      if (/\bget\b/.test(clean) || clean.includes('.get.')) {
        kind = 'get';
        clean = clean.replace(/\bget\b\s*/g, '').replace(/\.get\./g, '.');
      } else if (/\bset\b/.test(clean) || clean.includes('.set.')) {
        kind = 'set';
        clean = clean.replace(/\bset\b\s*/g, '').replace(/\.set\./g, '.');
      }

      // Clean any multi-dot anomalies left by modifier stripping
      clean = clean.replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');

      var className = '';
      var memberName = '';

      if (clean.includes('.prototype.')) {
        var parts = clean.split('.prototype.');
        className = parts[0].trim();
        memberName = parts[1].trim();
        if (isStatic === null) isStatic = false;
      } else if (clean.includes('.')) {
        var parts2 = clean.split('.');
        memberName = parts2.pop().trim();
        className = parts2.join('.').trim();
      } else {
        memberName = clean;
      }

      // Sanitize any remaining parentheses or whitespace from member name
      memberName = memberName.replace(/\s*\([\s\S]*?\)\s*$/, '').trim();

      if (memberName === 'constructor') {
        isStatic = false;
        kind = 'constructor';
      }

      if (!memberName) {
        throw new Error('[Luno AST Guard] Invalid targetSpec "' + targetSpec + '": Could not extract member name.');
      }

      return {
        className: className,
        memberName: memberName,
        isStatic: isStatic,
        isAsync: isAsync,
        isGenerator: isGenerator,
        kind: kind
      };
    }

  static normalizeMethodCode(memberName, methodCode, isStatic, targetKind) {
      var rawStr = String(methodCode !== undefined && methodCode !== null ? methodCode : '').trim();
      if (!rawStr) {
        return (isStatic === true ? 'static ' : '') + memberName + '() {}';
      }

      var clean = rawStr;
      if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

      // Strip legacy prototype assignment if explicitly on the left side of an assignment
      if (/^(?:globalThis\.|window\.)?[A-Za-z0-9_$]+(?:\.prototype|\.)[A-Za-z0-9_$]+\s*=/.test(clean)) {
        var eqIdx = clean.indexOf('=');
        clean = clean.slice(eqIdx + 1).trim();
        if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();
      }

      // Strip leading comments
      var maxPasses = 20;
      while (maxPasses > 0 && (clean.startsWith('//') || clean.startsWith('/*'))) {
        maxPasses--;
        if (clean.startsWith('//')) {
          var nl = clean.indexOf('\n');
          clean = nl !== -1 ? clean.slice(nl + 1).trim() : '';
        } else if (clean.startsWith('/*')) {
          var endComment = clean.indexOf('*/');
          clean = endComment !== -1 ? clean.slice(endComment + 2).trim() : '';
        }
      }
      if (!clean) return (isStatic === true ? 'static ' : '') + memberName + '() {}';

      // 1. Check for Class Property / Field Assignment (e.g. `static KEY = 'val';` or `handler = (e) => { ... };`)
      var propMatch = clean.match(/^(?:(static)\s+)?(?:(async)\s+)?([A-Za-z0-9_$#]+)\s*=\s*([\s\S]+)$/);
      if (propMatch && !clean.startsWith('get ') && !clean.startsWith('set ')) {
        var propStatic = (propMatch[1] === 'static') || (isStatic === true);
        var propVal = propMatch[4].trim();
        var propPrefix = propStatic ? 'static ' : '';
        var semi = (propVal.endsWith('}') || propVal.endsWith(';')) ? (propVal.endsWith(';') ? '' : ';') : ';';
        return propPrefix + memberName + ' = ' + propVal + semi;
      }

      var openParenIdx = clean.indexOf('(');
      var firstBraceIdx = clean.indexOf('{');

      // 2. Handle simple body without braces
      if (firstBraceIdx === -1) {
        var prefix = (isStatic === true ? 'static ' : '');
        if (memberName === 'constructor') return 'constructor() { ' + clean + ' }';
        return prefix + memberName + '() { ' + clean + ' }';
      }

      // 3. Balanced parameter scanner ignoring comments and string literals
      var bodyStartIdx = firstBraceIdx;
      var headerPart = clean.slice(0, firstBraceIdx).trim();
      var bodyPart = clean.slice(firstBraceIdx).trim();

      if (openParenIdx !== -1) {
        var depth = 0;
        var inStr = false;
        var strChar = '';
        var inLineComm = false;
        var inBlockComm = false;
        var closeParenIdx = -1;

        for (var i = openParenIdx; i < clean.length; i++) {
          var ch = clean[i];
          var prev = i > 0 ? clean[i - 1] : '';
          var next = (i + 1 < clean.length) ? clean[i + 1] : '';

          if (inLineComm) {
            if (ch === '\n' || ch === '\r') inLineComm = false;
            continue;
          }
          if (inBlockComm) {
            if (ch === '*' && next === '/') {
              inBlockComm = false;
              i++;
            }
            continue;
          }

          if (inStr) {
            if (ch === strChar && prev !== '\\') inStr = false;
            continue;
          }

          if (ch === '/' && next === '/') {
            inLineComm = true;
            i++;
            continue;
          }
          if (ch === '/' && next === '*') {
            inBlockComm = true;
            i++;
            continue;
          }

          if (ch === '"' || ch === "'" || ch === '`') {
            inStr = true;
            strChar = ch;
            continue;
          }

          if (ch === '(') {
            depth++;
          } else if (ch === ')') {
            depth--;
            if (depth === 0) {
              closeParenIdx = i;
              break;
            }
          }
        }

        if (closeParenIdx !== -1) {
          var searchBrace = clean.indexOf('{', closeParenIdx);
          if (searchBrace !== -1) {
            bodyStartIdx = searchBrace;
            headerPart = clean.slice(0, bodyStartIdx).trim();
            bodyPart = clean.slice(bodyStartIdx).trim();
          }
        }
      }

      var hasStatic = /\bstatic\b/.test(headerPart) || (isStatic === true);
      var hasAsync = /\basync\b/.test(headerPart);
      var isGenerator = headerPart.includes('*');
      var isGet = /\bget\b/.test(headerPart) || targetKind === 'get';
      var isSet = /\bset\b/.test(headerPart) || targetKind === 'set';

      var params = '()';
      var pStart = headerPart.indexOf('(');
      var pEnd = headerPart.lastIndexOf(')');
      if (pStart !== -1 && pEnd !== -1 && pEnd > pStart) {
        params = headerPart.slice(pStart, pEnd + 1);
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

      var walk = function(node, parent) {
        if (!node || typeof node !== 'object') return;

        if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
          var name = (node.id && node.id.name) ? node.id.name : null;

          // If anonymous ClassExpression, resolve variable or assignment name from parent AST node
          if (!name && parent) {
            if (parent.type === 'VariableDeclarator' && parent.id && parent.id.name) {
              name = parent.id.name;
            } else if (parent.type === 'AssignmentExpression' && parent.left) {
              if (parent.left.type === 'Identifier') name = parent.left.name;
              else if (parent.left.type === 'MemberExpression' && parent.left.property) name = parent.left.property.name || parent.left.property.value;
            }
          }

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
              if (child[i] && typeof child[i].type === 'string') walk(child[i], node);
            }
          } else if (child && typeof child.type === 'string') {
            walk(child, node);
          }
        }
      };

      walk(ast, null);

      // If a specific targetClassName was requested but not found by exact name, and file has exactly 1 class, return that class
      if (results.length === 0 && targetClassName) {
        var allNodes = LunoClassPatcher.findClassNodes(ast, null);
        if (allNodes.length === 1) {
          return allNodes;
        }
      }

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

      // Determine effective staticness: preserve existing member's static modifier if unspecified in targetSpec
      var effectiveStatic = isStatic;
      if (effectiveStatic === null) {
        if (existingMemberNode) {
          effectiveStatic = Boolean(existingMemberNode.static);
        } else {
          effectiveStatic = /\bstatic\b/.test(methodCode);
        }
      }

      var cleanMethod = String(LunoClassPatcher.normalizeMethodCode(memberName, methodCode, effectiveStatic, targetKind) || '').trim();
      if (!cleanMethod) return existingSource;

      // Detect contextual indentation: inherit from existing member or class body level
      var targetIndentStr = '  ';
      if (existingMemberNode && existingMemberNode.range) {
        var lineStart = existingSource.lastIndexOf('\n', existingMemberNode.range[0]);
        var indentSub = existingSource.slice(lineStart === -1 ? 0 : lineStart + 1, existingMemberNode.range[0]);
        var indentMatch = indentSub.match(/^([ \t]*)/);
        if (indentMatch && indentMatch[1].length > 0) {
          targetIndentStr = indentMatch[1];
        }
      } else if (classBody.range) {
        var classLineStart = existingSource.lastIndexOf('\n', targetClassNode.range[0]);
        var classIndentSub = existingSource.slice(classLineStart === -1 ? 0 : classLineStart + 1, targetClassNode.range[0]);
        var classIndentMatch = classIndentSub.match(/^([ \t]*)/);
        targetIndentStr = (classIndentMatch ? classIndentMatch[1] : '') + '  ';
      }

      // Dedent incoming code to 0-level first to prevent compounding indentation drift
      var rawLines = cleanMethod.split('\n');
      var minIndent = Infinity;
      for (var l = 0; l < rawLines.length; l++) {
        var line = rawLines[l];
        if (line.trim().length > 0) {
          var match = line.match(/^([ \t]*)/);
          if (match && match[1].length < minIndent) {
            minIndent = match[1].length;
          }
        }
      }
      if (minIndent === Infinity) minIndent = 0;

      var formattedMethod = rawLines.map(function(line) {
        if (line.trim().length === 0) return '';
        var relativeLine = line.slice(Math.min(line.length, minIndent));
        return targetIndentStr + relativeLine;
      }).join('\n');

      if (existingMemberNode && existingMemberNode.range) {
        var startIdx = existingMemberNode.range[0];
        var endIdx = existingMemberNode.range[1];

        // Backward scan: consume attached JSDoc (/* ... */) or single-line (// ...) comment headers
        var scanIdx = startIdx - 1;
        while (scanIdx >= 0 && (existingSource[scanIdx] === ' ' || existingSource[scanIdx] === '\t')) {
          scanIdx--;
        }

        var keepScanning = true;
        while (keepScanning && scanIdx >= 0) {
          if (existingSource[scanIdx] === '\n' || existingSource[scanIdx] === '\r') {
            var linePeek = scanIdx - 1;
            while (linePeek >= 0 && (existingSource[linePeek] === ' ' || existingSource[linePeek] === '\t')) {
              linePeek--;
            }
            if (linePeek >= 1 && existingSource[linePeek] === '/' && existingSource[linePeek - 1] === '*') {
              var commentStart = existingSource.lastIndexOf('/*', linePeek);
              if (commentStart !== -1) {
                var preC = commentStart - 1;
                while (preC >= 0 && (existingSource[preC] === ' ' || existingSource[preC] === '\t')) preC--;
                if (preC < 0 || existingSource[preC] === '\n' || existingSource[preC] === '\r') {
                  startIdx = Math.max(0, preC + 1);
                  scanIdx = preC;
                  continue;
                }
              }
            } else if (linePeek >= 0) {
              var prevLineStart = existingSource.lastIndexOf('\n', linePeek);
              var prevLine = existingSource.slice(prevLineStart === -1 ? 0 : prevLineStart + 1, linePeek + 1).trim();
              if (prevLine.startsWith('//')) {
                startIdx = prevLineStart === -1 ? 0 : prevLineStart + 1;
                scanIdx = prevLineStart;
                continue;
              }
            }
          }
          keepScanning = false;
        }

        var before = existingSource.slice(0, startIdx).trimEnd();
        var after = existingSource.slice(endIdx);
        if (after.startsWith(';')) {
          after = after.slice(1);
        }
        after = after.replace(/^[\r\n]+/, '');

        return before + '\n\n' + formattedMethod + '\n' + after;
      }

      // Similarity check to alert on potential typos of existing member names
      var closeMatch = null;
      var targetLower = memberName.toLowerCase();
      for (var a = 0; a < availableMembers.length; a++) {
        var cleanAvail = availableMembers[a].replace(/^static\s+/, '');
        var availLower = cleanAvail.toLowerCase();
        if (availLower === targetLower) {
          closeMatch = cleanAvail;
          break;
        }
        if (availLower.startsWith(targetLower) && availLower.length - targetLower.length <= 3) {
          closeMatch = cleanAvail;
          break;
        }
        if (targetLower.startsWith(availLower) && targetLower.length - availLower.length <= 3) {
          closeMatch = cleanAvail;
          break;
        }
      }

      if (closeMatch) {
        var notice = '[Luno AST Guard] Notice: Member "' + memberName + '" not found in class "' + className + '", but similar member "' + closeMatch + '" exists in class body.';
        console.warn(notice);
        if (typeof LunoPlaybackLogger !== 'undefined' && LunoPlaybackLogger.warn) {
          LunoPlaybackLogger.warn('AST Member Similarity Notice', 'Target: ' + memberName + ' | Existing: ' + closeMatch + ' in class ' + className);
        }
      }

      if (!allowInsert) {
        throw new Error(
          '[Luno AST Guard] Target member "' + (effectiveStatic ? 'static ' : '') + memberName + '" was not found in class "' + className + '". ' +
          (closeMatch ? ('(Did you mean "' + closeMatch + '"?) ') : '') +
          'Available members: [' + availableMembers.join(', ') + '].'
        );
      }

      // Safe insertion anchored after the last member in class body
      var lastMember = (classBody.body && classBody.body.length > 0) ? classBody.body[classBody.body.length - 1] : null;
      var insertPos = (lastMember && lastMember.range) ? lastMember.range[1] : (classBody.range[0] + 1);

      var beforeInsert = existingSource.slice(0, insertPos).trimEnd();
      var afterInsert = existingSource.slice(insertPos);

      return beforeInsert + '\n\n' + formattedMethod + '\n' + afterInsert.trimStart();
    }
}

if (typeof window !== 'undefined') window.LunoClassPatcher = LunoClassPatcher;
globalThis.LunoClassPatcher = LunoClassPatcher;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoClassPatcher;