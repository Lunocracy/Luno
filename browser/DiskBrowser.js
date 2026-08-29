class DiskBrowser {
  constructor() {}

  static currentPath = "";
  static parentPath = "";
  static browserMode = "project";
  static viewMode = "flat";
  static sortBy = "size";
  static sortDirection = "desc";
  static searchQuery = "";
  static flatFilesList = [];
  static directoriesList = [];
  static selectedFiles = new Set();
  static fileContentCache = {};
  static activeManifest = { main: [], local: [], library: [] };
  static projectsList = [];

  static showToast(message, type, icon) {
    if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
      ClientApp.showToast(message, type || 'info', icon || '✨');
    }
  }

  static formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  static formatTailPath(fullPath, maxChars) {
    if (!fullPath || typeof fullPath !== 'string') return '';
    var limit = maxChars || 28;
    var norm = fullPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (norm.startsWith('Luno Workspace/')) norm = norm.slice(15).trim();

    if (norm.startsWith('Luno/')) norm = norm.slice(5);

    var parts = norm.split('/');
    if (parts.length <= 1) {
      return '';
    }

    var dirPart = parts.slice(0, -1).join('/');
    if (dirPart.length <= limit) {
      return dirPart + '/';
    }

    var tail = dirPart.slice(-limit + 4);
    var slashIdx = tail.indexOf('/');
    if (slashIdx !== -1 && slashIdx < 12) {
      tail = tail.slice(slashIdx);
    }
    return '...' + tail + '/';
  }

  static sortItems(itemsList, sortBy, sortDirection) {
    var mode = sortBy || DiskBrowser.sortBy || 'size';
    var dir = sortDirection || DiskBrowser.sortDirection || 'desc';
    var mult = dir === 'asc' ? 1 : -1;

    return itemsList.slice().sort(function(a, b) {
      if (mode === 'size') {
        var sizeA = a.size || 0;
        var sizeB = b.size || 0;
        if (sizeA !== sizeB) return (sizeA - sizeB) * mult;
        return a.name.localeCompare(b.name);
      } else if (mode === 'ext') {
        var extA = (a.name.split('.').pop() || '').toLowerCase();
        var extB = (b.name.split('.').pop() || '').toLowerCase();
        if (extA !== extB) return extA.localeCompare(extB) * mult;
        return a.name.localeCompare(b.name);
      } else {
        return a.name.localeCompare(b.name) * mult;
      }
    });
  }

  static makeElement(...args) {
    if (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement) {
      return LunoUIComponents.makeElement(...args);
    }
    var el = document.createElement(args[0] || 'div');
    return el;
  }

  static renderHeader(activeProjName) {
    var m = DiskBrowser.makeElement;
    var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

    var validProjects = DiskBrowser.projectsList.filter(function(p) {
      return !p.isLibrary && p.name.toLowerCase() !== 'library';
    });

    var projectOptions = validProjects.map(function(p) {
      var isCurrent = (p.name === currentTarget);
      var displayLabel = p.name === 'Luno' ? 'Luno (Core)' : p.name;
      return m('option', {
        value: p.name,
        selected: isCurrent
      }, '📁 ' + displayLabel + ' (' + (p.fileCount || 0) + ' files)');
    });

    var projectSelect = m('select', {
      style: {
        background: '#0d1117', color: '#00f2fe', border: '1px solid #00f2fe',
        padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem',
        fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer', outline: 'none'
      },
      onchange: async function(e) {
        var targetName = e.target.value;
        if (targetName && typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
          ClientApp.setTargetProject(targetName);
          DiskBrowser.currentPath = '';
          DiskBrowser.selectedFiles.clear();
          DiskBrowser.fileContentCache = {};
          var mainRoot = document.getElementById('luno-spa-content-area') || document.body;
          await DiskBrowser.mountUI(mainRoot);
        }
      }
    }, projectOptions);

    return m('header', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #30363d', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }
    },
      m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' } },
        m('h1', { style: { color: '#00f2fe', fontSize: '1.1rem', margin: '0', display: 'flex', alignItems: 'center', gap: '0.3rem' } }, '🛠️ Files & Disk Navigation'),
        m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.3rem' } },
          m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Target Project:'),
          projectSelect
        )
      ),
      m('div', { style: { display: 'flex', gap: '0.3rem', flexWrap: 'wrap' } },
        m('button', {
          style: { padding: '0.35rem 0.65rem', background: '#238636', color: '#fff', border: '1px solid #3fb950', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
          onclick: function() { DiskBrowser.loadDirectory(); }
        }, 'Refresh')
      )
    );
  }

  static async mountUI(container) {
    if (!container) return;
    container.innerHTML = '';

    var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

    await Promise.all([
      DiskBrowser.loadActiveManifest(),
      DiskBrowser.loadProjectsList()
    ]);

    try {
      var m = DiskBrowser.makeElement;
      var isProjectMode = (DiskBrowser.browserMode === 'project');

      var btnModeProject = m('button', {
        style: { padding: '0.35rem 0.75rem', background: isProjectMode ? '#238636' : '#161b22', color: isProjectMode ? '#fff' : '#c9d1d9', border: '1px solid ' + (isProjectMode ? '#3fb950' : '#30363d'), borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
        onclick: function() {
          DiskBrowser.browserMode = 'project';
          DiskBrowser.currentPath = '';
          DiskBrowser.selectedFiles.clear();
          DiskBrowser.mountUI(container);
        }
      }, '📁 Project Files');

      var btnModeLibrary = m('button', {
        style: { padding: '0.35rem 0.75rem', background: !isProjectMode ? '#8257e5' : '#161b22', color: !isProjectMode ? '#fff' : '#c9d1d9', border: '1px solid ' + (!isProjectMode ? '#d2a8ff' : '#30363d'), borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
        onclick: function() {
          DiskBrowser.browserMode = 'library';
          DiskBrowser.currentPath = '';
          DiskBrowser.selectedFiles.clear();
          DiskBrowser.mountUI(container);
        }
      }, '📚 Shared Library');

      var btnNewFile = m('button', {
        style: { padding: '0.35rem 0.75rem', background: '#003847', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
        onclick: function() {
          DiskBrowser.createNewFileModal();
        }
      }, '➕ New File');

      var searchInput = m('input', {
        id: 'search-input',
        value: DiskBrowser.searchQuery,
        placeholder: isProjectMode ? '🔍 Search files in [' + currentTarget + ']...' : '🔍 Search shared Library files...',
        style: { flex: '1 1 140px', background: '#0d1117', border: '1px solid #30363d', color: '#00f2fe', padding: '0.4rem 0.55rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none' },
        oninput: function(e) {
          DiskBrowser.searchQuery = e.target.value.toLowerCase().trim();
          var listContainer = document.getElementById('item-list-container');
          if (listContainer) DiskBrowser.renderFlatLayout(listContainer, isProjectMode ? currentTarget : 'Library');
        }
      });

      var navigationBar = m('div', {
        style: { display: 'flex', gap: '0.35rem', marginBottom: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }
      },
        btnModeProject,
        btnModeLibrary,
        btnNewFile,
        searchInput
      );

      var dirContainer = m('div', { id: 'item-list-container', style: { width: '100%', boxSizing: 'border-box' } });

      container.appendChild(DiskBrowser.renderHeader(currentTarget));
      container.appendChild(navigationBar);
      container.appendChild(dirContainer);

      await DiskBrowser.loadDirectory();
    } catch (err) {
      container.innerHTML = '<div style="padding:0.75rem; color:#f85149; background:#3c1418; font-family:monospace;">Render error: ' + err.message + '</div>';
    }
  }

  static async loadDirectory() {
    var container = document.getElementById('item-list-container');
    if (!container) return;

    var isLibMode = (DiskBrowser.browserMode === 'library');
    var queryTarget = isLibMode ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');

    try {
      container.innerHTML = '<div style="padding:1rem; text-align:center; color:#00f2fe; font-family:monospace;">⚡ Indexing project files for flat view...</div>';

      var data = await LunoApiClient.fetchFsListRecursive('', queryTarget);
      var rawItems = (data && data.items) || [];

      var files = [];
      var dirsMap = new Map();

      for (var i = 0; i < rawItems.length; i++) {
        var it = rawItems[i];
        var rel = it.relativePath || it.name;
        var norm = rel.replace(/\\/g, '/').replace(/^\/+/, '');
        if (norm.startsWith('Luno Workspace/')) norm = norm.slice(15).trim();

        if (queryTarget && norm.startsWith(queryTarget + '/')) {
          norm = norm.slice(queryTarget.length + 1);
        }

        if (!isLibMode && (norm.toLowerCase().startsWith('library/') || norm.toLowerCase().startsWith('library\\'))) {
          continue;
        }

        if (it.isDirectory) {
          dirsMap.set(norm, { name: it.name, relativePath: norm, size: it.size || 0 });
        } else {
          var parts = norm.split('/');
          var fileName = parts.pop();
          var dirPath = parts.join('/');

          files.push({
            name: fileName,
            relativePath: norm,
            dirPath: dirPath,
            size: it.size || 0,
            mtimeMs: it.mtimeMs || 0
          });

          if (dirPath && !dirsMap.has(dirPath)) {
            dirsMap.set(dirPath, { name: parts[parts.length - 1], relativePath: dirPath, size: 0 });
          }
        }
      }

      DiskBrowser.flatFilesList = files;
      DiskBrowser.directoriesList = Array.from(dirsMap.values()).sort(function(a, b) {
        return a.relativePath.localeCompare(b.relativePath);
      });

      DiskBrowser.renderFlatLayout(container, queryTarget);
    } catch (err) {
      container.innerHTML = '<div style="padding:0.75rem; color:#ff7b72; background:#3c1418; border-radius:6px; font-family:monospace;">❌ Load Error: ' + err.message + '</div>';
      DiskBrowser.showToast('Load error: ' + err.message, 'error', '❌');
    }
  }

  static setupFloatingEditorDrag(card, titleBar, savedGeo) {
    var isDragging = false;
    var startX = 0, startY = 0, origLeft = 0, origTop = 0;

    var startDrag = function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.classList.contains('luno-editor-resize-handle')) return;
      isDragging = true;
      titleBar.style.cursor = 'grabbing';
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      startX = evt.clientX;
      startY = evt.clientY;
      origLeft = card.offsetLeft;
      origTop = card.offsetTop;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    var doDrag = function(e) {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      var dx = evt.clientX - startX;
      var dy = evt.clientY - startY;

      var minLeft = 8;
      var maxLeft = window.innerWidth - 60;
      var minTop = 8;
      var maxTop = window.innerHeight - 50;

      var newLeft = Math.max(minLeft, Math.min(maxLeft, origLeft + dx));
      var newTop = Math.max(minTop, Math.min(maxTop, origTop + dy));
      card.style.left = newLeft + 'px';
      card.style.top = newTop + 'px';
    };

    var stopDrag = function() {
      if (!isDragging) return;
      isDragging = false;
      titleBar.style.cursor = 'grab';
      var geo = {};
      try { geo = JSON.parse(localStorage.getItem('luno_file_editor_geo') || '{}'); } catch(e){}
      geo.top = card.offsetTop;
      geo.left = card.offsetLeft;
      geo.width = card.offsetWidth;
      geo.height = card.offsetHeight;
      try { localStorage.setItem('luno_file_editor_geo', JSON.stringify(geo)); } catch(e){}
    };

    titleBar.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    titleBar.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', doDrag);
    window.addEventListener('touchend', stopDrag);
  }

  static createNewFileModal() {
    var targetProj = (DiskBrowser.browserMode === 'library') ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');
    var defaultPrefix = (DiskBrowser.browserMode === 'library') ? '' : 'src/';
    var rawPath = prompt('Enter new file relative path (e.g. ' + defaultPrefix + 'MyNewComponent.js):', defaultPrefix + 'NewFile.js');
    if (!rawPath || !rawPath.trim()) return;

    var cleanPath = rawPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (cleanPath.startsWith('Luno Workspace/')) cleanPath = cleanPath.slice(15).trim();
    var fileName = cleanPath.split('/').pop();
    var ext = (fileName.split('.').pop() || '').toLowerCase();

    var initialContent = '// New file: ' + cleanPath + '\n';
    if (ext === 'js' || ext === 'mjs') {
      var clsName = fileName.replace(/\.[^/.]+$/, '');
      clsName = clsName.charAt(0).toUpperCase() + clsName.slice(1);
      initialContent = 'class ' + clsName + ' {\n  constructor() {}\n}\n\nglobalThis.' + clsName + ' = ' + clsName + ';\nif (typeof module !== "undefined" && module.exports) module.exports = ' + clsName + ';\n';
    } else if (ext === 'css') {
      initialContent = '/* Stylesheet: ' + cleanPath + ' */\n';
    } else if (ext === 'html') {
      initialContent = '<div id="' + fileName.replace(/\.[^/.]+$/, '') + '">\n  <!-- HTML Template -->\n</div>\n';
    } else if (ext === 'json') {
      initialContent = '{\n  "name": "' + fileName + '"\n}\n';
    }

    DiskBrowser.openFileEditorModal(cleanPath);
    setTimeout(function() {
      var textarea = document.getElementById('floating-file-editor-textarea');
      if (textarea) {
        textarea.value = initialContent;
        var statusEl = document.getElementById('editor-file-status');
        if (statusEl) {
          statusEl.textContent = '● New file (Unsaved - Click Save to write to storage)';
          statusEl.style.color = '#00f2fe';
        }
      }
    }, 150);
  }

  static async openFileEditorModal(filePath) {
    if (typeof document === 'undefined') return;

    var targetProj = (DiskBrowser.browserMode === 'library') ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');
    var existing = document.getElementById('luno-floating-file-editor');
    if (existing) existing.remove();

    var screenW = window.innerWidth || 360;
    var screenH = window.innerHeight || 640;

    var dialogW = Math.min(screenW - 16, 520);
    var dialogH = Math.min(screenH - 30, 440);
    var dialogL = Math.max(8, (screenW - dialogW) / 2);
    var dialogT = Math.max(16, (screenH - dialogH) / 2);

    var savedGeo = { top: dialogT, left: dialogL, width: dialogW, height: dialogH };
    try {
      var raw = localStorage.getItem('luno_file_editor_geo');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed.width && parsed.width < screenW - 20) savedGeo.width = parsed.width;
        if (parsed.height && parsed.height < screenH - 40) savedGeo.height = parsed.height;
        if (parsed.top !== undefined && parsed.top > 0 && parsed.top < screenH - 80) savedGeo.top = parsed.top;
        if (parsed.left !== undefined && parsed.left > 0 && parsed.left < screenW - 80) savedGeo.left = parsed.left;
      }
    } catch(e){}

    var card = document.createElement('div');
    card.id = 'luno-floating-file-editor';
    card.style.cssText = [
      'position: fixed;',
      'top: ' + savedGeo.top + 'px;',
      'left: ' + savedGeo.left + 'px;',
      'width: ' + savedGeo.width + 'px;',
      'height: ' + savedGeo.height + 'px;',
      'max-width: calc(100vw - 16px);',
      'max-height: calc(100vh - 24px);',
      'min-width: 260px;',
      'min-height: 180px;',
      'background: rgba(22, 27, 34, 0.98);',
      'color: #c9d1d9;',
      'border: 2px solid #00f2fe;',
      'border-radius: 12px;',
      'z-index: 9940;',
      'box-shadow: 0 12px 36px rgba(0, 242, 254, 0.35);',
      'display: flex;',
      'flex-direction: column;',
      'font-family: monospace;',
      'box-sizing: border-box;',
      'overflow: hidden;',
      'backdrop-filter: blur(12px);',
      'transform-origin: center center;'
    ].join('\n');

    var fileName = filePath.split('/').pop();
    var ext = (fileName.split('.').pop() || '').toUpperCase();
    var isLib = (DiskBrowser.browserMode === 'library');

    var extBadgeBg = '#003847';
    var extBadgeColor = '#00f2fe';
    if (ext === 'JS' || ext === 'MJS') { extBadgeBg = '#2c2800'; extBadgeColor = '#f7df1e'; }
    else if (ext === 'CSS') { extBadgeBg = '#0d2d4a'; extBadgeColor = '#58a6ff'; }
    else if (ext === 'HTML') { extBadgeBg = '#3c1418'; extBadgeColor = '#ff7b72'; }
    else if (ext === 'JSON') { extBadgeBg = '#0d2818'; extBadgeColor = '#3fb950'; }
    else if (ext === 'MD' || ext === 'TXT') { extBadgeBg = '#271052'; extBadgeColor = '#d2a8ff'; }

    var titleBar = document.createElement('div');
    titleBar.id = 'floating-file-editor-header';
    titleBar.style.cssText = 'background:linear-gradient(135deg, #003847 0%, #161b22 100%); color:#00f2fe; padding:0.45rem 0.65rem; user-select:none; font-weight:bold; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center; cursor:grab; border-radius:10px 10px 0 0; flex-shrink:0; border-bottom:1px solid #00f2fe44; gap:0.4rem;';
    titleBar.innerHTML = [
      '<div style="display:flex; align-items:center; gap:0.35rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0;">',
      '  <span style="font-size:0.68rem; background:' + extBadgeBg + '; color:' + extBadgeColor + '; border:1px solid ' + extBadgeColor + '66; padding:0.1rem 0.3rem; border-radius:4px; flex-shrink:0;">' + ext + '</span>',
      '  <span style="color:#00f2fe; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + fileName + '</span>',
      '  <span style="font-size:0.68rem; color:#8b949e; font-weight:normal; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">(' + filePath + ')</span>',
      '</div>',
      '<div style="display:flex; gap:0.3rem; align-items:center; flex-shrink:0;">',
      '  <button id="btn-close-file-editor" style="background:#21262d; border:1px solid #da3633; color:#ff7b72; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.8rem; padding:0.15rem 0.45rem; line-height:1;">✖</button>',
      '</div>'
    ].join('\n');

    var body = document.createElement('div');
    body.id = 'floating-file-editor-body';
    body.style.cssText = 'padding:0.55rem; display:flex; flex-direction:column; gap:0.45rem; flex:1; overflow:hidden; box-sizing:border-box; position:relative;';

    var metricsBar = document.createElement('div');
    metricsBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:#8b949e; flex-shrink:0;';
    metricsBar.innerHTML = '<span id="editor-file-status">⚡ Loading file contents...</span><span id="editor-file-metrics">0 lines | 0 B</span>';

    var textarea = document.createElement('textarea');
    textarea.id = 'floating-file-editor-textarea';
    textarea.placeholder = '// File contents...';
    textarea.style.cssText = 'width:100%; flex:1; background:#070a13; color:#7ee787; border:1px solid #30363d; border-radius:8px; padding:0.55rem; font-family:monospace; font-size:0.78rem; line-height:1.4; outline:none; box-sizing:border-box; resize:none; font-weight:500; min-height:60px; box-shadow:inset 0 2px 6px rgba(0,0,0,0.6);';

    var updateMetrics = function() {
      var val = textarea.value;
      var lines = val ? val.split('\n').length : 0;
      var bytes = val ? val.length : 0;
      var metricsEl = document.getElementById('editor-file-metrics');
      if (metricsEl) metricsEl.textContent = lines + ' line(s) | ' + DiskBrowser.formatBytes(bytes);
    };

    textarea.oninput = function() {
      updateMetrics();
      var statusEl = document.getElementById('editor-file-status');
      if (statusEl) {
        statusEl.textContent = '● Unsaved changes (Ctrl+S to save)';
        statusEl.style.color = '#ff9800';
      }
    };

    var doSave = async function() {
      var btnSave = document.getElementById('btn-editor-save-disk');
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Saving...';
      }
      try {
        var content = textarea.value;
        var filePrefix = isLib ? ('Library/' + filePath.replace(/^Library\//i, '')) : (targetProj ? (targetProj + '/' + filePath.replace(new RegExp('^' + targetProj + '/'), '')) : filePath);
        var savePayload = {
          files: [{ filePath: filePrefix, content: content, action: 'direct' }],
          serverScript: '',
          project: targetProj
        };

        var data = await LunoApiClient.savePayload(savePayload, targetProj);

        if (data && data.success) {
          var statusEl = document.getElementById('editor-file-status');
          if (statusEl) {
            statusEl.textContent = '✓ Saved to storage';
            statusEl.style.color = '#3fb950';
          }
          DiskBrowser.showToast('Saved ' + fileName + ' successfully!', 'success', '💾');

          var fItem = DiskBrowser.flatFilesList.find(function(f) { return f.relativePath === filePath; });
          if (fItem) {
            fItem.size = content.length;
            var container = document.getElementById('item-list-container');
            if (container) DiskBrowser.renderFlatLayout(container, targetProj);
          }
        } else {
          alert('Save failed: ' + ((data && data.error) || 'Storage error'));
        }
      } catch(err) {
        alert('Save exception: ' + err.message);
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.textContent = '💾 Save (Ctrl+S)';
        }
      }
    };

    textarea.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        doSave();
      }
    });

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:0.35rem; flex-shrink:0; flex-wrap:wrap;';

    var btnSave = document.createElement('button');
    btnSave.id = 'btn-editor-save-disk';
    btnSave.style.cssText = 'flex:2; min-width:110px; padding:0.45rem; background:#238636; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.75rem; font-family:monospace; box-shadow:0 2px 8px rgba(35,134,54,0.3);';
    btnSave.textContent = '💾 Save (Ctrl+S)';
    btnSave.onclick = doSave;

    var btnOutbox = document.createElement('button');
    btnOutbox.style.cssText = 'flex:1.2; min-width:85px; padding:0.45rem; background:#271052; color:#d2a8ff; border:1px solid #8257e5; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.75rem; font-family:monospace;';
    btnOutbox.textContent = '📤 Outbox';
    btnOutbox.onclick = function() {
      var content = textarea.value;
      var filePrefix = isLib ? ('Library/' + filePath.replace(/^Library\//i, '')) : (targetProj ? (targetProj + '/' + filePath.replace(new RegExp('^' + targetProj + '/'), '')) : filePath);
      var closeScript = '<' + '/script>';
      var payload = '<script data-file="' + filePrefix + '">\n' + content + '\n' + closeScript;
      if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
        OutboxQueue.addBundle((isLib ? 'Library: ' : 'File: ') + fileName, payload);
        DiskBrowser.showToast('Queued ' + fileName + ' to Outbox!', 'success', '📤');
      }
    };

    var btnCopy = document.createElement('button');
    btnCopy.style.cssText = 'flex:1; min-width:65px; padding:0.45rem; background:#161b22; color:#00f2fe; border:1px solid #00f2fe; border-radius:6px; cursor:pointer; font-size:0.72rem; font-family:monospace; font-weight:bold;';
    btnCopy.textContent = '📋 Copy';
    btnCopy.onclick = function() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value).then(function() {
          btnCopy.textContent = '✓ Copied';
          setTimeout(function() { btnCopy.textContent = '📋 Copy'; }, 1500);
        });
      }
    };

    var btnClose = document.createElement('button');
    btnClose.style.cssText = 'padding:0.45rem 0.65rem; background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; cursor:pointer; font-size:0.72rem; font-family:monospace;';
    btnClose.textContent = 'Close';
    btnClose.onclick = function() { card.remove(); };

    btnRow.appendChild(btnSave);
    btnRow.appendChild(btnOutbox);
    btnRow.appendChild(btnCopy);
    btnRow.appendChild(btnClose);

    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'luno-editor-resize-handle';
    resizeHandle.style.cssText = 'position:absolute; bottom:1px; right:1px; width:20px; height:20px; cursor:se-resize; user-select:none; z-index:10; color:#00f2fe; font-size:12px; text-align:right; line-height:20px; font-weight:bold; opacity:0.85; padding-right:2px;';
    resizeHandle.textContent = '◢';

    var isResizing = false;
    var rStartX = 0, rStartY = 0, rStartW = 0, rStartH = 0;

    var startResize = function(e) {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      isResizing = true;
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      rStartX = evt.clientX;
      rStartY = evt.clientY;
      rStartW = card.offsetWidth;
      rStartH = card.offsetHeight;
    };

    var doResize = function(e) {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      var evt = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      var newW = Math.min(window.innerWidth - 16, Math.max(260, rStartW + (evt.clientX - rStartX)));
      var newH = Math.min(window.innerHeight - 24, Math.max(180, rStartH + (evt.clientY - rStartY)));
      card.style.width = newW + 'px';
      card.style.height = newH + 'px';
    };

    var stopResize = function() {
      if (!isResizing) return;
      isResizing = false;
      var geo = {};
      try { geo = JSON.parse(localStorage.getItem('luno_file_editor_geo') || '{}'); } catch(e){}
      geo.width = card.offsetWidth;
      geo.height = card.offsetHeight;
      try { localStorage.setItem('luno_file_editor_geo', JSON.stringify(geo)); } catch(e){}
    };

    resizeHandle.addEventListener('mousedown', startResize);
    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);

    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    window.addEventListener('touchmove', doResize);
    window.addEventListener('touchend', stopResize);

    body.appendChild(metricsBar);
    body.appendChild(textarea);
    body.appendChild(btnRow);
    body.appendChild(resizeHandle);

    card.appendChild(titleBar);
    card.appendChild(body);
    document.body.appendChild(card);

    document.getElementById('btn-close-file-editor').onclick = function() { card.remove(); };
    DiskBrowser.setupFloatingEditorDrag(card, titleBar, savedGeo);

    try {
      var data = await LunoApiClient.fetchFsRead(filePath, targetProj);
      if (data && data.success && data.content !== undefined) {
        textarea.value = data.content;
        var statusEl = document.getElementById('editor-file-status');
        if (statusEl) {
          statusEl.textContent = '✓ Ready to edit (Ctrl+S to save)';
          statusEl.style.color = '#7ee787';
        }
        updateMetrics();
        setTimeout(function() { textarea.focus(); }, 100);
      } else {
        textarea.value = '// Error loading file: ' + ((data && data.error) || 'Not found');
      }
    } catch(err) {
      textarea.value = '// Load exception: ' + err.message;
    }
  }

  static renderFlatLayout(container, queryTarget) {
    if (!container) return;
    container.innerHTML = '';
    var m = DiskBrowser.makeElement;
    var isLibMode = (DiskBrowser.browserMode === 'library');

    var files = DiskBrowser.flatFilesList || [];
    var dirs = DiskBrowser.directoriesList || [];
    var query = (DiskBrowser.searchQuery || '').toLowerCase().trim();

    if (query) {
      files = files.filter(function(f) {
        return f.name.toLowerCase().includes(query) || f.relativePath.toLowerCase().includes(query);
      });
      dirs = dirs.filter(function(d) {
        return d.relativePath.toLowerCase().includes(query);
      });
    }

    var sortedFiles = DiskBrowser.sortItems(files, DiskBrowser.sortBy, DiskBrowser.sortDirection);

    var sortControls = m('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '0.45rem 0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }
    },
      m('div', { style: { display: 'flex', gap: '0.35rem', alignItems: 'center' } },
        m('span', { style: { fontSize: '0.72rem', color: '#8b949e', fontWeight: 'bold' } }, 'Sort:'),
        m('button', {
          style: {
            padding: '0.2rem 0.5rem',
            fontSize: '0.72rem',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            background: DiskBrowser.sortBy === 'size' ? '#238636' : '#0d1117',
            color: DiskBrowser.sortBy === 'size' ? '#fff' : '#8b949e',
            border: '1px solid ' + (DiskBrowser.sortBy === 'size' ? '#3fb950' : '#30363d')
          },
          onclick: function() {
            if (DiskBrowser.sortBy === 'size') {
              DiskBrowser.sortDirection = DiskBrowser.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
              DiskBrowser.sortBy = 'size';
              DiskBrowser.sortDirection = 'desc';
            }
            DiskBrowser.renderFlatLayout(container, queryTarget);
          }
        }, '📦 Size ' + (DiskBrowser.sortBy === 'size' ? (DiskBrowser.sortDirection === 'desc' ? '▼' : '▲') : '')),
        m('button', {
          style: {
            padding: '0.2rem 0.5rem',
            fontSize: '0.72rem',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            background: DiskBrowser.sortBy === 'name' ? '#238636' : '#0d1117',
            color: DiskBrowser.sortBy === 'name' ? '#fff' : '#8b949e',
            border: '1px solid ' + (DiskBrowser.sortBy === 'name' ? '#3fb950' : '#30363d')
          },
          onclick: function() {
            if (DiskBrowser.sortBy === 'name') {
              DiskBrowser.sortDirection = DiskBrowser.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
              DiskBrowser.sortBy = 'name';
              DiskBrowser.sortDirection = 'asc';
            }
            DiskBrowser.renderFlatLayout(container, queryTarget);
          }
        }, '🔤 Name ' + (DiskBrowser.sortBy === 'name' ? (DiskBrowser.sortDirection === 'desc' ? '▼' : '▲') : ''))
      ),
      m('span', { style: { fontSize: '0.72rem', color: '#00f2fe', fontWeight: 'bold' } },
        sortedFiles.length + ' file(s) | ' + dirs.length + ' folder(s)'
      )
    );

    var filesHeader = m('div', {
      style: { fontSize: '0.78rem', fontWeight: 'bold', color: '#00f2fe', margin: '0.4rem 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }
    }, '📄 Files in [' + (queryTarget || 'Project') + ']: (tap to edit)');

    var fileRows = sortedFiles.map(function(file) {
      var tailPath = DiskBrowser.formatTailPath(file.relativePath, 28);

      var btnOutboxIcon = m('button', {
        style: { padding: '0.2rem 0.45rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' },
        title: 'Send file to Outbox',
        onclick: function(e) {
          e.stopPropagation();
          DiskBrowser.pushSingleFileToOutbox(file.relativePath, btnOutboxIcon);
        }
      }, '📤');

      return m('div', {
        style: {
          background: '#0d1117',
          border: '1px solid #21262d',
          borderRadius: '6px',
          padding: '0.45rem 0.65rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease'
        },
        onclick: function() {
          DiskBrowser.openFileEditorModal(file.relativePath);
        }
      },
        m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', flex: 1, minWidth: 0 } },
          m('strong', { style: { color: isLibMode ? '#d2a8ff' : '#f0f6fc', fontSize: '0.82rem', whiteSpace: 'nowrap' } }, file.name),
          tailPath ? m('span', {
            style: {
              color: '#8b949e',
              opacity: 0.8,
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            title: file.relativePath
          }, tailPath) : null
        ),
        m('div', { style: { display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 } },
          m('span', { style: { color: '#8b949e', fontSize: '0.7rem', fontFamily: 'monospace' } }, DiskBrowser.formatBytes(file.size)),
          btnOutboxIcon
        )
      );
    });

    var filesContainer = m('div', {
      style: { display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '380px', overflowY: 'auto', marginBottom: '0.75rem' }
    }, fileRows.length > 0 ? fileRows : m('div', { style: { padding: '0.8rem', color: '#8b949e', fontSize: '0.75rem', textAlign: 'center' } }, 'No files matched your filter.'));

    var dirsHeader = m('div', {
      style: { fontSize: '0.78rem', fontWeight: 'bold', color: '#d2a8ff', margin: '0.5rem 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }
    }, '📁 Project Directories:');

    var dirRows = dirs.map(function(d) {
      return m('div', {
        style: { background: '#0d1117', border: '1px solid #21262d', borderRadius: '6px', padding: '0.35rem 0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }
      },
        m('span', { style: { color: '#00f2fe', fontWeight: 'bold' } }, '📁 ' + d.relativePath)
      );
    });

    var dirsContainer = m('div', {
      style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '160px', overflowY: 'auto' }
    }, dirRows.length > 0 ? dirRows : m('div', { style: { padding: '0.5rem', color: '#8b949e', fontSize: '0.72rem', textAlign: 'center' } }, 'Root project folder only.'));

    container.appendChild(sortControls);
    container.appendChild(filesHeader);
    container.appendChild(filesContainer);
    container.appendChild(dirsHeader);
    container.appendChild(dirsContainer);
  }

  static async loadProjectsList() {
    try {
      var res = await LunoApiClient.fetchProjectsList();
      DiskBrowser.projectsList = res.projects || [];
    } catch (e) {}
  }

  static async loadActiveManifest() {
    try {
      var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '';
      var res = await LunoApiClient.fetchFsRead('luno.json', currentTarget);
      if (res && res.content) DiskBrowser.activeManifest = JSON.parse(res.content);
    } catch (e) {}
  }

  static async pushSingleFileToOutbox(relPath, originElement) {
    try {
      var isLibMode = (DiskBrowser.browserMode === 'library');
      var target = isLibMode ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');
      var res = await LunoApiClient.fetchFsRead(relPath, target);

      if (res && res.content !== undefined) {
        var fileName = relPath.split('/').pop();
        var ext = (fileName.split('.').pop() || '').toLowerCase();
        var closeTag = (ext === 'css') ? ('<' + '/style>') : (ext === 'html' || ext === 'htm' ? ('<' + '/template>') : (ext === 'svg' ? ('<' + '/svg>') : ('<' + '/script>')));
        var openTag = (ext === 'css') ? '<style' : (ext === 'html' || ext === 'htm' ? '<template' : (ext === 'svg' ? '<svg' : '<script'));

        var filePathPrefix = isLibMode ? ('Library/' + relPath.replace(/^Library\//i, '')) : (target ? (target + '/' + relPath.replace(new RegExp('^' + target + '/'), '')) : relPath);
        var payload = openTag + ' data-file="' + filePathPrefix + '">\n' + res.content + '\n' + closeTag;

        if (originElement && typeof LunoAnimationEngine !== 'undefined') {
          var outboxCard = document.querySelector('.outbox-card');
          LunoAnimationEngine.flyElement(originElement, outboxCard, {
            label: '📄 ' + fileName,
            color: '#d2a8ff',
            glowColor: 'rgba(130, 87, 229, 0.85)',
            icon: '📤',
            duration: 500
          });
        }

        if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
          OutboxQueue.addBundle((isLibMode ? 'Library Module: ' : 'File: ') + relPath, payload);
          DiskBrowser.showToast('Queued ' + relPath + ' to Outbox!', 'success', '📤');
        }
      } else {
        DiskBrowser.showToast('Failed to read file for Outbox: ' + relPath, 'error', '❌');
      }
    } catch (e) {
      DiskBrowser.showToast('Error reading ' + relPath + ': ' + e.message, 'error', '❌');
    }
  }
}

globalThis.DiskBrowser = DiskBrowser;
if (typeof window !== 'undefined') window.DiskBrowser = DiskBrowser;
if (typeof module !== 'undefined' && module.exports) module.exports = DiskBrowser;