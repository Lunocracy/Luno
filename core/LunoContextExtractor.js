const fs = require('fs');
const path = require('path');

var LunoContextExtractor = globalThis.LunoContextExtractor = function LunoContextExtractor() {};

LunoContextExtractor.sanitizePath = function(relPath, rootDir) {
  if (!relPath || typeof relPath !== 'string') return null;
  let normalized = relPath.replace(/\\/g, '/').trim();

  if (normalized.startsWith('Luno Workspace/')) {
    normalized = normalized.slice(15).trim();
  } else if (normalized.startsWith('./')) {
    normalized = normalized.slice(2).trim();
  }

  const root = rootDir || (typeof LunoServer !== 'undefined' ? LunoServer.getRootDir() : process.cwd());
  const webRoot = (typeof LunoServer !== 'undefined' ? LunoServer.getWebRootDir() : path.dirname(root));

  const directPath = path.resolve(root, normalized);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return { fullPath: directPath, relPath: path.relative(webRoot, directPath).replace(/\\/g, '/') };
  }

  const webRootPath = path.resolve(webRoot, normalized);
  if (fs.existsSync(webRootPath) && fs.statSync(webRootPath).isFile()) {
    return { fullPath: webRootPath, relPath: normalized };
  }

  return null;
};

LunoContextExtractor.extractFileContext = function(relPath, rootDir) {
  const resolved = LunoContextExtractor.sanitizePath(relPath, rootDir);
  if (!resolved) {
    return { success: false, error: `File not found on disk: ${relPath}` };
  }
  try {
    const content = fs.readFileSync(resolved.fullPath, 'utf8');
    const lines = content.split('\n').length;
    const closeScript = '</' + 'script>';
    const header = '<script data-file="' + resolved.relPath + '">\n' + content + '\n' + closeScript;
    return {
      success: true,
      kind: 'FILE',
      filePath: resolved.relPath,
      lines: lines,
      formattedText: header
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

LunoContextExtractor.extractMethodContext = function(relPath, targetSpec, rootDir) {
  const resolved = LunoContextExtractor.sanitizePath(relPath, rootDir);
  if (!resolved) {
    return { success: false, error: `File not found on disk: ${relPath}` };
  }
  try {
    const content = fs.readFileSync(resolved.fullPath, 'utf8');
    const LunoClassPatcher = require('./LunoClassPatcher.js');
    const rawTarget = resolved.relPath + ' @ ' + targetSpec;
    const bounds = LunoClassPatcher.findMethodBounds(content, rawTarget);
    if (!bounds) {
      return { success: false, error: `Method "${targetSpec}" not found in ${resolved.relPath}` };
    }
    const methodCode = content.slice(bounds.startIdx, bounds.endIdx);
    const lines = methodCode.split('\n').length;
    const closeScript = '</' + 'script>';
    const header = '<script data-file="' + resolved.relPath + '" data-method="' + targetSpec + '" data-kind="METHOD">\n' + methodCode + '\n' + closeScript;
    return {
      success: true,
      kind: 'METHOD',
      filePath: resolved.relPath,
      targetSpec: targetSpec,
      lines: lines,
      formattedText: header
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

LunoContextExtractor.extractLineRangeContext = function(relPath, startLine, endLine, rootDir) {
  const resolved = LunoContextExtractor.sanitizePath(relPath, rootDir);
  if (!resolved) {
    return { success: false, error: `File not found on disk: ${relPath}` };
  }
  try {
    const content = fs.readFileSync(resolved.fullPath, 'utf8');
    const allLines = content.split('\n');
    const sIdx = Math.max(0, startLine - 1);
    const eIdx = Math.min(allLines.length, endLine);
    const slicedLines = allLines.slice(sIdx, eIdx);
    const closeScript = '</' + 'script>';
    const header = '<script data-file="' + resolved.relPath + '" data-lines="' + startLine + '-' + endLine + '">\n' + slicedLines.join('\n') + '\n' + closeScript;
    return {
      success: true,
      kind: 'LINES',
      filePath: resolved.relPath,
      range: `L${startLine}-L${endLine}`,
      lines: slicedLines.length,
      formattedText: header
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

LunoContextExtractor.extractClassSkeleton = function(relPath, targetClassName, rootDir) {
  const resolved = LunoContextExtractor.sanitizePath(relPath, rootDir);
  if (!resolved) {
    return { success: false, error: `File not found on disk: ${relPath}` };
  }
  try {
    const content = fs.readFileSync(resolved.fullPath, 'utf8');
    const LunoClassPatcher = require('./LunoClassPatcher.js');
    const ast = LunoClassPatcher.parseAST(content);
    const classNodes = LunoClassPatcher.findClassNodes(ast, targetClassName);

    if (classNodes.length === 0) {
      return { success: false, error: `No class matching "${targetClassName || 'any'}" found in ${resolved.relPath}` };
    }

    const skeletons = [];
    for (const cls of classNodes) {
      const clsName = Array.from(cls.names)[0] || 'AnonymousClass';
      const methodSignatures = [];

      if (cls.bodyNode && Array.isArray(cls.bodyNode.body)) {
        for (const member of cls.bodyNode.body) {
          if (!member || typeof member !== 'object') continue;
          let keyName = null;

          if (member.key) {
            if (member.key.type === 'Identifier') keyName = member.key.name;
            else if (member.key.type === 'PrivateIdentifier') keyName = '#' + member.key.name;
            else if (member.key.type === 'Literal') keyName = String(member.key.value);
          }

          if (!keyName) continue;

          const isStatic = Boolean(member.static);
          const kind = member.kind || 'method';
          const prefix = (isStatic ? 'static ' : '') + (kind === 'get' ? 'get ' : (kind === 'set' ? 'set ' : ''));

          let params = '';
          if (member.value && Array.isArray(member.value.params)) {
            params = member.value.params.map(p => {
              if (p.type === 'Identifier') return p.name;
              if (p.type === 'AssignmentPattern' && p.left && p.left.name) return p.left.name + ' = ...';
              if (p.type === 'RestElement' && p.argument && p.argument.name) return '...' + p.argument.name;
              return 'param';
            }).join(', ');
          }

          methodSignatures.push(`  ${prefix}${keyName}(${params}) { /* ... */ }`);
        }
      }

      skeletons.push(`class ${clsName} {\n${methodSignatures.join('\n')}\n}`);
    }

    const closeScript = '</' + 'script>';
    const header = '<script data-file="' + resolved.relPath + '" data-kind="SKELETON">\n' + skeletons.join('\n\n') + '\n' + closeScript;

    return {
      success: true,
      kind: 'SKELETON',
      filePath: resolved.relPath,
      className: targetClassName,
      formattedText: header
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

LunoContextExtractor.processRequestList = function(requests, rootDir) {
  requests = requests || [];
  const fulfilled = [];
  const textParts = [];

  for (const req of requests) {
    let result = null;
    const kind = (req.kind || 'FILE').toUpperCase();
    const targetPath = req.filePath || req.path;

    if (kind === 'METHOD' && req.targetSpec) {
      result = LunoContextExtractor.extractMethodContext(targetPath, req.targetSpec, rootDir);
    } else if (kind === 'LINES' && req.startLine && req.endLine) {
      result = LunoContextExtractor.extractLineRangeContext(targetPath, req.startLine, req.endLine, rootDir);
    } else if (kind === 'SKELETON') {
      result = LunoContextExtractor.extractClassSkeleton(targetPath, req.targetSpec, rootDir);
    } else {
      result = LunoContextExtractor.extractFileContext(targetPath, rootDir);
    }

    if (result && result.success) {
      textParts.push(result.formattedText);
    }
    fulfilled.push(result);
  }

  const bundledText = textParts.join('\n\n');
  return {
    success: true,
    fulfilled: fulfilled,
    bundledText: bundledText,
    estTokens: Math.ceil(bundledText.length / 4)
  };
};

if (typeof window !== 'undefined') window.LunoContextExtractor = LunoContextExtractor;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoContextExtractor;