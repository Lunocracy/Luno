class LunoStateStore {
  /**
   * ⚙️ CONSTRUCTOR: LunoStateStore()
   */
  constructor() {

  }

  static DB_NAME = 'luno_workspace_db';
  static STORE_NAME = 'session_store';
  static db = null;

  /**
   * ⚙️ METHOD: init()
   * - Type: Static Method
   * - Modifier: async
   */
  static async init() {

    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(false);
        return;
      }
      const req = indexedDB.open(LunoStateStore.DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(LunoStateStore.STORE_NAME)) {
          db.createObjectStore(LunoStateStore.STORE_NAME);
        }
      };
      req.onsuccess = (e) => {
        LunoStateStore.db = e.target.result;
        resolve(true);
      };
      req.onerror = () => resolve(false);
    });

  }
  /**
   * ⚙️ METHOD: setItem(key, value)
   * - Type: Static Method
   * - Modifier: async
   */
  static async setItem(key, value) {

    if (!LunoStateStore.db) {
      try { localStorage.setItem('luno_store_' + key, JSON.stringify(value)); } catch (e) {}
      return;
    }
    try {
      const tx = LunoStateStore.db.transaction(LunoStateStore.STORE_NAME, 'readwrite');
      tx.objectStore(LunoStateStore.STORE_NAME).put(value, key);
    } catch (e) {}

  }
  /**
   * ⚙️ METHOD: getItem(key)
   * - Type: Static Method
   * - Modifier: async
   */
  static async getItem(key) {

    if (!LunoStateStore.db) {
      try {
        const raw = localStorage.getItem('luno_store_' + key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
    return new Promise((resolve) => {
      try {
        const tx = LunoStateStore.db.transaction(LunoStateStore.STORE_NAME, 'readonly');
        const req = tx.objectStore(LunoStateStore.STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });

  }
  /**
   * ⚙️ METHOD: clearDraft()
   * - Type: Static Method
   * - Modifier: async
   */
  static async clearDraft() {

    await LunoStateStore.setItem('editor_draft', '');

  }
  /**
   * ⚙️ METHOD: setupAutoSave(textareaElement)
   * - Type: Static Method
   * - Modifier: sync
   */
  static setupAutoSave(textareaElement) {

    if (!textareaElement) return;
    let timer = null;
    textareaElement.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const text = textareaElement.value;
        if (text && text.trim()) {
          LunoStateStore.setItem('editor_draft', text);
        } else {
          LunoStateStore.clearDraft();
        }
      }, 500);
    });

  }
  /**
   * ⚙️ METHOD: restoreSession()
   * - Type: Static Method
   * - Modifier: async
   */
  static async restoreSession() {

    const draft = await LunoStateStore.getItem('editor_draft');
    if (draft && draft.trim()) {
      const input = document.getElementById('code-input');
      if (input && !input.value.trim()) {
        input.value = draft;
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('✨ Recovered unsaved draft from previous session!', 'info', '↩️');
        }
      }
    }

  }
}

globalThis.LunoStateStore = LunoStateStore;
if (typeof module !== "undefined" && module.exports) module.exports = LunoStateStore;