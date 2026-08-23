class LunoSpaDock {
  /**
   * ⚙️ CONSTRUCTOR: LunoSpaDock()
   */
  constructor() {

  }

  static activeDockView = (typeof localStorage !== 'undefined' && localStorage.getItem('luno_active_dock_view')) || 'workspace';
  static _iframeCache = {};

  /**
   * ⚙️ METHOD: toggleDock(viewKey)
   * - Type: Static Method
   * - Modifier: sync
   */
  static toggleDock(viewKey) {

    var vk = viewKey || 'browser';
    LunoSpaDock.activeDockView = vk;
    LunoSpaDock.mountView(vk);

  }
  /**
   * ⚙️ METHOD: renderHeaderNav(viewKey)
   * - Type: Static Method
   * - Modifier: sync
   */
  static renderHeaderNav(viewKey) {

    if (typeof LunoSpaHeaderNav !== 'undefined') {
      return LunoSpaHeaderNav.render(viewKey);
    }
    var el = document.createElement('header');
    el.textContent = 'Luno Home';
    return el;

  }
  /**
   * ⚙️ METHOD: mountView(viewKey)
   * - Type: Static Method
   * - Modifier: sync
   */
  static mountView(viewKey) {

    LunoSpaDock.activeDockView = viewKey;
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('luno_active_dock_view', viewKey); } catch (e) {}
    }
    var mainApp = document.getElementById('app-root') || document.body;
    if (!mainApp) return;

    if (!LunoSpaDock._iframeCache) {
      LunoSpaDock._iframeCache = {};
    }

    var persistentAppRoot = document.getElementById('luno-persistent-app-root');
    if (!persistentAppRoot) {
      persistentAppRoot = document.createElement('div');
      persistentAppRoot.id = 'luno-persistent-app-root';
      persistentAppRoot.style.cssText = 'display:none; position:fixed; z-index:8000; box-sizing:border-box;';
      document.body.appendChild(persistentAppRoot);
    }

    var isAppView = viewKey.startsWith('app_') || viewKey === 'app';

    if (!isAppView) {
      persistentAppRoot.style.display = 'none';
      Object.values(LunoSpaDock._iframeCache).forEach(function(holder) {
        if (holder && holder.style) holder.style.display = 'none';
      });

      if (viewKey === 'workspace') {
        if (typeof ClientAppUI !== 'undefined') {
          ClientAppUI.renderOutboxFirstLayout(mainApp);
        }
        return;
      }
    }

    mainApp.innerHTML = '';
    var container = document.createElement('div');
    container.id = 'luno-spa-view-container';
    container.style.cssText = 'font-family:monospace; padding:0.6rem; max-width:960px; margin:0 auto; min-height:100vh; background:#0d1117; color:#c9d1d9; box-sizing:border-box;';

    var targetProj = '';
    if (isAppView) {
      if (viewKey.startsWith('app_')) {
        targetProj = viewKey.replace(/^app_/, '');
      } else if (typeof localStorage !== 'undefined') {
        targetProj = localStorage.getItem('luno_active_app_proj') || '';
      }

      var invalidNames = (typeof LunoSettings !== 'undefined' && LunoSettings.INVALID_PROJECT_NAMES) ? LunoSettings.INVALID_PROJECT_NAMES : ['web', 'Luno', 'storage', 'emulated', 'LunoWeb', '0'];
      if (!targetProj || invalidNames.includes(targetProj)) {
        targetProj = (typeof localStorage !== 'undefined' && localStorage.getItem('luno_active_app_proj')) || 'Basic3D';
        if (invalidNames.includes(targetProj)) targetProj = 'Basic3D';
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('luno_active_app_proj', targetProj);
      }

      if (typeof LunoSpaHeaderNav !== 'undefined' && targetProj) {
        LunoSpaHeaderNav.openProjectTab(targetProj);
      }
    }

    var navBar = LunoSpaDock.renderHeaderNav(viewKey);
    var contentArea = document.createElement('div');
    contentArea.id = 'luno-spa-content-area';
    contentArea.style.cssText = 'width:100%; min-height:82vh;';

    container.appendChild(navBar);
    container.appendChild(contentArea);
    mainApp.appendChild(container);

    if (isAppView && targetProj) {
      var rect = contentArea.getBoundingClientRect();
      var topPos = (rect.top > 0 ? rect.top : 60) + 'px';
      var leftPos = (rect.left > 0 ? rect.left : 10) + 'px';
      var widthPos = (rect.width > 0 ? rect.width : (window.innerWidth - 20)) + 'px';

      persistentAppRoot.style.top = topPos;
      persistentAppRoot.style.left = leftPos;
      persistentAppRoot.style.width = widthPos;
      persistentAppRoot.style.height = '82vh';
      persistentAppRoot.style.display = 'block';

      var iframeUrl = '/app-preview?project=' + encodeURIComponent(targetProj);

      if (!LunoSpaDock._iframeCache[targetProj]) {
        var holder = document.createElement('div');
        holder.id = 'iframe-holder-' + targetProj;
        holder.style.cssText = 'width:100%; height:100%; display:block;';
        holder.innerHTML = '<iframe src="' + iframeUrl + '" style="width:100%; height:100%; border:1px solid #30363d; border-radius:8px; background:#0d1117;"></iframe>';
        persistentAppRoot.appendChild(holder);
        LunoSpaDock._iframeCache[targetProj] = holder;
      }

      Object.entries(LunoSpaDock._iframeCache).forEach(function(entry) {
        if (entry[0] === targetProj) {
          entry[1].style.display = 'block';
        } else {
          entry[1].style.display = 'none';
        }
      });

      if (typeof DiskBrowser !== 'undefined') {
        DiskBrowser.currentPath = '/storage/emulated/0/Luno/web/' + targetProj;
      }
    } else if (viewKey === 'projects' && typeof LunoProjectTemplates !== 'undefined' && typeof LunoProjectTemplates.mountFullPageView === 'function') {
      LunoProjectTemplates.mountFullPageView(contentArea);
    } else if (viewKey === 'checkpoint') {
      if (typeof LunoCheckpointView !== 'undefined' && typeof LunoCheckpointView.mountUI === 'function') {
        LunoCheckpointView.mountUI(contentArea);
      } else {
        if (typeof localStorage !== 'undefined') localStorage.setItem('luno_active_dock_view', 'workspace');
        if (typeof ClientAppUI !== 'undefined') ClientAppUI.renderOutboxFirstLayout(mainApp);
      }
    } else if (viewKey === 'browser' && typeof DiskBrowser !== 'undefined') {
      DiskBrowser.mountUI(contentArea);
    } else if (viewKey === 'docs' && typeof LunoDocs !== 'undefined') {
      LunoDocs.mountUI(contentArea);
    } else if (viewKey === 'test' && typeof LunoTestRunner !== 'undefined') {
      LunoTestRunner.mountUI(contentArea);
    }

  }
}

globalThis.LunoSpaDock = LunoSpaDock;
if (typeof module !== "undefined" && module.exports) module.exports = LunoSpaDock;