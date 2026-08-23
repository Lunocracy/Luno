class LunoRunner {
  constructor() {

  }

  static activeScripts = new Map();

  static async runScript(scriptPath) {

    try {
      const fileData = await LunoFileSystem.read(scriptPath);
      const code = fileData.content || '';

      if (!code.trim()) {
        console.warn('[LunoRunner] File empty or not found:', scriptPath);
        return { success: false, error: 'Empty script content' };
      }

      if (LunoRunner.activeScripts.has(scriptPath)) {
        const oldInfo = LunoRunner.activeScripts.get(scriptPath);
        if (oldInfo.scriptEl && oldInfo.scriptEl.parentNode) {
          oldInfo.scriptEl.parentNode.removeChild(oldInfo.scriptEl);
        }
        URL.revokeObjectURL(oldInfo.blobUrl);
      }

      const blob = new Blob([code], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      const scriptEl = document.createElement('script');
      scriptEl.src = blobUrl;
      scriptEl.dataset.lunoScriptPath = scriptPath;

      document.head.appendChild(scriptEl);
      LunoRunner.activeScripts.set(scriptPath, { scriptEl, blobUrl, path: scriptPath });

      return { success: true, scriptPath, blobUrl };
    } catch (err) {
      console.error('[LunoRunner Error] Failed to execute script:', scriptPath, err);
      return { success: false, error: err.message };
    }

  }
  static async preloadScriptList(scriptList = []) {

    for (const item of scriptList) {
      await LunoRunner.runScript(item);
    }

  }
}

globalThis.LunoRunner = LunoRunner;
if (typeof module !== "undefined" && module.exports) module.exports = LunoRunner;