class LunoLinePatcher {
  constructor() {}

  /**
   * ⚙️ METHOD: appendPatch(sourceCode, targetSpec, methodCode, options)
   * Dynamically constructs executable assignment statements and performs live runtime hot-patching.
   */
  static appendPatch(sourceCode = '', targetSpec = '', methodCode = '', options = {}) {
    const opts = options || {};
    const isHotPatch = opts.hotPatch !== false;

    if (!targetSpec || !methodCode) {
      return { updatedSource: sourceCode, patchAdded: false, error: 'Missing targetSpec or methodCode.' };
    }

    let cleanSpec = targetSpec.trim();
    if (cleanSpec.includes('@')) cleanSpec = cleanSpec.split('@').pop().trim();
    cleanSpec = cleanSpec.replace(/^(?:globalThis|window)\./, '');

    let kind = 'method';
    if (cleanSpec.startsWith('get ') || cleanSpec.includes('.get ')) {
      kind = 'get';
      cleanSpec = cleanSpec.replace(/\bget\s+/, '');
    } else if (cleanSpec.startsWith('set ') || cleanSpec.includes('.set ')) {
      kind = 'set';
      cleanSpec = cleanSpec.replace(/\bset\s+/, '');
    }

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

    // Comprehensive header matcher: [static] [async] [*] [get|set] name(...)
    const headerRegex = /^(?:(static)\s+)?(?:(async)\s+)?(\*)?\s*(?:(get|set)\s+)?([A-Za-z0-9_$#]+)\s*(\([\s\S]*?\))?\s*(\{[\s\S]*\})$/;
    const match = cleanMethod.match(headerRegex);

    const isAsync = Boolean(match && match[2]) || cleanMethod.includes('await ');
    const isGenerator = Boolean(match && match[3]);
    const memberKind = (match && match[4]) || kind;
    const params = (match && match[6]) || '()';
    const body = (match && match[7]) || (cleanMethod.indexOf('{') !== -1 ? cleanMethod.slice(cleanMethod.indexOf('{')) : ('{ ' + cleanMethod + ' }'));

    const genPrefix = isGenerator ? '*' : '';
    const asyncPrefix = isAsync ? 'async ' : '';
    const cleanFnExpr = asyncPrefix + 'function' + genPrefix + params + ' ' + body;

    let isProtoTarget = isPrototype;
    if (typeof globalThis !== 'undefined' && globalThis[targetClass]) {
      const cls = globalThis[targetClass];
      if (cls.prototype && (memberName in cls.prototype || typeof cls.prototype[memberName] === 'function')) {
        isProtoTarget = true;
      }
    }

    let patchAssignmentStatement = '';
    const targetObjPath = isProtoTarget
      ? `globalThis.${targetClass}.prototype`
      : `globalThis.${targetClass}`;

    if (memberKind === 'get') {
      patchAssignmentStatement = `Object.defineProperty(${targetObjPath}, '${memberName}', { get: ${cleanFnExpr}, configurable: true, enumerable: true });`;
    } else if (memberKind === 'set') {
      patchAssignmentStatement = `Object.defineProperty(${targetObjPath}, '${memberName}', { set: ${cleanFnExpr}, configurable: true, enumerable: true });`;
    } else {
      patchAssignmentStatement = `${targetObjPath}.${memberName} = ${cleanFnExpr};`;
    }

    const updatedSource = sourceCode
      ? (sourceCode.trimEnd() + '\n\n' + patchAssignmentStatement + '\n')
      : (patchAssignmentStatement + '\n');

    let appliedToRuntime = false;
    if (isHotPatch && typeof globalThis !== 'undefined') {
      try {
        const evalFn = new Function('globalThis', patchAssignmentStatement);
        evalFn(globalThis);
        appliedToRuntime = true;
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

  /**
   * ⚙️ METHOD: consolidate(sourceCode)
   * Merges and deduplicates sequential trailing assignment statements.
   */
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