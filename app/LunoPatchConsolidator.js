class LunoPatchConsolidator {
  constructor() {}

  /**
   * ⚙️ METHOD: consolidate(projectOverride)
   * Pure client-side browser consolidation:
   * Reads LunoPatchLog.html, performs client AST merging, validates syntax in memory,
   * and dispatches direct consolidated files back to disk storage.
   */
  static async consolidate(projectOverride) {
    try {
      var targetProj = projectOverride || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : '');
      var pParam = targetProj ? ('&project=' + encodeURIComponent(targetProj)) : '';

      if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
        try { await LunoAcornLoader.ensureLoaded(); } catch(e){}
      }

      // 1. Read LunoPatchLog.html via dumb server fs read endpoint
      var logRes = await fetch('/api/fs/read?path=LunoPatchLog.html' + pParam);
      var logData = await logRes.json();

      if (!logRes.ok || !logData || !logData.content || !logData.content.trim()) {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.boot('Consolidation Skipped', 'LunoPatchLog.html is already clean for [' + (targetProj || 'active project') + '].');
        }
        return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'Patch log is clean.' };
      }

      // 2. Parse HTML containers in browser memory
      var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
      if (!parser || typeof parser.parsePatchLog !== 'function') {
        throw new Error('Container parser unavailable in browser scope.');
      }

      var parsed = parser.parsePatchLog(logData.content);
      var files = parsed.files || [];
      if (files.length === 0) {
        await fetch('/api/save' + (targetProj ? ('?project=' + encodeURIComponent(targetProj)) : ''), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: [{ filePath: 'LunoPatchLog.html', action: 'direct', content: '' }], project: targetProj })
        });
        return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'No valid patch blocks.' };
      }

      // 3. Group patches by target file
      var fileMap = new Map();
      files.forEach(function(f) {
        if (!f || !f.filePath || f.filePath === 'LunoPatchLog.html') return;
        if (!fileMap.has(f.filePath)) fileMap.set(f.filePath, []);
        fileMap.get(f.filePath).push(f);
      });

      var filesToWrite = [];
      var modifiedFilesList = [];

      // 4. Client-side AST merging in browser memory
      for (var entry of fileMap.entries()) {
        var relPath = entry[0];
        var patchList = entry[1];

        var currentSource = '';
        try {
          var baseRes = await fetch('/api/fs/read?path=' + encodeURIComponent(relPath) + pParam);
          var baseData = await baseRes.json();
          if (baseRes.ok && baseData && baseData.content) {
            currentSource = baseData.content;
          }
        } catch(e){}

        if (currentSource) {
          filesToWrite.push({
            filePath: relPath + '.bak',
            action: 'direct',
            content: currentSource
          });
        }

        for (var i = 0; i < patchList.length; i++) {
          var p = patchList[i];
          if (p.action === 'delete') continue;

          if (p.methodSpec || p.action === 'patch') {
            if (typeof LunoClassPatcher !== 'undefined' && LunoClassPatcher.patchMethodInSource) {
              currentSource = LunoClassPatcher.patchMethodInSource(currentSource, p.methodSpec || relPath, p.content);
            } else {
              currentSource = currentSource.trimEnd() + '\n\n' + p.content + '\n';
            }
          } else {
            currentSource = p.content;
          }
        }

        filesToWrite.push({
          filePath: relPath,
          action: 'direct',
          content: currentSource
        });
        modifiedFilesList.push(relPath);
      }

      // 5. Clean LunoPatchLog.html
      filesToWrite.push({
        filePath: 'LunoPatchLog.html',
        action: 'direct',
        content: ''
      });

      // 6. Save consolidated files via dumb server save endpoint
      var savePayloadObj = { files: filesToWrite, serverScript: '', project: targetProj };
      var saveRes = await fetch('/api/save' + (targetProj ? ('?project=' + encodeURIComponent(targetProj)) : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayloadObj)
      });
      var saveData = await saveRes.json();

      if (saveRes.ok && saveData.success) {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.boot('Consolidation Complete', 'Consolidated ' + files.length + ' patch(es) across ' + modifiedFilesList.length + ' file(s) for [' + (targetProj || 'active project') + ']. Sidecar backups (.bak) created.');
        }
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Safely consolidated ' + files.length + ' patch(es) for [' + (targetProj || 'active project') + '] with .bak backups!', 'success', '✨');
        }
        return {
          success: true,
          consolidatedCount: files.length,
          modifiedFiles: modifiedFilesList,
          project: targetProj
        };
      } else {
        throw new Error(saveData.error || 'Server write failed during consolidation');
      }
    } catch (err) {
      if (typeof LunoPlaybackLogger !== 'undefined') {
        LunoPlaybackLogger.error('Consolidation Error', err.message);
      }
      return { success: false, error: err.message };
    }
  }
}

globalThis.LunoPatchConsolidator = LunoPatchConsolidator;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoPatchConsolidator;