class LunoLinePatcher {
  constructor() {}

    static appendPatch(sourceCode = '', targetSpec = '', methodCode = '', options = {}) {
      const opts = options || {};
      const isHotPatch = opts.hotPatch !== false;
  
      if (!targetSpec || !methodCode) {
        return { updatedSource: sourceCode, patchAdded: false, error: 'Missing targetSpec or methodCode.' };
      }
  
      let cleanSpec = targetSpec.trim();
      if (cleanSpec.includes('@')) cleanSpec = cleanSpec.split('@').pop().trim();
      cleanSpec = cleanSpec.replace(/^(?:globalThis|window)\./, '');
  
      let className = '';
      let memberName = '';
      let isPrototype = cleanSpec.includes('.prototype.');
  
      if (isPrototype) {
        const parts = cleanSpec.split('.prototype.');
        className = parts[0].trim();
        memberName = parts[1].trim();
      } else if (cleanSpec.includes('.')) {
        const parts = cleanSpec.split('.');
        memberName = parts.pop().trim();
        className = parts.join('.').trim();
      } else {
        memberName = cleanSpec;
      }
  
      const parsed = globalThis.LunoLinearParser ? globalThis.LunoLinearParser.parse(sourceCode) : { className: null };
      const targetClass = className || parsed.className || 'AppClass';
  
      let cleanMethod = methodCode.trim();
      if (cleanMethod.endsWith(';')) cleanMethod = cleanMethod.slice(0, -1).trim();
  
      if (cleanMethod.startsWith('static ')) {
        cleanMethod = cleanMethod.slice(7).trim();
      }
  
      let isAsync = false;
      if (cleanMethod.startsWith('async ')) {
        isAsync = true;
        cleanMethod = cleanMethod.slice(6).trim();
      }
  
      if (cleanMethod.startsWith('function')) {
        cleanMethod = (isAsync ? 'async ' : '') + cleanMethod;
      } else {
        const braceIdx = cleanMethod.indexOf('{');
        if (braceIdx !== -1) {
          const sig = cleanMethod.slice(0, braceIdx).trim();
          const parenIdx = sig.indexOf('(');
          if (parenIdx !== -1) {
            const params = sig.slice(parenIdx);
            const body = cleanMethod.slice(braceIdx);
            cleanMethod = (isAsync ? 'async function' : 'function') + params + ' ' + body;
          } else {
            cleanMethod = (isAsync ? 'async function() ' : 'function() ') + cleanMethod.slice(braceIdx);
          }
        }
      }
  
      let patchTargetStr = '';
      if (typeof globalThis !== 'undefined' && globalThis[targetClass]) {
        const cls = globalThis[targetClass];
        if (isPrototype || (cls.prototype && (typeof cls.prototype[memberName] === 'function' || memberName in cls.prototype))) {
          patchTargetStr = `globalThis.${targetClass}.prototype.${memberName}`;
        } else {
          patchTargetStr = `globalThis.${targetClass}.${memberName}`;
        }
      } else {
        patchTargetStr = isPrototype
          ? `globalThis.${targetClass}.prototype.${memberName}`
          : `globalThis.${targetClass}.${memberName}`;
      }
  
      const patchAssignmentStatement = `${patchTargetStr} = ${cleanMethod};`;
  
      const updatedSource = sourceCode
        ? (sourceCode.trimEnd() + '\n\n' + patchAssignmentStatement + '\n')
        : (patchAssignmentStatement + '\n');
  
      let appliedToRuntime = false;
      if (isHotPatch && typeof globalThis !== 'undefined') {
        try {
          const evalFn = new Function('globalThis', patchAssignmentStatement);
          evalFn(globalThis);
          appliedToRuntime = true;
  
          if (globalThis[targetClass]) {
            const cls = globalThis[targetClass];
            if (cls.prototype && typeof cls.prototype[memberName] === 'function') {
              try {
                const protoFn = new Function('globalThis', `globalThis.${targetClass}.prototype.${memberName} = ${cleanMethod};`);
                protoFn(globalThis);
              } catch(e2){}
            }
          }
        } catch (e) {
          console.warn('[LunoLinePatcher] Runtime hot-patch evaluation notice:', e.message);
        }
      }
  
      return {
        updatedSource,
        patchAssignmentStatement,
        patchAdded: true,
        targetSpec: `${targetClass}.${memberName}`,
        isHotPatch,
        appliedToRuntime
      };
    }

  static consolidate(sourceCode = '') {
    if (!sourceCode || typeof sourceCode !== 'string') return sourceCode;

    const parsed = globalThis.LunoLinearParser ? globalThis.LunoLinearParser.parse(sourceCode) : null;
    if (!parsed || !parsed.assignments || parsed.assignments.length === 0) {
      return sourceCode;
    }

    const latestMap = new Map();
    for (const a of parsed.assignments) {
      if (a.targetSpec) {
        latestMap.set(a.targetSpec, a.code);
      }
    }

    const seenSpecs = new Set();
    const outputStatements = [];

    for (const a of parsed.assignments) {
      if (a.targetSpec) {
        if (!seenSpecs.has(a.targetSpec)) {
          seenSpecs.add(a.targetSpec);
          outputStatements.push(latestMap.get(a.targetSpec) || a.code);
        }
      } else {
        outputStatements.push(a.code);
      }
    }

    return outputStatements.join('\n\n').trim() + '\n';
  }
}

globalThis.LunoLinePatcher = LunoLinePatcher;
if (typeof module !== "undefined" && module.exports) module.exports = LunoLinePatcher;