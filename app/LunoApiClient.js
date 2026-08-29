class LunoApiClient {
  constructor() {}

  static isStaticMode() {
    if (typeof LunoFileSystem !== 'undefined') {
      return LunoFileSystem.isStaticHosting();
    }
    if (typeof LunoLoader !== 'undefined') {
      return LunoLoader.isStaticHosting();
    }
    return false;
  }

  static async safeJsonFetch(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      throw new Error('Endpoint returned HTML document instead of JSON (' + res.status + ') for: ' + url);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Server returned non-JSON response (' + res.status + '): ' + text.slice(0, 100));
    }
  }

  static async ping() {
    if (LunoApiClient.isStaticMode()) {
      return { status: 'online', mode: 'indexedDb-static', rootDir: 'Project Root', version: 'v3.6.6' };
    }
    try {
      return await LunoApiClient.safeJsonFetch('/api/ping');
    } catch(e) {
      return { status: 'offline', mode: 'indexedDb-static', rootDir: 'Project Root', version: 'v3.6.6' };
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
          const trimmed = content.trim();
          const isHtmlFile = filePath.toLowerCase().endsWith('.html') || filePath.toLowerCase().endsWith('.htm');
          if (!isHtmlFile && (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html'))) {
            return { success: false, error: 'File not found: ' + filePath };
          }
          if (adapter && adapter.write) {
            await adapter.write(filePath, content, project);
          }
          return { success: true, content, size: content.length };
        }
      } catch(fetchErr) {}
      return { success: false, error: 'File not found in storage: ' + filePath };
    }
    const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/fs/read?path=' + encodeURIComponent(filePath) + pParam);
  }

  static async fetchAllCode(project = '', includeLibrary = false) {
    const proj = project || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');

    if (!LunoApiClient.isStaticMode()) {
      try {
        const params = [];
        if (proj) params.push('project=' + encodeURIComponent(proj));
        if (includeLibrary) params.push('includeLibrary=true');
        const q = params.length > 0 ? ('?' + params.join('&')) : '';
        const data = await LunoApiClient.safeJsonFetch('/api/all-code' + q);
        if (data && data.success && data.filesMap && Object.keys(data.filesMap).length > 0) {
          return data;
        }
      } catch (serverErr) {
        console.warn('[LunoApiClient] /api/all-code fallback to manifest assembly:', serverErr.message);
      }
    }

    const manifest = [];
    const filesMap = {};

    let meta = {};
    try {
      const metaRes = await LunoApiClient.fetchFsRead('luno.json', proj);
      if (metaRes && metaRes.content) {
        meta = JSON.parse(metaRes.content);
      }
    } catch(e) {}

    const discovered = new Set(['luno.json', 'index.html']);
    [].concat(meta.main || []).forEach(p => { if (p) discovered.add(p); });
    [].concat(meta.styles || []).forEach(p => { if (p) discovered.add(p); });
    [].concat(meta.docs || []).forEach(p => { if (p) discovered.add(p); });
    [].concat(meta.files || []).forEach(p => { if (p) discovered.add(p); });
    if (meta.entrypoint && meta.entrypoint.file) discovered.add(meta.entrypoint.file);

    if (includeLibrary || proj.toLowerCase() === 'library') {
      [].concat(meta.library || []).forEach(p => {
        if (p) discovered.add(p.startsWith('Library/') ? p : ('Library/' + p));
      });
    }

    const fileList = Array.from(discovered);
    for (const rawFile of fileList) {
      let cleanRel = rawFile.replace(/\\/g, '/').replace(/^\/+/, '');
      if (cleanRel.startsWith('Luno Workspace/')) cleanRel = cleanRel.slice(15).trim();
      if (cleanRel.startsWith('./')) cleanRel = cleanRel.slice(2).trim();

      const readRes = await LunoApiClient.fetchFsRead(cleanRel, proj);
      if (readRes && readRes.success && readRes.content !== undefined) {
        let canonicalKey = cleanRel;
        if (!canonicalKey.startsWith('Library/') && !canonicalKey.startsWith(proj + '/')) {
          canonicalKey = proj + '/' + canonicalKey;
        }
        manifest.push(canonicalKey);
        filesMap[canonicalKey] = readRes.content;
      }
    }

    return {
      success: true,
      activeProjectName: proj,
      activeRootDir: LunoApiClient.isStaticMode() ? 'IndexedDB Storage' : 'Project Root',
      manifest: manifest,
      filesMap: filesMap
    };
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
        llmFeedback: '✅ Saved ' + modified + ' file(s) successfully.'
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
if (typeof module !== 'undefined' && module.exports) module.exports = LunoApiClient;