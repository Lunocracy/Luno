class LunoApiClient {
  /**
   * ⚙️ CONSTRUCTOR: LunoApiClient()
   */
  constructor() {}

  /**
   * ⚙️ METHOD: safeJsonFetch(url, options)
   * - Type: Static Method
   * - Modifier: async
   */
  static async safeJsonFetch(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Server returned non-JSON response (' + res.status + '): ' + text.slice(0, 100));
    }
  }

  /**
   * ⚙️ METHOD: ping()
   * - Type: Static Method
   * - Modifier: async
   */
  static async ping() {
    return await LunoApiClient.safeJsonFetch('/api/ping');
  }

  /**
   * ⚙️ METHOD: fetchProjectsList()
   * - Type: Static Method
   * - Modifier: async
   */
  static async fetchProjectsList() {
    return await LunoApiClient.safeJsonFetch('/api/projects/list');
  }

  /**
   * ⚙️ METHOD: setProjectRoot(rootPath)
   * - Type: Static Method
   * - Modifier: async
   */
  static async setProjectRoot(rootPath) {
    return await LunoApiClient.safeJsonFetch('/api/fs/set-root', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rootPath })
    });
  }

  /**
   * ⚙️ METHOD: createProject(projectPath)
   * - Type: Static Method
   * - Modifier: async
   */
  static async createProject(projectPath) {
    return await LunoApiClient.safeJsonFetch('/api/fs/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath })
    });
  }

  /**
   * ⚙️ METHOD: fetchFsList(targetPath = '', project = '')
   * - Type: Static Method
   * - Modifier: async
   */
  static async fetchFsList(targetPath = '', project = '') {
    const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/fs/ls?path=' + encodeURIComponent(targetPath) + pParam);
  }

  /**
   * ⚙️ METHOD: fetchFsListRecursive(targetPath = '', project = '')
   * - Type: Static Method
   * - Modifier: async
   */
  static async fetchFsListRecursive(targetPath = '', project = '') {
    const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/fs/ls?recursive=true&path=' + encodeURIComponent(targetPath) + pParam);
  }

  /**
   * ⚙️ METHOD: fetchFsRead(filePath = '', project = '')
   * - Type: Static Method
   * - Modifier: async
   */
  static async fetchFsRead(filePath = '', project = '') {
    const pParam = project ? ('&project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/fs/read?path=' + encodeURIComponent(filePath) + pParam);
  }

  /**
   * ⚙️ METHOD: fetchAllCode(project = '')
   * - Type: Static Method
   * - Modifier: async
   */
  static async fetchAllCode(project = '') {
    const pParam = project ? ('?project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/all-code' + pParam);
  }

  /**
   * ⚙️ METHOD: savePayload(payload, project = '')
   * - Type: Static Method
   * - Modifier: async
   */
  static async savePayload(payload, project = '') {
    let payloadObj = payload;
    if (typeof payload === 'string') {
      try {
        payloadObj = JSON.parse(payload);
      } catch (e) {
        payloadObj = { files: [], rawText: payload };
      }
    }
    if (payloadObj && typeof payloadObj === 'object' && project) {
      payloadObj.project = project;
    }
    const pParam = project ? ('?project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/save' + pParam, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadObj)
    });
  }

  /**
   * ⚙️ METHOD: requestContext(requests = [], project = '')
   * - Type: Static Method
   * - Modifier: async
   */
  static async requestContext(requests = [], project = '') {
    const pParam = project ? ('?project=' + encodeURIComponent(project)) : '';
    return await LunoApiClient.safeJsonFetch('/api/context/request' + pParam, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests, project })
    });
  }
}

globalThis.LunoApiClient = LunoApiClient;
if (typeof module !== "undefined" && module.exports) module.exports = LunoApiClient;