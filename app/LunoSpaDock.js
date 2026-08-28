class LunoSpaDock {
  constructor() {}

  static activeDockView = (typeof localStorage !== 'undefined' && localStorage.getItem('luno_active_dock_view')) || 'workspace';
  static _iframeCache = {};

  static toggleDock(viewKey) {
    var vk = viewKey || 'browser';
    LunoSpaDock.activeDockView = vk;
    LunoSpaDock.mountView(vk);
  }

  static renderHeaderNav(viewKey) {
    if (typeof LunoSpaHeaderNav !== 'undefined') {
      return LunoSpaHeaderNav.render(viewKey);
    }
    var el = document.createElement('header');
    el.textContent = 'Luno Home';
    return el;
  }

  static reloadActivePreviewIframe(projectName) {
    var pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : '');
    if (!pName) return;

    if (!LunoSpaDock._iframeCache) {
      LunoSpaDock._iframeCache = {};
    }

    var iframeUrl = '/app-preview?project=' + encodeURIComponent(pName) + '&v=' + Date.now();
    var persistentAppRoot = document.getElementById('luno-persistent-app-root');

    if (persistentAppRoot) {
      if (LunoSpaDock._iframeCache[pName]) {
        var oldHolder = LunoSpaDock._iframeCache[pName];
        if (oldHolder && oldHolder.parentNode) {
          oldHolder.parentNode.removeChild(oldHolder);
        }
        delete LunoSpaDock._iframeCache[pName];
      }

      var newHolder = document.createElement('div');
      newHolder.id = 'iframe-holder-' + pName;
      newHolder.style.cssText = 'width:100%; height:100%; display:block;';
      newHolder.innerHTML = '<iframe src="' + iframeUrl + '" style="width:100%; height:100%; border:1px solid #30363d; border-radius:8px; background:#0d1117;" allow="fullscreen; autoplay; midi"></iframe>';

      persistentAppRoot.appendChild(newHolder);
      LunoSpaDock._iframeCache[pName] = newHolder;

      Object.entries(LunoSpaDock._iframeCache).forEach(function(entry) {
        if (entry[0] === pName) {
          entry[1].style.display = 'block';
        } else {
          entry[1].style.display = 'none';
        }
      });
    }

    var allIframes = document.querySelectorAll('iframe');
    allIframes.forEach(function(ifr) {
      try {
        if (ifr.src && (ifr.src.includes('project=' + encodeURIComponent(pName)) || ifr.src.includes('/' + pName + '/'))) {
          ifr.src = iframeUrl;
        }
      } catch (e) {}
    });
  }

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
      } else {
        targetProj = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';
      }

      var invalidNames = ['web', 'storage', 'emulated', 'LunoWeb', '0', 'Library'];
      if (!targetProj || invalidNames.includes(targetProj)) {
        targetProj = 'Luno';
      }

      if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
        ClientApp.setTargetProject(targetProj, { openTab: true });
      }
    }

    var navBar = LunoSpaDock.renderHeaderNav(viewKey);
    var contentArea = document.createElement('div');
    contentArea.id = 'luno-spa-content-area';
    contentArea.style.cssText = 'width:100%; min-height:82vh; position:relative;';

    container.appendChild(navBar);
    container.appendChild(contentArea);
    mainApp.appendChild(container);

    if (isAppView && targetProj) {
      var toolbar = document.createElement('div');
      toolbar.id = 'luno-app-preview-toolbar';
      toolbar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#161b22; border:1px solid #30363d; border-radius:8px; padding:0.45rem 0.75rem; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem; font-family:monospace;';

      var leftInfo = document.createElement('div');
      leftInfo.style.cssText = 'display:flex; align-items:center; gap:0.4rem; font-size:0.8rem;';
      leftInfo.innerHTML = '<span style="color:#00f2fe; font-weight:bold;">📱 App Preview:</span> <span style="color:#3fb950; font-weight:bold;">' + targetProj + '</span>';

      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex; gap:0.4rem; align-items:center;';

      var btnReload = document.createElement('button');
      btnReload.style.cssText = 'padding:0.3rem 0.65rem; background:#21262d; color:#00f2fe; border:1px solid #00f2fe; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:bold; font-family:monospace;';
      btnReload.innerHTML = '🔄 Reload';
      btnReload.title = 'Reload app preview iframe';
      btnReload.onclick = function() {
        LunoSpaDock.reloadActivePreviewIframe(targetProj);
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Refreshed [' + targetProj + '] preview!', 'info', '🔄');
        }
      };

      var btnNewTab = document.createElement('button');
      btnNewTab.style.cssText = 'padding:0.3rem 0.65rem; background:#238636; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:bold; font-family:monospace; box-shadow:0 2px 8px rgba(35,134,54,0.3);';
      btnNewTab.innerHTML = '↗ Open in New Window';
      btnNewTab.title = 'Open app in standalone browser tab or window';
      btnNewTab.onclick = function() {
        window.open('/app-preview?project=' + encodeURIComponent(targetProj), '_blank');
      };

      btnRow.appendChild(btnReload);
      btnRow.appendChild(btnNewTab);
      toolbar.appendChild(leftInfo);
      toolbar.appendChild(btnRow);
      contentArea.appendChild(toolbar);

      var rect = contentArea.getBoundingClientRect();
      var toolbarHeight = 44;
      var topPos = ((rect.top > 0 ? rect.top : 60) + toolbarHeight) + 'px';
      var leftPos = (rect.left > 0 ? rect.left : 10) + 'px';
      var widthPos = (rect.width > 0 ? rect.width : (window.innerWidth - 20)) + 'px';

      persistentAppRoot.style.top = topPos;
      persistentAppRoot.style.left = leftPos;
      persistentAppRoot.style.width = widthPos;
      persistentAppRoot.style.height = 'calc(82vh - ' + toolbarHeight + 'px)';
      persistentAppRoot.style.display = 'block';

      if (!LunoSpaDock._iframeCache[targetProj]) {
        LunoSpaDock.reloadActivePreviewIframe(targetProj);
      } else {
        Object.entries(LunoSpaDock._iframeCache).forEach(function(entry) {
          if (entry[0] === targetProj) {
            entry[1].style.display = 'block';
          } else {
            entry[1].style.display = 'none';
          }
        });
      }
    } else if (viewKey === 'projects' && typeof LunoProjectTemplates !== 'undefined' && typeof LunoProjectTemplates.mountFullPageView === 'function') {
      LunoProjectTemplates.mountFullPageView(contentArea);
    } else if (viewKey === 'deploy' && typeof LunoDeployEngine !== 'undefined' && typeof LunoDeployEngine.mountUI === 'function') {
      LunoDeployEngine.mountUI(contentArea);
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