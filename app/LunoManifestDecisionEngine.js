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
      norm.startsWith('Luno/core/')
    ) {
      return true;
    }

    const startupPaths = LunoManifestDecisionEngine.extractStartupPaths(manifestObj);
    if (startupPaths.has(norm) || (norm.startsWith('Luno/') && startupPaths.has(norm.slice(5)))) {
      return true;
    }

    return false;
  }

  /**
   * ⚙️ METHOD: processPayload(payloadObj, manifestObj, projectName)
   * Resolves incoming containers into direct writes, surgical AST patches, or patch journal entries.
   */
  static async processPayload(payloadObj, manifestObj, projectName = '') {
    if (!payloadObj || !Array.isArray(payloadObj.files)) {
      return payloadObj;
    }

    const targetProj = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
    const processedFiles = [];
    const KNOWN_PROJECTS = ['MySituation', 'Basic3D', 'VideoEditor', 'guessTheNoteGame', 'VideoPrepper', 'BasicsWithDialogBox', 'SimpleTest', 'Library', 'images', 'Luno'];

    for (let i = 0; i < payloadObj.files.length; i++) {
      const f = payloadObj.files[i];
      if (!f || !f.filePath) continue;

      let normPath = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();

      if (normPath.startsWith('Luno Workspace/')) {
        normPath = normPath.slice(15).trim();
      } else if (normPath.startsWith('./')) {
        normPath = normPath.slice(2).trim();
      }

      const firstSegment = normPath.split('/')[0];
      const startsWithKnownProject = KNOWN_PROJECTS.includes(firstSegment);

      if (
        normPath !== 'LunoPatchLog.html' &&
        !normPath.startsWith('Library/') &&
        !startsWithKnownProject &&
        !normPath.startsWith(targetProj + '/')
      ) {
        normPath = targetProj + '/' + normPath;
      }

      const isExplicitDirect = (f.action === 'direct');
      const isExplicitMerge = (f.action === 'merge');
      const isClientAsset = !isExplicitDirect && !isExplicitMerge && LunoManifestDecisionEngine.isStartupClientFile(normPath, manifestObj);

      if (isClientAsset) {
        processedFiles.push({
          tagName: 'script',
          filePath: normPath,
          methodSpec: f.methodSpec || '',
          action: f.action || 'write',
          content: f.content || ''
        });
      } else {
        if (f.methodSpec || f.action === 'patch' || f.action === 'delete') {
          let baseContent = '';
          if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
            let res = await LunoApiClient.fetchFsRead(normPath, targetProj);
            if (res && res.content !== undefined) {
              baseContent = res.content;
            }
          }

          if (!baseContent || !baseContent.trim()) {
            throw new Error(`[Luno AST Guard] Cannot apply surgical method patch to "${normPath}": Target file could not be read at strict path.`);
          }

          let classPatcher = globalThis.LunoClassPatcher;
          if (!classPatcher) {
            throw new Error(`[Luno AST Guard] LunoClassPatcher is not loaded in memory to patch "${normPath}".`);
          }

          let consolidatedContent = baseContent;
          if (f.action === 'delete') {
            consolidatedContent = classPatcher.deleteMethodInSource(baseContent, f.methodSpec || normPath);
          } else {
            consolidatedContent = classPatcher.patchMethodInSource(baseContent, f.methodSpec || normPath, f.content);
          }

          processedFiles.push({
            tagName: f.tagName || 'script',
            filePath: normPath,
            action: 'direct',
            content: consolidatedContent
          });
        } else {
          processedFiles.push({
            tagName: f.tagName || 'script',
            filePath: normPath,
            action: (f.action === 'delete' || f.action === 'merge') ? f.action : 'direct',
            content: f.content
          });
        }
      }
    }

    return {
      files: processedFiles,
      serverScript: payloadObj.serverScript || '',
      requests: payloadObj.requests || [],
      debugLogs: payloadObj.debugLogs || [],
      project: targetProj
    };
  }
}

globalThis.LunoManifestDecisionEngine = LunoManifestDecisionEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoManifestDecisionEngine;