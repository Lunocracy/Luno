class LunoIndexedDbAdapter {
  static DB_NAME = 'luno_vfs_database';
  static STORE_FILES = 'files';
  static STORE_PROJECTS = 'projects';
  static db = null;

  static async getDb() {
    if (LunoIndexedDbAdapter.db) return LunoIndexedDbAdapter.db;
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not available in this environment.'));
      }
      const req = indexedDB.open(LunoIndexedDbAdapter.DB_NAME, 2);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(LunoIndexedDbAdapter.STORE_FILES)) {
          const fileStore = db.createObjectStore(LunoIndexedDbAdapter.STORE_FILES, { keyPath: 'id' });
          fileStore.createIndex('project', 'project', { unique: false });
          fileStore.createIndex('path', 'path', { unique: false });
        }
        if (!db.objectStoreNames.contains(LunoIndexedDbAdapter.STORE_PROJECTS)) {
          db.createObjectStore(LunoIndexedDbAdapter.STORE_PROJECTS, { keyPath: 'name' });
        }
      };
      req.onsuccess = (e) => {
        LunoIndexedDbAdapter.db = e.target.result;
        resolve(LunoIndexedDbAdapter.db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static normalizeKey(filePath, projectName) {
    const proj = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
    let clean = (filePath || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
    if (clean.startsWith('Luno Workspace/')) clean = clean.slice(15).trim();
    if (clean.startsWith('./')) clean = clean.slice(2).trim();

    if (clean.startsWith(proj + '/')) {
      clean = clean.slice(proj.length + 1);
    }
    return { id: proj + '::' + clean, project: proj, path: clean };
  }

  static async read(filePath, projectName) {
    const db = await LunoIndexedDbAdapter.getDb();
    const key = LunoIndexedDbAdapter.normalizeKey(filePath, projectName);
    return new Promise((resolve) => {
      const tx = db.transaction(LunoIndexedDbAdapter.STORE_FILES, 'readonly');
      const req = tx.objectStore(LunoIndexedDbAdapter.STORE_FILES).get(key.id);
      req.onsuccess = () => {
        if (req.result) {
          resolve({ success: true, content: req.result.content, size: req.result.content.length });
        } else {
          resolve({ success: false, error: 'File not found in IndexedDB: ' + key.path });
        }
      };
      req.onerror = () => resolve({ success: false, error: 'Read error' });
    });
  }

  static async write(filePath, content, projectName) {
    const db = await LunoIndexedDbAdapter.getDb();
    const key = LunoIndexedDbAdapter.normalizeKey(filePath, projectName);
    return new Promise((resolve, reject) => {
      const tx = db.transaction([LunoIndexedDbAdapter.STORE_FILES, LunoIndexedDbAdapter.STORE_PROJECTS], 'readwrite');
      const fileStore = tx.objectStore(LunoIndexedDbAdapter.STORE_FILES);
      const projStore = tx.objectStore(LunoIndexedDbAdapter.STORE_PROJECTS);

      fileStore.put({
        id: key.id,
        project: key.project,
        path: key.path,
        content: content !== undefined ? content : '',
        size: content ? content.length : 0,
        updatedAt: Date.now()
      });

      projStore.put({
        name: key.project,
        updatedAt: Date.now()
      });

      tx.oncomplete = () => resolve({ success: true, path: key.path, project: key.project });
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  static async list(targetPath = '', projectName = '') {
    const db = await LunoIndexedDbAdapter.getDb();
    const proj = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
    return new Promise((resolve) => {
      const tx = db.transaction(LunoIndexedDbAdapter.STORE_FILES, 'readonly');
      const store = tx.objectStore(LunoIndexedDbAdapter.STORE_FILES);
      const index = store.index('project');
      const req = index.getAll(proj);

      req.onsuccess = () => {
        const files = req.result || [];
        const cleanTarget = (targetPath || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
        const filtered = cleanTarget
          ? files.filter(f => f.path.startsWith(cleanTarget))
          : files;

        const items = filtered.map(f => ({
          name: f.path.split('/').pop(),
          relativePath: f.path,
          isDirectory: false,
          size: f.size || 0,
          mtimeMs: f.updatedAt || Date.now()
        }));
        resolve({ success: true, items });
      };
      req.onerror = () => resolve({ success: false, items: [] });
    });
  }

  static async listProjects() {
    const db = await LunoIndexedDbAdapter.getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(LunoIndexedDbAdapter.STORE_PROJECTS, 'readonly');
      const req = tx.objectStore(LunoIndexedDbAdapter.STORE_PROJECTS).getAll();
      req.onsuccess = () => {
        const projs = req.result || [];
        const results = projs.map(p => ({
          name: p.name,
          version: '1.0.0',
          description: 'Local IndexedDB application',
          fileCount: 0
        }));
        if (results.length === 0) {
          results.push({ name: 'Luno', version: '1.0.0', description: 'Workspace core', fileCount: 0 });
        }
        resolve({ success: true, projects: results });
      };
      req.onerror = () => resolve({ success: false, projects: [] });
    });
  }

  static async fork(sourceProject, newProject) {
    const db = await LunoIndexedDbAdapter.getDb();
    const filesRes = await LunoIndexedDbAdapter.list('', sourceProject);
    const sourceFiles = filesRes.items || [];

    const tx = db.transaction([LunoIndexedDbAdapter.STORE_FILES, LunoIndexedDbAdapter.STORE_PROJECTS], 'readwrite');
    const fileStore = tx.objectStore(LunoIndexedDbAdapter.STORE_FILES);
    const projStore = tx.objectStore(LunoIndexedDbAdapter.STORE_PROJECTS);

    let copiedCount = 0;
    for (const f of sourceFiles) {
      const oldKey = sourceProject + '::' + f.relativePath;
      const newKey = newProject + '::' + f.relativePath;

      const fileData = await new Promise(res => {
        fileStore.get(oldKey).onsuccess = (e) => res(e.target.result);
      });

      if (fileData) {
        let newContent = fileData.content;
        if (f.relativePath === 'luno.json') {
          try {
            const meta = JSON.parse(newContent);
            meta.name = newProject;
            newContent = JSON.stringify(meta, null, 2);
          } catch(e) {}
        }

        fileStore.put({
          id: newKey,
          project: newProject,
          path: f.relativePath,
          content: newContent,
          size: newContent.length,
          updatedAt: Date.now()
        });
        copiedCount++;
      }
    }

    projStore.put({ name: newProject, updatedAt: Date.now() });

    return {
      success: true,
      project: newProject,
      sourceProject: sourceProject,
      copiedFilesCount: copiedCount
    };
  }
}

class LunoWebFsApiAdapter {
  static dirHandle = null;

  static async pickDirectory() {
    if (typeof window === 'undefined' || !window.showDirectoryPicker) {
      throw new Error('File System Access API is not supported in this browser.');
    }
    LunoWebFsApiAdapter.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    return LunoWebFsApiAdapter.dirHandle;
  }

  static async getFileHandle(filePath, create = false) {
    if (!LunoWebFsApiAdapter.dirHandle) {
      await LunoWebFsApiAdapter.pickDirectory();
    }
    const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
    let curr = LunoWebFsApiAdapter.dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      curr = await curr.getDirectoryHandle(parts[i], { create });
    }
    return await curr.getFileHandle(parts[parts.length - 1], { create });
  }

  static async read(filePath) {
    try {
      const fileHandle = await LunoWebFsApiAdapter.getFileHandle(filePath, false);
      const file = await fileHandle.getFile();
      const content = await file.text();
      return { success: true, content, size: file.size };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }

  static async write(filePath, content) {
    try {
      const fileHandle = await LunoWebFsApiAdapter.getFileHandle(filePath, true);
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return { success: true, path: filePath };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }
}

class LunoFileSystem {
  constructor() {}

  static activeMode = (typeof localStorage !== 'undefined' && localStorage.getItem('lunoActiveFsMode')) || 'auto';

  static setMode(mode) {
    if (['auto', 'server', 'webFsApi', 'indexedDb'].includes(mode)) {
      LunoFileSystem.activeMode = mode;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lunoActiveFsMode', mode);
      }
    }
  }

  static isStaticHosting() {
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname || '';
      return host.endsWith('github.io') || host.endsWith('pages.dev') || window.location.protocol === 'file:';
    }
    return false;
  }

  static getActiveMode() {
    if (LunoFileSystem.activeMode === 'auto') {
      return LunoFileSystem.isStaticHosting() ? 'indexedDb' : 'server';
    }
    return LunoFileSystem.activeMode;
  }

  static getAdapter() {
    const mode = LunoFileSystem.getActiveMode();
    if (mode === 'webFsApi') return LunoWebFsApiAdapter;
    if (mode === 'indexedDb') return LunoIndexedDbAdapter;
    return null;
  }

  static normalizeRelativePath(filePath, projectName) {
    if (!filePath || typeof filePath !== 'string') return '';
    let clean = filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
    if (clean.startsWith('Luno Workspace/')) clean = clean.slice(15).trim();
    if (clean.startsWith('./')) clean = clean.slice(2).trim();

    const proj = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');

    if (LunoFileSystem.isStaticHosting()) {
      if (clean.startsWith(proj + '/')) {
        clean = clean.slice(proj.length + 1);
      }
      if (clean.startsWith('Luno/')) {
        clean = clean.slice(5);
      }
    }
    return clean;
  }

  static resolveStaticUrl(filePath, projectName) {
    const clean = LunoFileSystem.normalizeRelativePath(filePath, projectName);
    if (!clean.startsWith('./') && !clean.startsWith('../') && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      return './' + clean;
    }
    return clean;
  }
}

globalThis.LunoIndexedDbAdapter = LunoIndexedDbAdapter;
globalThis.LunoWebFsApiAdapter = LunoWebFsApiAdapter;
globalThis.LunoFileSystem = LunoFileSystem;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LunoFileSystem, LunoIndexedDbAdapter, LunoWebFsApiAdapter };
}