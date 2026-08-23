class LunoManifestDecisionEngine {
  constructor() {}

  /**
   * ⚙️ METHOD: extractStartupPaths(manifestObj)
   * - Type: Static Method
   * - Modifier: sync
   * Extracts all client startup asset paths declared in the active luno.json manifest.
   */
  static extractStartupPaths(manifestObj) {
    const meta = manifestObj || {};
    const paths = new Set();

    const normalize = (p) => p ? p.replace(/\\/g, '/').replace(/^\/+/, '').trim() : '';

    // Extract paths from standard manifest keys
    const mainList = [].concat(meta.main || []);
    const libList = [].concat(meta.library || []);
    const fileList = [].concat(meta.files || meta.local || []);

    mainList.forEach(p => { const n = normalize(p); if (n) paths.add(n); });
    libList.forEach(p => {
      const n = normalize(p);
      if (n) {
        paths.add(n);
        if (!n.startsWith('Library/')) paths.add('Library/' + n);
      }
    });
    fileList.forEach(p => { const n = normalize(p); if (n) paths.add(n); });

    if (meta.entrypoint && meta.entrypoint.file) {
      const n = normalize(meta.entrypoint.file);
      if (n) paths.add(n);
    }

    return paths;
  }

  /**
   * ⚙️ METHOD: extractServerPaths(manifestObj)
   * - Type: Static Method
   * - Modifier: sync
   * Extracts explicitly declared server/backend file paths from luno.json if present.
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
   * - Type: Static Method
   * - Modifier: sync
   * Pure manifest-driven decision logic:
   * 1. MUST be a JavaScript file (.js or .mjs). Non-JS files (HTML, CSS, JSON) are NEVER put in patch log.
   * 2. If explicitly declared in luno.json "server" array -> FALSE (Direct disk write)
   * 3. If declared in luno.json client lists -> TRUE (Routed to LunoPatchLog.html)
   * 4. Otherwise -> FALSE (Defaults to direct disk write for unlisted files)
   */
  static isStartupClientFile(filePath, manifestObj) {
    if (!filePath || typeof filePath !== 'string') return false;
    const norm = filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();

    // MANDATE: Only JavaScript files (.js, .mjs) can EVER be patch targets in LunoPatchLog.html
    if (!norm.endsWith('.js') && !norm.endsWith('.mjs')) {
      return false;
    }

    // 1. Check explicit server declarations in manifest
    const serverPaths = LunoManifestDecisionEngine.extractServerPaths(manifestObj);
    if (serverPaths.has(norm)) {
      return false;
    }

    // 2. Check client startup paths declared in manifest
    const startupPaths = LunoManifestDecisionEngine.extractStartupPaths(manifestObj);
    if (startupPaths.has(norm)) {
      return true;
    }

    // 3. Unlisted files default to direct disk write
    return false;
  }

  /**
   * ⚙️ METHOD: processPayload(payloadObj, manifestObj, projectName)
   * - Type: Static Method
   * - Modifier: async
   */
  static async processPayload(payloadObj, manifestObj, projectName = '') {
    if (!payloadObj || !Array.isArray(payloadObj.files)) {
      return payloadObj;
    }

    const processedFiles = [];

    for (let i = 0; i < payloadObj.files.length; i++) {
      const f = payloadObj.files[i];
      if (!f || !f.filePath) continue;

      const normPath = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
      const isExplicitDirect = (f.action === 'direct');
      const isClientAsset = !isExplicitDirect && LunoManifestDecisionEngine.isStartupClientFile(normPath, manifestObj);

      if (isClientAsset) {
        // Client JS startup asset declared in luno.json: keep in LunoPatchLog.html for playback
        processedFiles.push({
          tagName: 'script',
          filePath: normPath,
          methodSpec: f.methodSpec || '',
          action: f.action || 'write',
          content: f.content || ''
        });
      } else {
        // Non-client JS asset, server file, or non-JS file: Write directly to disk
        if (f.methodSpec || f.action === 'patch') {
          try {
            let baseContent = '';
            if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
              const res = await LunoApiClient.fetchFsRead(normPath, projectName);
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
              action: 'direct', // Signals LunoServer to write directly to disk
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
          // Direct file write
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
      debugLogs: payloadObj.debugLogs || []
    };
  }
}

globalThis.LunoManifestDecisionEngine = LunoManifestDecisionEngine;
if (typeof module !== "undefined" && module.exports) module.exports = LunoManifestDecisionEngine;