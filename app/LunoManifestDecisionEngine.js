class LunoManifestDecisionEngine {
  constructor() {}

  /**
   * ⚙️ METHOD: extractStartupPaths(manifestObj)
   */
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
  
    if (meta.entrypoint && meta.entrypoint.file) {
      const n = normalize(meta.entrypoint.file);
      if (n) {
        paths.add(n);
        if (n.startsWith('Luno/')) paths.add(n.slice(5));
        else paths.add('Luno/' + n);
      }
    }
  
    return paths;
  }

  /**
   * ⚙️ METHOD: extractServerPaths(manifestObj)
   */
  static extractServerPaths(manifestObj) {
    const meta = manifestObj || {};
    const paths = new Set();
    const normalize = (p) => p ? p.replace(/\\/g, '/').replace(/^\/+/, '').trim() : '';

    const serverList = [].concat(meta.server || meta.backend || []);
    serverList.forEach(p => { const n = normalize(p); if (n) paths.add(n); });

    return paths;
  }

  /**
   * ⚙️ METHOD: isStartupClientFile(filePath, manifestObj)
   */
    static isStartupClientFile(filePath, manifestObj) {
    if (!filePath || typeof filePath !== 'string') return false;
    const norm = filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
  
    if (!norm.endsWith('.js') && !norm.endsWith('.mjs')) {
      return false;
    }
  
    const serverPaths = LunoManifestDecisionEngine.extractServerPaths(manifestObj);
    if (serverPaths.has(norm) || (norm.startsWith('Luno/') && serverPaths.has(norm.slice(5)))) {
      return false;
    }
  
    const startupPaths = LunoManifestDecisionEngine.extractStartupPaths(manifestObj);
    if (startupPaths.has(norm) || (norm.startsWith('Luno/') && startupPaths.has(norm.slice(5)))) {
      return true;
    }
  
    return false;
  }

  /**
   * ⚙️ METHOD: processPayload(payloadObj, manifestObj, projectName)
   * Surgically scopes file classification, AST base reads, and direct writes
   * to the targeted project directory.
   */
  static async processPayload(payloadObj, manifestObj, projectName = '') {
    if (!payloadObj || !Array.isArray(payloadObj.files)) {
      return payloadObj;
    }

    const targetProj = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : '');
    const processedFiles = [];

    for (let i = 0; i < payloadObj.files.length; i++) {
      const f = payloadObj.files[i];
      if (!f || !f.filePath) continue;

      const normPath = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
      const isExplicitDirect = (f.action === 'direct');
      const isClientAsset = !isExplicitDirect && LunoManifestDecisionEngine.isStartupClientFile(normPath, manifestObj);

      if (isClientAsset) {
        processedFiles.push({
          tagName: 'script',
          filePath: normPath,
          methodSpec: f.methodSpec || '',
          action: f.action || 'write',
          content: f.content || ''
        });
      } else {
        if (f.methodSpec || f.action === 'patch') {
          try {
            let baseContent = '';
            if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
              const res = await LunoApiClient.fetchFsRead(normPath, targetProj);
              if (res && res.content) baseContent = res.content;
            }

            let consolidatedContent = baseContent;
            if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.patchMethodInSource) {
              consolidatedContent = LunoClassPatcher.patchMethodInSource(baseContent, f.methodSpec || normPath, f.content);
            } else {
              consolidatedContent = baseContent.trimEnd() + '\n\n' + f.content + '\n';
            }

            processedFiles.push({
              tagName: f.tagName || 'script',
              filePath: normPath,
              action: 'direct',
              content: consolidatedContent
            });
          } catch (err) {
            processedFiles.push({
              tagName: f.tagName || 'script',
              filePath: normPath,
              action: 'direct',
              content: f.content
            });
          }
        } else {
          processedFiles.push({
            tagName: f.tagName || 'script',
            filePath: normPath,
            action: f.action === 'delete' ? 'delete' : 'direct',
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
if (typeof module !== "undefined" && module.exports) module.exports = LunoManifestDecisionEngine;