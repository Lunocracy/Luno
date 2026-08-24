var DiskBrowser = globalThis.DiskBrowser = function DiskBrowser() {};

window.DiskBrowser.currentPath = "";
window.DiskBrowser.parentPath = "";
window.DiskBrowser.browserMode = "project";
window.DiskBrowser.viewMode = "list";
window.DiskBrowser.nameWrapMode = "wrap";
window.DiskBrowser.searchQuery = "";
window.DiskBrowser.selectedFiles = new Set();
window.DiskBrowser.expandedDirs = new Set();
window.DiskBrowser.expandedPreviewFile = null;
window.DiskBrowser.fileContentCache = {};
window.DiskBrowser.activeManifest = { main: [], local: [], library: [], thirdParty: [] };
window.DiskBrowser.projectsList = [];

window.DiskBrowser.showToast = function(message, type, icon) {
  if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
    ClientApp.showToast(message, type || 'info', icon || '✨');
  }
};

window.DiskBrowser.formatBytes = function(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  var k = 1024;
  var sizes = ['B', 'KB', 'MB', 'GB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

window.DiskBrowser.getFileBadge = function(fileName, isDir) {
  if (isDir) {
    return { ext: 'DIR', icon: '📁', color: '#00f2fe', bg: '#003847', border: '#00f2fe66' };
  }
  var ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'mjs':
      return { ext: 'JS', icon: '⚡', color: '#f7df1e', bg: '#2c2800', border: '#f7df1e66' };
    case 'html':
    case 'htm':
      return { ext: 'HTML', icon: '🌐', color: '#ff7b72', bg: '#3c1418', border: '#ff7b7266' };
    case 'css':
      return { ext: 'CSS', icon: '🎨', color: '#58a6ff', bg: '#0d2d4a', border: '#58a6ff66' };
    case 'json':
      return { ext: 'JSON', icon: '⚙️', color: '#3fb950', bg: '#0d2818', border: '#3fb95066' };
    case 'md':
    case 'txt':
      return { ext: 'DOC', icon: '📝', color: '#d2a8ff', bg: '#271052', border: '#d2a8ff66' };
    default:
      return { ext: ext.toUpperCase().slice(0, 4) || 'FILE', icon: '📄', color: '#8b949e', bg: '#161b22', border: '#30363d' };
  }
};

window.DiskBrowser.makeElement = function() {
  return LunoUIComponents.makeElement.apply(LunoUIComponents, arguments);
};

window.DiskBrowser.renderHeader = function(activeProjName) {
  var m = window.DiskBrowser.makeElement;
  var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

  var validProjects = window.DiskBrowser.projectsList.filter(function(p) {
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
        window.DiskBrowser.currentPath = '';
        window.DiskBrowser.expandedPreviewFile = null;
        window.DiskBrowser.selectedFiles.clear();
        window.DiskBrowser.fileContentCache = {};
        var mainRoot = document.getElementById('luno-spa-content-area') || document.body;
        await window.DiskBrowser.mountUI(mainRoot);
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
        onclick: function() { window.DiskBrowser.loadDirectory(); }
      }, 'Refresh')
    )
  );
};

window.DiskBrowser.mountUI = async function(container) {
  if (!container) return;
  container.innerHTML = '';

  var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

  await Promise.all([
    window.DiskBrowser.loadActiveManifest(),
    window.DiskBrowser.loadProjectsList()
  ]);

  try {
    var m = window.DiskBrowser.makeElement;
    var isProjectMode = (window.DiskBrowser.browserMode === 'project');

    var btnModeProject = m('button', {
      style: { padding: '0.35rem 0.75rem', background: isProjectMode ? '#238636' : '#161b22', color: isProjectMode ? '#fff' : '#c9d1d9', border: '1px solid ' + (isProjectMode ? '#3fb950' : '#30363d'), borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
      onclick: function() {
        window.DiskBrowser.browserMode = 'project';
        window.DiskBrowser.currentPath = '';
        window.DiskBrowser.selectedFiles.clear();
        window.DiskBrowser.mountUI(container);
      }
    }, '📁 Project Files');

    var btnModeLibrary = m('button', {
      style: { padding: '0.35rem 0.75rem', background: !isProjectMode ? '#8257e5' : '#161b22', color: !isProjectMode ? '#fff' : '#c9d1d9', border: '1px solid ' + (!isProjectMode ? '#d2a8ff' : '#30363d'), borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' },
      onclick: function() {
        window.DiskBrowser.browserMode = 'library';
        window.DiskBrowser.currentPath = '';
        window.DiskBrowser.selectedFiles.clear();
        window.DiskBrowser.mountUI(container);
      }
    }, '📚 Shared Library');

    var searchInput = m('input', {
      id: 'search-input',
      value: window.DiskBrowser.searchQuery,
      placeholder: isProjectMode ? '🔍 Search files in [' + currentTarget + ']...' : '🔍 Search shared Library files...',
      style: { flex: '1 1 140px', background: '#0d1117', border: '1px solid #30363d', color: '#00f2fe', padding: '0.4rem 0.55rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none' },
      oninput: function(e) {
        window.DiskBrowser.searchQuery = e.target.value.toLowerCase().trim();
        window.DiskBrowser.loadDirectory();
      }
    });

    var navigationBar = m('div', {
      style: { display: 'flex', gap: '0.35rem', marginBottom: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }
    },
      btnModeProject,
      btnModeLibrary,
      searchInput
    );

    var dirContainer = m('div', { id: 'item-list-container', style: { maxHeight: '600px', overflowY: 'auto' } });

    container.appendChild(window.DiskBrowser.renderHeader(currentTarget));
    container.appendChild(navigationBar);
    container.appendChild(dirContainer);

    await window.DiskBrowser.loadDirectory();
  } catch (err) {
    container.innerHTML = '<div style="padding:0.75rem; color:#f85149; background:#3c1418;">Render error: ' + err.message + '</div>';
  }
};

window.DiskBrowser.loadDirectory = async function() {
  var container = document.getElementById('item-list-container');
  if (!container) return;

  var isLibMode = (window.DiskBrowser.browserMode === 'library');
  var queryTarget = isLibMode ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');

  try {
    var data = await LunoApiClient.fetchFsList(window.DiskBrowser.currentPath || '', queryTarget);
    var displayItems = data.items || [];

    if (window.DiskBrowser.searchQuery) {
      displayItems = displayItems.filter(function(i) {
        return i.name.toLowerCase().includes(window.DiskBrowser.searchQuery);
      });
    }

    container.innerHTML = '';
    if (displayItems.length === 0) {
      var emptyMsg = isLibMode
        ? 'Shared Library folder is empty or not found.'
        : 'No matching files found in [' + (queryTarget || 'Project') + '].';
      container.appendChild(window.DiskBrowser.makeElement('div', { style: { padding: '0.8rem', color: '#8b949e', fontSize: '0.78rem', textAlign: 'center' } }, emptyMsg));
      return;
    }

    var list = window.DiskBrowser.makeElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.35rem' } });
    displayItems.forEach(function(item) {
      var rel = item.relativePath || item.name;
      var isDir = item.isDirectory;

      var row = window.DiskBrowser.makeElement('div', {
        style: { background: '#0d1117', border: '1px solid #21262d', padding: '0.45rem 0.65rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
      },
        window.DiskBrowser.makeElement('span', { style: { color: isDir ? '#00f2fe' : (isLibMode ? '#d2a8ff' : '#f0f6fc'), fontSize: '0.82rem', fontWeight: 'bold' } }, (isDir ? '📁 ' : (isLibMode ? '📚 ' : '📄 ')) + item.name),
        window.DiskBrowser.makeElement('div', { style: { display: 'flex', gap: '0.3rem' } },
          !isDir ? window.DiskBrowser.makeElement('button', {
            style: { padding: '0.2rem 0.5rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' },
            onclick: function() { window.DiskBrowser.pushSingleFileToOutbox(rel); }
          }, 'Outbox ➔') : null
        )
      );
      list.appendChild(row);
    });

    container.appendChild(list);
  } catch (err) {
    window.DiskBrowser.showToast('Load error: ' + err.message, 'error', '❌');
  }
};

window.DiskBrowser.loadProjectsList = async function() {
  try {
    var res = await LunoApiClient.fetchProjectsList();
    window.DiskBrowser.projectsList = res.projects || [];
  } catch (e) {}
};

window.DiskBrowser.loadActiveManifest = async function() {
  try {
    var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '';
    var res = await LunoApiClient.fetchFsRead('luno.json', currentTarget);
    if (res && res.content) window.DiskBrowser.activeManifest = JSON.parse(res.content);
  } catch (e) {}
};

window.DiskBrowser.pushSingleFileToOutbox = async function(relPath) {
  try {
    var isLibMode = (window.DiskBrowser.browserMode === 'library');
    var target = isLibMode ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');
    var res = await LunoApiClient.fetchFsRead(relPath, target);
    if (res && res.content) {
      var closeScript = '</' + 'script>';
      var filePathPrefix = isLibMode ? ('Library/' + relPath.replace(/^Library\//i, '')) : relPath;
      var payload = '<script data-file="' + filePathPrefix + '">\n' + res.content + '\n' + closeScript;
      if (typeof OutboxQueue !== 'undefined' && OutboxQueue.addBundle) {
        OutboxQueue.addBundle((isLibMode ? 'Library Module: ' : 'File: ') + relPath, payload);
        window.DiskBrowser.showToast('Queued ' + relPath + ' to Outbox!', 'success', '📤');
      }
    }
  } catch (e) {
    window.DiskBrowser.showToast('Error reading ' + relPath + ': ' + e.message, 'error', '❌');
  }
};

if (typeof window !== 'undefined') window.DiskBrowser = DiskBrowser;
if (typeof module !== 'undefined' && module.exports) module.exports = DiskBrowser;