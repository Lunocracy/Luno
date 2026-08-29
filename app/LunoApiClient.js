class LunoApiClient {
  constructor() {}

  static isStaticMode() {
    if (typeof LunoFileSystem !== 'undefined' && LunoFileSystem.getActiveMode() !== 'server') {
      return true;
    }
    if (typeof LunoLoader !== 'undefined' && LunoLoader.isStaticHosting()) {
      return true;
    }
    return false;
  }

  static async safeJsonFetch(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Server returned non-JSON response (' + res.status + '): ' + text.slice(0, 100));
    }
  }

  static async ping() {
    if (LunoApiClient.isStaticMode()) {
      return { status: 'online', mode: 'indexedDb-static', rootDir: 'IndexedDB Virtual Root', version: 'v3.6.5-browser' };
    }
    try {
      return await LunoApiClient.safeJsonFetch('/api/ping');
    } catch(e) {
      return { status: 'offline', mode: 'indexedDb-static', rootDir: 'IndexedDB Virtual Root' };
    }
  }

  static async fetchProjectsList() {
    if (LunoApiClient.isStaticMode()) {
      const adapter = LunoFileSystem.getAdapter();
      if (adapter && adapter.listProjects) {
        return await adapter.listProjects();
      }
    }
    try {
      return await LunoApiClient.safeJsonFetch('/api/projects/list');
    } catch(e) {
      const adapter = LunoFileSystem.getAdapter();
      if (adapter && adapter.listProjects) return await adapter.listProjects();
      return { success: true, projects: [{ name: 'Luno' }, { name: 'Library' }] };
    }
  }

  static async fetchFsListRecursive(targetPath = '', project = '') {
    if (LunoApiClient.isStaticMode()) {
      const adapter = LunoFileSystem.getAdapter();
      if (adapter && adapter.list) {
        return await adapter.list(targetPath, project);
      }
    }
    try {
      const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
      return await LunoApiClient.safeJsonFetch('/api/fs/ls?recursive=true&path=' + encodeURIComponent(targetPath) + pParam);
    } catch(e) {
      const adapter = LunoFileSystem.getAdapter();
      if (adapter && adapter.list) return await adapter.list(targetPath, project);
      return { success: true, items: [] };
    }
  }

  static async fetchFsRead(filePath = '', project = '') {
    if (LunoApiClient.isStaticMode()) {
      const adapter = LunoFileSystem.getAdapter();
      if (adapter && adapter.read) {
        const r = await adapter.read(filePath, project);
        if (r.success) return r;
      }
      // Initial seed fallback: fetch base template/file from static GitHub Pages webroot
      try {
        const cleanPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
        const res = await fetch(cleanPath);
        if (res.ok) {
          const content = await res.text();
          if (adapter && adapter.write) {
            await adapter.write(filePath, content, project);
          }
          return { success: true, content, size: content.length };
        }
      } catch(fetchErr) {}
      return { success: false, error: 'File not found in local browser storage' };
    }
    const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/fs/read?path=' + encodeURIComponent(filePath) + pParam);
  }

  static async savePayload(payload, project = '') {
    let payloadObj = payload;
    if (typeof payload === 'string') {
      try { payloadObj = JSON.parse(payload); } catch (e) { payloadObj = { files: [], rawText: payload }; }
    }
    if (payloadObj && typeof payloadObj === 'object' && project) {
      payloadObj.project = project;
    }

    if (LunoApiClient.isStaticMode()) {
      const adapter = LunoFileSystem.getAdapter();
      let modified = 0;
      if (adapter && adapter.write && Array.isArray(payloadObj.files)) {
        for (const file of payloadObj.files) {
          if (file.filePath && file.content !== undefined) {
            await adapter.write(file.filePath, file.content, project || payloadObj.project);
            modified++;
          }
        }
      }
      return {
        success: true,
        count: modified,
        modifiedCount: modified,
        llmFeedback: `✅ Saved ${modified} file(s) directly to local IndexedDB Virtual Filesystem!`
      };
    }

    const pParam = project ? ('?project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/save' + pParam, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadObj)
    });
  }

  static async forkProject(sourceProject, newProject) {
    if (LunoApiClient.isStaticMode()) {
      const adapter = LunoFileSystem.getAdapter();
      if (adapter && adapter.fork) {
        return await adapter.fork(sourceProject, newProject);
      }
    }
    return await LunoApiClient.safeJsonFetch('/api/projects/fork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceProject, newProjectName: newProject })
    });
  }
}

globalThis.LunoApiClient = LunoApiClient;
if (typeof module !== "undefined" && module.exports) module.exports = LunoApiClient;