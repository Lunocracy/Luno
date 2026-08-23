class LunoClassPatcher {
  constructor() {}

  /**
   * ⚙️ METHOD: parseAST(sourceText)
   * - Type: Static Method
   * - Modifier: sync
   */
  static parseAST(sourceText) {
    let acornObj = null;
    if (typeof globalThis !== 'undefined' && globalThis.acorn) {
      acornObj = globalThis.acorn;
    } else if (typeof window !== 'undefined' && window.acorn) {
      acornObj = window.acorn;
    } else if (typeof require !== 'undefined') {
      try { acornObj = require('acorn'); } catch (e) {}
    }

    if (!acornObj || typeof acornObj.parse !== 'function') {
      throw new Error('Acorn AST parser is unavailable in client runtime scope.');
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
      return acornObj.parse(sourceText, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowHashBang: true,
        ranges: true
      });
    }
  }

  /**
   * ⚙️ METHOD: parseSpec(targetSpec)
   * - Type: Static Method
   * - Modifier: sync
   */
  static parseSpec(targetSpec) {
    if (!targetSpec || typeof targetSpec !== 'string') {
      return { className: '', memberName: '', isStatic: false };
    }
    let clean = targetSpec.trim();
    if (clean.includes('@')) clean = clean.split('@').pop().trim();
    clean = clean.replace(/^(?:globalThis|window)\./, '');

    let className = '';
    let memberName = '';
    let isStatic = false;

    if (clean.includes('.prototype.')) {
      const parts = clean.split('.prototype.');
      className = parts[0].trim();
      memberName = parts[1].trim();
      isStatic = false;
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      memberName = parts.pop().trim();
      className = parts.join('.').trim();
      isStatic = true;
    } else {
      memberName = clean;
    }

    return { className, memberName, isStatic };
  }

  /**
   * ⚙️ METHOD: normalizeMethodCode(memberName, methodCode, isStatic)
   * - Type: Static Method
   * - Modifier: sync
   */
  static normalizeMethodCode(memberName, methodCode, isStatic) {
    if (!methodCode || typeof methodCode !== 'string') return '';
    let clean = methodCode.trim();

    // Strip trailing semicolon if present
    if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

    // If method is wrapped as full assignment Target.prototype.method = function(...) { ... }
    if (clean.includes('=')) {
      const equalsIdx = clean.indexOf('=');
      const leftPart = clean.slice(0, equalsIdx).trim();
      if (leftPart.includes('.prototype.') || leftPart.includes('.')) {
        clean = clean.slice(equalsIdx + 1).trim();
      }
    }

    // Convert function expression `function(...) { ... }` or `async function(...) { ... }`
    if (/^(?:async\s+)?function\s*\b/.test(clean)) {
      const isAsync = clean.startsWith('async ');
      const paramStart = clean.indexOf('(');
      clean = (isAsync ? 'async ' : '') + (isStatic ? 'static ' : '') + memberName + clean.slice(paramStart);
      return clean;
    }

    // Handle standard ES6 method syntax `methodName(...) { ... }` or `async methodName(...) { ... }`
    if (/^(?:static\s+)?(?:async\s+)?([A-Za-z0-9_$]+)\s*\(/.test(clean)) {
      if (isStatic && !clean.startsWith('static ')) {
        clean = 'static ' + clean;
      }
      return clean;
    }

    // Fallback: wrap as clean ES6 class method
    return (isStatic ? 'static ' : '') + memberName + '() {\n  ' + clean + '\n}';
  }

  /**
   * ⚙️ METHOD: patchMethodInSource(existingSource, targetSpec, methodCode)
   * - Type: Static Method
   * - Modifier: sync
   */
  static patchMethodInSource(existingSource, targetSpec, methodCode) {
    const source = existingSource || '';
    if (!targetSpec || !methodCode) return source;

    const { className, memberName, isStatic } = LunoClassPatcher.parseSpec(targetSpec);
    const cleanMethod = LunoClassPatcher.normalizeMethodCode(memberName, methodCode, isStatic);

    let ast = null;
    try {
      ast = LunoClassPatcher.parseAST(source);
    } catch (e) {
      // If parsing fails or file is not valid JS, return source with patch appended safely
      return source.trimEnd() + '\n\n' + cleanMethod + '\n';
    }

    // Locate target ClassDeclaration or ClassExpression
    let targetClassNode = null;
    const walk = (node) => {
      if (!node || typeof node !== 'object' || targetClassNode) return;
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        if (!className || (node.id && node.id.name === className)) {
          targetClassNode = node;
          return;
        }
      }
      for (const k in node) {
        if (k === 'parent') continue;
        const child = node[k];
        if (Array.isArray(child)) {
          for (const c of child) if (c && typeof c.type === 'string') walk(c);
        } else if (child && typeof child.type === 'string') {
          walk(child);
        }
      }
    };
    walk(ast);

    if (!targetClassNode || !targetClassNode.body || !Array.isArray(targetClassNode.body.body)) {
      // If no class declaration found, fallback to wrapping in new ES6 class
      const clsName = className || 'AppClass';
      return source.trimEnd() + '\n\nclass ' + clsName + ' {\n  ' + cleanMethod + '\n}\n';
    }

    const classBody = targetClassNode.body;
    let existingMethodNode = null;

    for (const member of classBody.body) {
      if (member.type === 'MethodDefinition' || member.type === 'PropertyDefinition') {
        let keyName = null;
        if (member.key) {
          if (member.key.type === 'Identifier') keyName = member.key.name;
          else if (member.key.type === 'Literal') keyName = String(member.key.value);
        }
        if (keyName === memberName) {
          existingMethodNode = member;
          break;
        }
      }
    }

    if (existingMethodNode && existingMethodNode.range) {
      // METHOD REPLACEMENT: Replace exact AST range of existing method in class body
      const startIdx = existingMethodNode.range[0];
      const endIdx = existingMethodNode.range[1];
      const indentedMethod = '  ' + cleanMethod.split('\n').join('\n  ');
      return source.slice(0, startIdx) + indentedMethod + source.slice(endIdx);
    }

    // METHOD INSERTION: Insert new ES6 method right before closing brace `}` of ClassBody
    const closeBraceIdx = classBody.range[1] - 1;
    const indentedMethod = '\n  ' + cleanMethod.split('\n').join('\n  ') + '\n';
    return source.slice(0, closeBraceIdx) + indentedMethod + source.slice(closeBraceIdx);
  }

  /**
   * ⚙️ METHOD: findMethodBounds(sourceText, targetSpec)
   * - Type: Static Method
   * - Modifier: sync
   */
  static findMethodBounds(sourceText, targetSpec) {
    if (!sourceText || !targetSpec) return null;
    const { className, memberName } = LunoClassPatcher.parseSpec(targetSpec);

    let ast = null;
    try {
      ast = LunoClassPatcher.parseAST(sourceText);
    } catch (e) {
      return null;
    }

    let methodRange = null;
    const walk = (node) => {
      if (!node || typeof node !== 'object' || methodRange) return;
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        if (!className || (node.id && node.id.name === className)) {
          if (node.body && Array.isArray(node.body.body)) {
            for (const member of node.body.body) {
              let keyName = member.key ? (member.key.name || member.key.value) : null;
              if (keyName === memberName && member.range) {
                methodRange = { startIdx: member.range[0], endIdx: member.range[1] };
                return;
              }
            }
          }
        }
      }
      for (const k in node) {
        if (k === 'parent') continue;
        const child = node[k];
        if (Array.isArray(child)) {
          for (const c of child) if (c && typeof c.type === 'string') walk(c);
        } else if (child && typeof child.type === 'string') {
          walk(child);
        }
      }
    };
    walk(ast);

    return methodRange;
  }
}

globalThis.LunoClassPatcher = LunoClassPatcher;
if (typeof module !== "undefined" && module.exports) module.exports = LunoClassPatcher;