class LunoLinearParser {
  constructor() {}

  static normalizeSpec(spec) {
      if (!spec || typeof spec !== 'string') return '';
      let clean = spec.trim();
      if (clean.includes('@')) clean = clean.split('@').pop().trim();
      clean = clean.replace(/^(?:globalThis|window)\./, '');
      clean = clean.replace(/\s*\([\s\S]*?\)\s*$/, '').trim();
      return clean;
    }

  static parse(sourceCode = '') {
      if (!sourceCode || typeof sourceCode !== 'string') {
        return { className: null, assignments: [] };
      }

      let detectedClass = null;
      const pascalMatch = sourceCode.match(/\b([A-Z][A-Za-z0-9_$]*)(?:\.prototype|\.|\s*=\s*(?:function|class|globalThis|window))/);
      if (pascalMatch && pascalMatch[1] && pascalMatch[1] !== 'Object' && pascalMatch[1] !== 'Array' && pascalMatch[1] !== 'Function') {
        detectedClass = pascalMatch[1];
      }

      let acornObj = (typeof window !== 'undefined' && window.acorn) || (typeof globalThis !== 'undefined' && globalThis.acorn);
      if (!acornObj && typeof require !== 'undefined') {
        try { acornObj = require('acorn'); } catch (e) {}
      }

      if (!acornObj || typeof acornObj.parse !== 'function') {
        return { className: detectedClass, assignments: [] };
      }

      const parseOpts = {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowHashBang: true,
        ranges: true,
        locations: true
      };

      let ast = null;
      try {
        ast = acornObj.parse(sourceCode, parseOpts);
      } catch (e) {
        try {
          parseOpts.sourceType = 'script';
          ast = acornObj.parse(sourceCode, parseOpts);
        } catch (e2) {
          return { className: detectedClass, assignments: [] };
        }
      }

      const assignments = [];

      if (ast && Array.isArray(ast.body)) {
        for (const node of ast.body) {
          const stmtCode = sourceCode.slice(node.range[0], node.range[1]).trim();
          let normSpec = null;

          if (node.type === 'ClassDeclaration' && node.id) {
            if (!detectedClass) detectedClass = node.id.name;
            normSpec = node.id.name;
          } else if (node.type === 'FunctionDeclaration' && node.id) {
            if (!detectedClass && /^[A-Z]/.test(node.id.name)) detectedClass = node.id.name;
            normSpec = node.id.name;
          } else if (node.type === 'VariableDeclaration' && node.declarations && node.declarations[0]) {
            const decl = node.declarations[0];
            if (decl.id && decl.id.name) {
              if (!detectedClass && /^[A-Z]/.test(decl.id.name)) detectedClass = decl.id.name;
              normSpec = decl.id.name;
            }
          } else if (node.type === 'ExpressionStatement' && node.expression) {
            const expr = node.expression;
            if (expr.type === 'AssignmentExpression' && expr.left) {
              const rawSpec = sourceCode.slice(expr.left.range[0], expr.left.range[1]).trim();
              normSpec = LunoLinearParser.normalizeSpec(rawSpec);
              const parts = normSpec.split('.');
              if (parts[0] && /^[A-Z]/.test(parts[0])) {
                if (!detectedClass) detectedClass = parts[0];
              }
            } else if (expr.type === 'CallExpression' && expr.callee) {
              const calleeCode = sourceCode.slice(expr.callee.range[0], expr.callee.range[1]).trim();
              if (calleeCode === 'Object.defineProperty' && expr.arguments && expr.arguments.length >= 2) {
                const targetObj = sourceCode.slice(expr.arguments[0].range[0], expr.arguments[0].range[1]).trim();
                const propName = expr.arguments[1].value || sourceCode.slice(expr.arguments[1].range[0], expr.arguments[1].range[1]).replace(/['"]/g, '').trim();
                normSpec = LunoLinearParser.normalizeSpec(targetObj) + '.' + propName;
                const parts = normSpec.split('.');
                if (parts[0] && /^[A-Z]/.test(parts[0])) {
                  if (!detectedClass) detectedClass = parts[0];
                }
              }
            }
          }

          assignments.push({
            targetSpec: normSpec,
            range: node.range,
            code: stmtCode
          });
        }
      }

      return { className: detectedClass, assignments: assignments };
    }
}

globalThis.LunoLinearParser = LunoLinearParser;
if (typeof module !== "undefined" && module.exports) module.exports = LunoLinearParser;