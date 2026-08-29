class LunoManifestDecisionEngine {
  constructor() {}

  static extractStartupPaths(manifestObj) {
    const meta = manifestObj || {};
    const paths = new Set();
    const normalize = (p) => p ? p.replace(/\\/g, '/').replace(/^\/+/, '').trim() : '';

    const mainList = [].concat(meta.main || []);
    const libList = [].concat(meta.library || []);
    const fileList = [].concat(meta.files || meta.local || []);

    mainList.forEach(p => {
      const n = normalize(p);
      if (n) {
        paths.add(n);
        if (n.startsWith('Luno/')) paths.add(n.slice(5));
        else paths.add('Luno/' + n);
      }
    });

    libList.forEach(p => {
      const n = normalize(p);
      if (n) {
        paths.add(n);
        if (!n.startsWith('Library/')) paths.add('Library/' + n);
      }
    });

    fileList.forEach(p => {
      const n = normalize(p);
      if (n) {
        paths.add(n);
        if (n.startsWith('Luno/')) paths.add(n.slice(5));
        else paths.add('Luno/' + n);
      }
    });

    return paths;
  }

  static isStartupClientFile(filePath, manifestObj) {
    if (!filePath || typeof filePath !== 'string') return false;
    const norm = filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();

    if (!norm.endsWith('.js') && !norm.endsWith('.mjs')) {
      return false;
    }

    if (
      norm.startsWith('app/') ||
      norm.startsWith('Luno/app/') ||
      norm.startsWith('browser/') ||
      norm.startsWith('Luno/browser/') ||
      norm.startsWith('docs/') ||
      norm.startsWith('Luno/docs/') ||
      norm.startsWith('core/') ||
      norm.startsWith('Luno/core/') ||
      norm.startsWith('test/') ||
      norm.startsWith('Luno/test/')
    ) {
      return true;
    }

    const startupPaths = LunoManifestDecisionEngine.extractStartupPaths(manifestObj);
    if (startupPaths.has(norm) || (norm.startsWith('Luno/') && startupPaths.has(norm.slice(5)))) {
      return true;
    }

    return false;
  }

  static async processPayload(payloadObj, manifestObj, projectName = '') {
    if (!payloadObj || !Array.isArray(payloadObj.files)) {
      return payloadObj;
    }

    const targetProj = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
    const processedFilesList = [];
    const fullFilesMap = new Map();
    const journalPatchBlocks = [];

    for (let i = 0; i < payloadObj.files.length; i++) {
      const f = payloadObj.files[i];
      if (!f || !f.filePath) continue;

      let normPath = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
      if (normPath.startsWith('Luno Workspace/')) normPath = normPath.slice(15).trim();
      if (normPath.startsWith('./')) normPath = normPath.slice(2).trim();

      if (!normPath.includes('/') && normPath !== 'LunoPatchLog.html') {
        normPath = targetProj + '/' + normPath;
      }

      const isSurgicalPatch = Boolean(f.methodSpec || f.action === 'patch' || f.action === 'delete');
      const isExplicitMerge = (f.action === 'merge');

      if (isExplicitMerge) {
        processedFilesList.push({
          tagName: f.tagName || 'script',
          filePath: normPath,
          action: 'merge',
          content: f.content || ''
        });
        continue;
      }

      if (!isSurgicalPatch) {
        fullFilesMap.set(normPath, f.content || '');
        continue;
      }

      // Surgical method patch: Record to patch journal block
      const tagWord = f.tagName || 'script';
      const safeContent = (f.content || '').split('</' + tagWord + '>').join('<\\/' + tagWord + '>');
      let block = '';
      if (f.action === 'delete') {
        block = '<' + tagWord + ' data-file="' + normPath + '" data-method="' + (f.methodSpec || '') + '" data-action="delete"></' + tagWord + '>';
      } else if (f.methodSpec) {
        block = '<' + tagWord + ' data-file="' + normPath + '" data-method="' + f.methodSpec + '" data-action="patch">\n' + safeContent + '\n</' + tagWord + '>';
      } else {
        block = '<' + tagWord + ' data-file="' + normPath + '" data-action="patch">\n' + safeContent + '\n</' + tagWord + '>';
      }
      journalPatchBlocks.push(block);

      // Perform runtime memory AST patch
      let baseContent = '';
      if (fullFilesMap.has(normPath)) {
        baseContent = fullFilesMap.get(normPath);
      } else if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
        let res = await LunoApiClient.fetchFsRead(normPath, targetProj);
        if (res && res.content !== undefined) {
          baseContent = res.content;
        }
      }

      if (baseContent && baseContent.trim() && globalThis.LunoClassPatcher) {
        try {
          let patched = baseContent;
          if (f.action === 'delete') {
            patched = globalThis.LunoClassPatcher.deleteMethodInSource(baseContent, f.methodSpec || normPath);
          } else {
            patched = globalThis.LunoClassPatcher.patchMethodInSource(baseContent, f.methodSpec || normPath, f.content);
          }
          fullFilesMap.set(normPath, patched);
        } catch(astErr) {
          console.warn('[LunoManifestDecisionEngine] AST memory patch notice:', astErr.message);
        }
      }
    }

    // Write updated base files
    fullFilesMap.forEach((content, filePath) => {
      processedFilesList.push({
        tagName: 'script',
        filePath: filePath,
        action: 'direct',
        content: content
      });
    });

    // Journal patches into LunoPatchLog.html
    if (journalPatchBlocks.length > 0) {
      let currentLog = '';
      try {
        if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
          let logRes = await LunoApiClient.fetchFsRead('LunoPatchLog.html', targetProj);
          if (logRes && logRes.success && logRes.content) {
            currentLog = logRes.content.trimEnd();
          }
        }
      } catch(e) {}

      const newLogContent = (currentLog ? currentLog + '\n\n' : '') + journalPatchBlocks.join('\n\n') + '\n';
      processedFilesList.push({
        tagName: 'script',
        filePath: 'LunoPatchLog.html',
        action: 'direct',
        content: newLogContent
      });
    }

    return {
      files: processedFilesList,
      serverScript: payloadObj.serverScript || '',
      requests: payloadObj.requests || [],
      debugLogs: payloadObj.debugLogs || [],
      project: targetProj
    };
  }
}

globalThis.LunoManifestDecisionEngine = LunoManifestDecisionEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoManifestDecisionEngine;