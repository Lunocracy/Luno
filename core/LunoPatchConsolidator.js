const fs = require('fs');
const path = require('path');

class LunoPatchConsolidator {
  constructor() {}

  /**
   * Reads pending patches from LunoPatchLog.html, applies them to base files on disk,
   * consolidates assignments using LunoLinePatcher, and resets LunoPatchLog.html.
   */
  static consolidate(rootDir) {
    const activeRoot = rootDir || process.cwd();
    const patchLogPath = path.join(activeRoot, 'LunoPatchLog.html');

    if (!fs.existsSync(patchLogPath)) {
      return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'LunoPatchLog.html does not exist.' };
    }

    const logContent = fs.readFileSync(patchLogPath, 'utf8').trim();
    if (!logContent) {
      return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'LunoPatchLog.html is clean/empty.' };
    }

    // Load payload parser helper
    let parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
    if (!parser && typeof require !== 'undefined') {
      try {
        parser = require(path.join(activeRoot, 'app', 'LunoPayloadParser.js'));
      } catch (e) {
        try { parser = require(path.join(activeRoot, 'app', 'LunoContainerParser.js')); } catch (e2) {}
      }
    }

    if (!parser || typeof parser.parse !== 'function') {
      throw new Error('Container parser unavailable for patch consolidation.');
    }

    const parsed = parser.parse(logContent);
    const files = parsed.files || [];
    if (files.length === 0) {
      fs.writeFileSync(patchLogPath, '', 'utf8');
      return { success: true, consolidatedCount: 0, modifiedFiles: [], note: 'No valid patch blocks in log.' };
    }

    // Load line patcher helper
    let linePatcher = globalThis.LunoLinePatcher;
    if (!linePatcher && typeof require !== 'undefined') {
      try {
        linePatcher = require(path.join(activeRoot, 'app', 'LunoLinePatcher.js'));
      } catch (e) {}
    }

    const modifiedSet = new Set();

    for (const f of files) {
      const relPath = f.filePath;
      if (!relPath || relPath === 'LunoPatchLog.html') continue;

      const fullPath = path.resolve(activeRoot, relPath);
      if (!fs.existsSync(fullPath)) {
        if (f.action === 'write' && !f.methodSpec) {
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, f.content, 'utf8');
          modifiedSet.add(relPath);
        }
        continue;
      }

      let currentSource = fs.readFileSync(fullPath, 'utf8');

      if (f.action === 'delete') {
        continue;
      }

      if (f.methodSpec || f.action === 'patch') {
        if (linePatcher && typeof linePatcher.appendPatch === 'function') {
          const patchResult = linePatcher.appendPatch(currentSource, f.methodSpec, f.content, { hotPatch: false });
          currentSource = patchResult.updatedSource;
        } else {
          currentSource = currentSource.trimEnd() + '\n\n' + f.content + '\n';
        }
      } else {
        currentSource = f.content;
      }

      // Deduplicate and consolidate method assignments
      if (linePatcher && typeof linePatcher.consolidate === 'function') {
        currentSource = linePatcher.consolidate(currentSource);
      }

      fs.writeFileSync(fullPath, currentSource, 'utf8');
      modifiedSet.add(relPath);
    }

    // Wipe LunoPatchLog.html to clean state after successful consolidation
    fs.writeFileSync(patchLogPath, '', 'utf8');

    return {
      success: true,
      consolidatedCount: files.length,
      modifiedFiles: Array.from(modifiedSet)
    };
  }
}

globalThis.LunoPatchConsolidator = LunoPatchConsolidator;
if (typeof module !== "undefined" && module.exports) module.exports = LunoPatchConsolidator;