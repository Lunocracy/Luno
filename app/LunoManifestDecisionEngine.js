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
      const patchMode = (typeof LunoSettings !== 'undefined' && LunoSettings.getPatchApplyMode)
        ? LunoSettings.getPatchApplyMode()
        : ((typeof localStorage !== 'undefined' && localStorage.getItem('luno_patch_apply_mode')) || 'direct');
  
      const isDirectAutoApply = (patchMode === 'direct');
      const processedFilesList = [];
      const fullFilesMap = new Map();
      const journalPatchBlocks = [];
      const patchActionsSummary = [];
  
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
  
        // 1. Client-Side JSON Merging
        if (isExplicitMerge && (normPath.endsWith('.json') || normPath.endsWith('.jsonc'))) {
          let baseJsonContent = '';
          if (fullFilesMap.has(normPath)) {
            baseJsonContent = fullFilesMap.get(normPath);
          } else if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
            try {
              let res = await LunoApiClient.fetchFsRead(normPath, targetProj);
              if (res && res.content !== undefined) {
                baseJsonContent = res.content;
              }
            } catch (e) {}
          }
  
          let existingObj = {};
          if (baseJsonContent && baseJsonContent.trim()) {
            try {
              existingObj = JSON.parse(baseJsonContent);
            } catch (e) {
              existingObj = {};
            }
          }
  
          let incomingObj = {};
          try {
            incomingObj = JSON.parse(f.content || '{}');
          } catch (e) {
            throw new Error('[Luno JSON Merge Guard] Invalid JSON syntax in merge payload for "' + normPath + '": ' + e.message);
          }
  
          for (const [k, v] of Object.entries(incomingObj)) {
            if (v === '__luno_delete__') {
              delete existingObj[k];
            } else if (Array.isArray(v) && Array.isArray(existingObj[k])) {
              const set = new Set(existingObj[k]);
              v.forEach(item => {
                if (item !== '__luno_delete__') set.add(item);
              });
              existingObj[k] = Array.from(set);
            } else if (v && typeof v === 'object' && !Array.isArray(v) && existingObj[k] && typeof existingObj[k] === 'object' && !Array.isArray(existingObj[k])) {
              Object.assign(existingObj[k], v);
            } else {
              existingObj[k] = v;
            }
          }
  
          const mergedContent = JSON.stringify(existingObj, null, 2) + '\n';
          fullFilesMap.set(normPath, mergedContent);
          patchActionsSummary.push({ path: normPath, mode: 'json-merge', target: normPath });
          continue;
        }
  
        // 2. Full Direct File Write
        if (!isSurgicalPatch) {
          fullFilesMap.set(normPath, f.content || '');
          patchActionsSummary.push({ path: normPath, mode: 'full-file', target: normPath });
          continue;
        }
  
        // 3. Surgical AST Method Patching / Journaling (100% Client-Side)
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
            '[Luno AST Guard] Cannot surgically patch "' + (f.methodSpec || normPath) + '": Base file "' + normPath + '" was not found in storage.'
          );
        }
  
        if (!globalThis.LunoClassPatcher) {
          throw new Error(
            '[Luno AST Guard] LunoClassPatcher is not loaded in client runtime. Cannot apply surgical patch for "' + (f.methodSpec || normPath) + '".'
          );
        }
  
        let patched = baseContent;
        try {
          if (f.action === 'delete') {
            patched = globalThis.LunoClassPatcher.deleteMethodInSource(baseContent, f.methodSpec || normPath);
          } else {
            patched = globalThis.LunoClassPatcher.patchMethodInSource(baseContent, f.methodSpec || normPath, f.content, { allowInsert: true });
          }
        } catch (astErr) {
          throw new Error(
            '[Luno AST Patch Failure] Failed to patch "' + (f.methodSpec || normPath) + '" in file "' + normPath + '":\n' + astErr.message
          );
        }
  
        // Post-splice AST validation pass right in browser memory
        if (normPath.endsWith('.js') || normPath.endsWith('.mjs')) {
          try {
            globalThis.LunoClassPatcher.parseAST(patched);
          } catch (syntaxErr) {
            throw new Error(
              '[Luno AST Post-Splice Guard] Syntax error generated while patching "' + (f.methodSpec || normPath) + '" in "' + normPath + '":\n' +
              syntaxErr.message + '\nPatch rejected to prevent file corruption.'
            );
          }
        }
  
        if (isDirectAutoApply) {
          fullFilesMap.set(normPath, patched);
          patchActionsSummary.push({
            path: normPath,
            mode: 'direct-ast-apply',
            target: f.methodSpec || normPath,
            action: f.action || 'patch'
          });
        } else {
          const tagWord = f.tagName || 'script';
          const safeContent = (f.content || '').split('</' + tagWord + '>').join('<\\/' + tagWord + '>');
          let block = '';
          if (f.action === 'delete') {
            block = '<' + tagWord + ' data-file="' + normPath + '" data-method="' + (f.methodSpec || '') + '" data-action="delete"></' + tagWord + '>';
          } else if (f.methodSpec) {
            block = '<' + tagWord + ' data-file="' + normPath + '" data-method="' + f.methodSpec + '" data-action="patch">\n' + safeContent + '\n</' + tagWord + '>';
          } else {
            block = '<' + tagWord + ' data-file="' + normPath + '" data-method="' + f.methodSpec + '" data-action="patch">\n' + safeContent + '\n</' + tagWord + '>';
          }
          journalPatchBlocks.push(block);
          patchActionsSummary.push({
            path: normPath,
            mode: 'patchlog-journal',
            target: f.methodSpec || normPath,
            action: f.action || 'patch'
          });
        }
      }
  
      fullFilesMap.forEach((content, filePath) => {
        processedFilesList.push({
          tagName: 'script',
          filePath: filePath,
          action: 'direct',
          content: content
        });
      });
  
      if (journalPatchBlocks.length > 0) {
        let currentLog = '';
        try {
          if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchFsRead) {
            let logRes = await LunoApiClient.fetchFsRead('LunoPatchLog.html', targetProj);
            if (logRes && logRes.success && logRes.content) {
              currentLog = logRes.content.trimEnd();
            }
          }
        } catch (e) {}
  
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
        project: targetProj,
        patchMode: patchMode,
        patchActionsSummary: patchActionsSummary
      };
    }
}

globalThis.LunoManifestDecisionEngine = LunoManifestDecisionEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoManifestDecisionEngine;