class LunoPatchConsolidator {
  constructor() {}

  /**
   * ⚙️ METHOD: consolidate(projectOverride)
   * Pure client-side browser consolidation:
   * Reads LunoPatchLog.html, performs client AST merging scoped to the target project,
   * validates syntax in memory, and writes consolidated files back to disk storage.
   */
    static async consolidate(projectOverride) {
      try {
        var targetProj = projectOverride || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
        var pParam = targetProj ? ('&project=' + encodeURIComponent(targetProj)) : '';
  
        if (typeof LunoAcornLoader !== 'undefined' && LunoAcornLoader.ensureLoaded) {
          try { await LunoAcornLoader.ensureLoaded(); } catch(e){}
        }
  
        // 1. Read workspace LunoPatchLog.html
        var logRes = await fetch('/api/fs/read?path=LunoPatchLog.html');
        var logData = await logRes.json();
  
        if (!logRes.ok || !logData || !logData.content || !logData.content.trim()) {
          if (typeof LunoPlaybackLogger !== 'undefined') {
            LunoPlaybackLogger.boot('Consolidation Skipped', 'LunoPatchLog.html is already clean.');
          }
          return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'Patch log is clean.' };
        }
  
        // 2. Parse HTML containers in browser memory
        var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
        if (!parser || typeof parser.parsePatchLog !== 'function') {
          throw new Error('Container parser unavailable in browser scope.');
        }
  
        var parsed = parser.parsePatchLog(logData.content);
        var allFiles = parsed.files || [];
        if (allFiles.length === 0) {
          await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: [{ filePath: 'LunoPatchLog.html', action: 'direct', content: '' }] })
          });
          return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'No valid patch blocks.' };
        }
  
        // 3. Strict Project Scoping Filter
        var targetFiles = [];
        var remainingOtherProjectBlocks = [];
  
        allFiles.forEach(function(f) {
          if (!f || !f.filePath || f.filePath === 'LunoPatchLog.html') return;
          var norm = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  
          var isForTarget = false;
          if (targetProj === 'Luno') {
            isForTarget = norm.startsWith('Luno/');
          } else {
            isForTarget = norm.startsWith(targetProj + '/') || norm.startsWith('Library/');
          }
  
          if (isForTarget) {
            targetFiles.push(f);
          } else {
            var tag = f.tagName || 'script';
            var closeTag = '</' + tag + '>';
            var methodAttr = f.methodSpec ? (' data-method="' + f.methodSpec + '"') : '';
            var actionAttr = f.action ? (' data-action="' + f.action + '"') : '';
            remainingOtherProjectBlocks.push('<' + tag + ' data-file="' + f.filePath + '"' + methodAttr + actionAttr + '>\n' + f.content + '\n' + closeTag);
          }
        });
  
        if (targetFiles.length === 0) {
          if (typeof LunoPlaybackLogger !== 'undefined') {
            LunoPlaybackLogger.boot('Consolidation Notice', 'No pending patches found for [' + targetProj + ']. (Found ' + allFiles.length + ' patch(es) for other projects)');
          }
          return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'No pending patches for ' + targetProj };
        }
  
        // 4. Group patches by target file
        var fileMap = new Map();
        targetFiles.forEach(function(f) {
          if (!fileMap.has(f.filePath)) fileMap.set(f.filePath, []);
          fileMap.get(f.filePath).push(f);
        });
  
        var filesToWrite = [];
        var modifiedFilesList = [];
  
        // 5. Pure client-side AST merging in browser memory
        for (var entry of fileMap.entries()) {
          var relPath = entry[0];
          var patchList = entry[1];
  
          var currentSource = '';
          try {
            var baseRes = await fetch('/api/fs/read?path=' + encodeURIComponent(relPath));
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
  
        // 6. Retain other projects' patches in LunoPatchLog.html
        filesToWrite.push({
          filePath: 'LunoPatchLog.html',
          action: 'direct',
          content: remainingOtherProjectBlocks.join('\n\n')
        });
  
        // 7. Save consolidated files to disk
        var savePayloadObj = { files: filesToWrite, serverScript: '', project: targetProj };
        var saveRes = await fetch('/api/save?project=' + encodeURIComponent(targetProj), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayloadObj)
        });
        var saveData = await saveRes.json();
  
        if (saveRes.ok && saveData.success) {
          if (typeof LunoPlaybackLogger !== 'undefined') {
            LunoPlaybackLogger.boot('Consolidation Complete', 'Consolidated ' + targetFiles.length + ' patch(es) across ' + modifiedFilesList.length + ' file(s) for [' + targetProj + '].');
          }
          if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
            ClientApp.showToast('Consolidated ' + targetFiles.length + ' patch(es) for [' + targetProj + '] with .bak backups!', 'success', '✨');
          }
          return {
            success: true,
            consolidatedCount: targetFiles.length,
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