var lunoFileSystem = window.lunoFileSystem = function lunoFileSystem() {};

window.lunoFileSystem.activeMode = 'server';

window.lunoFileSystem.dirHandle = null;

window.lunoFileSystem.setMode = function(mode) {
    if (['server', 'webFsApi', 'indexedDb'].includes(mode)) {
      lunoFileSystem.activeMode = mode;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lunoActiveFsMode', mode);
      }
    }
  };


window.lunoFileSystem.getActiveMode = function() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('lunoActiveFsMode');
      if (saved) lunoFileSystem.activeMode = saved;
    }
    return lunoFileSystem.activeMode;
  };


window.lunoFileSystem.getAdapter = async function() {
    const mode = lunoFileSystem.getActiveMode();
    if (mode === 'webFsApi') return lunoWebFsApiAdapter;
    if (mode === 'indexedDb') return lunoIndexedDbAdapter;
    return lunoServerFsAdapter;
  };


window.lunoFileSystem.read = async function(filePath) {
    const adapter = await lunoFileSystem.getAdapter();
    return await adapter.read(filePath);
  };


window.lunoFileSystem.save = async function(filePath, content) {
    const adapter = await lunoFileSystem.getAdapter();
    return await adapter.save(filePath, content);
  };


window.lunoFileSystem.list = async function(dirPath = '') {
    const adapter = await lunoFileSystem.getAdapter();
    return await adapter.list(dirPath);
  };


if (typeof window !== 'undefined') window.lunoFileSystem = lunoFileSystem;
if (typeof module !== 'undefined' && module.exports) module.exports = lunoFileSystem;