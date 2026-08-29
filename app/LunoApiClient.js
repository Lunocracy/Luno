class LunoApiClient {
  constructor() {}

  static isStaticMode() {
    if (typeof LunoFileSystem !== 'undefined' && LunoFileSystem.isStaticHosting()) {
      return true;
    }
    if (typeof LunoLoader !== 'undefined' && LunoLoader.isStaticHosting()) {
      return true;
    }
    if (typeof LunoFileSystem !== 'undefined' && LunoFileSystem.getActiveMode() !== 'server') {
      return true;
    }
    return false;
  }

  static async safeJsonFetch(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
        throw new Error('Static host returned HTML instead of JSON (' + res.status + ') for endpoint: ' + url);
      }
      return JSON.parse(text);
    } catch (e) {
      if (e.message.includes('Static host returned HTML')) throw e;
      throw new Error('Server returned non-JSON response (' + res.status + '): ' + text.slice(0, 100));
    }
  }

  static async ping() {
    if (LunoApiClient.isStaticMode()) {
      return { status: 'online', mode: 'indexedDb-static', rootDir: 'IndexedDB Virtual Root', version: 'v3.6.6-static' };
    }
    try {
      return await LunoApiClient.safeJsonFetch('/api/ping');
    } catch(e) {
      return { status: 'offline', mode: 'indexedDb-static', rootDir: 'IndexedDB Virtual Root', version: 'v3.6.6-static' };
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
      try {
        const fetchUrl = (typeof LunoFileSystem !== 'undefined' && LunoFileSystem.resolveStaticUrl)
          ? LunoFileSystem.resolveStaticUrl(filePath, project)
          : ('./' + filePath.replace(/\\/g, '/').replace(/^\/+/, ''));

        const res = await fetch(fetchUrl);
        if (res.ok) {
          const content = await res.text();
          if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
            return { success: false, error: 'Static host returned 404 HTML for: ' + filePath };
          }
          if (adapter && adapter.write) {
            await adapter.write(filePath, content, project);
          }
          return { success: true, content, size: content.length };
        }
      } catch(fetchErr) {}
      return { success: false, error: 'File not found in local storage: ' + filePath };
    }
    const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/fs/read?path=' + encodeURIComponent(filePath) + pParam);
  }

  static async fetchAllCode(project = '', includeLibrary = false) {
    if (LunoApiClient.isStaticMode()) {
      const adapter = LunoFileSystem.getAdapter();
      const proj = project || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
      const manifest = [];
      const filesMap = {};

      if (adapter && adapter.list) {
        const listRes = await adapter.list('', proj);
        const items = (listRes && listRes.items) || [];
        for (const item of items) {
          const relPath = proj + '/' + item.relativePath;
          const readRes = await LunoApiClient.fetchFsRead(item.relativePath, proj);
          if (readRes && readRes.success && readRes.content !== undefined) {
            manifest.push(relPath);
            filesMap[relPath] = readRes.content;
          }
        }
      }

      if (includeLibrary && adapter && adapter.list && proj.toLowerCase() !== 'library') {
        const libListRes = await adapter.list('', 'Library');
        const libItems = (libListRes && libListRes.items) || [];
        for (const libItem of libItems) {
          const libRelPath = 'Library/' + libItem.relativePath;
          const libReadRes = await LunoApiClient.fetchFsRead(libItem.relativePath, 'Library');
          if (libReadRes && libReadRes.success && libReadRes.content !== undefined) {
            manifest.push(libRelPath);
            filesMap[libRelPath] = libReadRes.content;
          }
        }
      }

      return {
        success: true,
        activeProjectName: proj,
        activeRootDir: 'IndexedDB Virtual Root',
        manifest: manifest,
        filesMap: filesMap
      };
    }

    const params = [];
    if (project) params.push('project=' + encodeURIComponent(project));
    if (includeLibrary) params.push('includeLibrary=true');
    const q = params.length > 0 ? ('?' + params.join('&')) : '';
    return await LunoApiClient.safeJsonFetch('/api/all-code' + q);
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
        llmFeedback: '✅ Saved ' + modified + ' file(s) directly to local IndexedDB Virtual Filesystem!'
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