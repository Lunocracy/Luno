class LunoLinearParser {
  constructor() {}

  static normalizeSpec(spec) {
    if (!spec || typeof spec !== 'string') return '';
    let clean = spec.trim();
    if (clean.includes('@')) clean = clean.split('@').pop().trim();
    return clean.replace(/^(?:globalThis|window)\./, '');
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

    let acornObj = null;
    if (typeof require !== 'undefined') {
      try { acornObj = require('acorn'); } catch (e) {}
    }
    if (!acornObj && typeof globalThis !== 'undefined' && globalThis.acorn) {
      acornObj = globalThis.acorn;
    }

    if (!acornObj || typeof acornObj.parse !== 'function') {
      return { className: detectedClass, assignments: [] };
    }

    let ast = null;
    try {
      ast = acornObj.parse(sourceCode, { ecmaVersion: 'latest', sourceType: 'script', ranges: true });
    } catch (e) {
      try {
        ast = acornObj.parse(sourceCode, { ecmaVersion: 'latest', sourceType: 'module', ranges: true });
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