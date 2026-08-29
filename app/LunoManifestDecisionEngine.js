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

    for (let i = 0; i < payloadObj.files.length; i++) {
      const f = payloadObj.files[i];
      if (!f || !f.filePath) continue;

      let normPath = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();

      if (normPath.startsWith('Luno Workspace/')) {
        normPath = normPath.slice(15).trim();
      } else if (normPath.startsWith('./')) {
        normPath = normPath.slice(2).trim();
      }

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

      let baseContent = '';
      if (fullFilesMap.has(normPath)) {
        baseContent = fullFilesMap.get(normPath);
      } else if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
        let res = await LunoApiClient.fetchFsRead(normPath, targetProj);
        if (res && res.content !== undefined) {
          baseContent = res.content;
        }
      }

      if (!baseContent || !baseContent.trim()) {
        throw new Error(
          '[Luno AST Guard] Cannot surgically patch "' + normPath + '" (' + (f.methodSpec || 'method') + '): ' +
          'Target file does not exist in storage or is empty. Please provide the full file contents.'
        );
      }

      let classPatcher = globalThis.LunoClassPatcher;
      if (!classPatcher) {
        throw new Error(
          '[Luno AST Guard] LunoClassPatcher is not registered in global scope. Cannot execute AST method patch.'
        );
      }

      let consolidatedContent = baseContent;
      if (f.action === 'delete') {
        consolidatedContent = classPatcher.deleteMethodInSource(baseContent, f.methodSpec || normPath);
      } else {
        consolidatedContent = classPatcher.patchMethodInSource(baseContent, f.methodSpec || normPath, f.content);
      }

      fullFilesMap.set(normPath, consolidatedContent);
    }

    fullFilesMap.forEach((content, filePath) => {
      processedFilesList.push({
        tagName: 'script',
        filePath: filePath,
        action: 'direct',
        content: content
      });
    });

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