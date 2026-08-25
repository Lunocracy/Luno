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

static initProperties() {
  "";
  window.DiskBrowser.parentPath = "";
  window.DiskBrowser.browserMode = "project"; // 'project' | 'library'
  window.DiskBrowser.viewMode = "flat"; // 'flat' layout
  window.DiskBrowser.sortBy = "size"; // 'size' | 'name' | 'ext'
  window.DiskBrowser.sortDirection = "desc"; // 'asc' | 'desc'
  window.DiskBrowser.searchQuery = "";
  window.DiskBrowser.flatFilesList = [];
  window.DiskBrowser.directoriesList = [];
  window.DiskBrowser.selectedFiles = new Set();
  window.DiskBrowser.fileContentCache = {};
  window.DiskBrowser.activeManifest = { main: [], local: [], library: [] };
  window.DiskBrowser.projectsList = [];
}
}

static formatTailPath(fullPath, maxChars) {
  if (!fullPath || typeof fullPath !== 'string') return '';
  var limit = maxChars || 30;
  var norm = fullPath.replace(/\\/g, '/').replace(/^\/+/, '');
  var parts = norm.split('/');
  
  // If it is just a top-level file in project root
  if (parts.length <= 1) return '';
  
  var dirPart = parts.slice(0, -1).join('/');
  if (dirPart.length <= limit) {
    return dirPart;
  }
  
  // Cut from the end so the tail of the path is always preserved
  var tail = dirPart.slice(-limit + 3);
  var slashIdx = tail.indexOf('/');
  if (slashIdx !== -1 && slashIdx < 10) {
    tail = tail.slice(slashIdx);
  }
  return '...' + tail;
}

static sortItems(itemsList, sortBy, sortDirection) {
  var mode = sortBy || window.DiskBrowser.sortBy || 'size';
  var dir = sortDirection || window.DiskBrowser.sortDirection || 'desc';
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

static async loadDirectory() {
  var container = document.getElementById('item-list-container');
  if (!container) return;

  var isLibMode = (window.DiskBrowser.browserMode === 'library');
  var queryTarget = isLibMode ? 'Library' : ((typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '');

  try {
    container.innerHTML = '<div style="padding:1rem; text-align:center; color:#00f2fe; font-family:monospace;">⚡ Indexing project files for flat view...</div>';

    // Fetch recursive tree of all files in project
    var data = await LunoApiClient.fetchFsListRecursive('', queryTarget);
    var rawItems = (data && data.items) || [];

    var files = [];
    var dirsMap = new Map();

    for (var i = 0; i < rawItems.length; i++) {
      var it = rawItems[i];
      var rel = it.relativePath || it.name;
      var norm = rel.replace(/\\/g, '/').replace(/^\/+/, '');

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

        // Record parent directories
        if (dirPath && !dirsMap.has(dirPath)) {
          dirsMap.set(dirPath, { name: parts[parts.length - 1], relativePath: dirPath, size: 0 });
        }
      }
    }

    window.DiskBrowser.flatFilesList = files;
    window.DiskBrowser.directoriesList = Array.from(dirsMap.values()).sort(function(a, b) {
      return a.relativePath.localeCompare(b.relativePath);
    });

    window.DiskBrowser.renderFlatLayout(container, queryTarget);
  } catch (err) {
    container.innerHTML = '<div style="padding:0.75rem; color:#ff7b72; background:#3c1418; border-radius:6px; font-family:monospace;">❌ Load Error: ' + err.message + '</div>';
    window.DiskBrowser.showToast('Load error: ' + err.message, 'error', '❌');
  }
}

static renderFlatLayout() {
  '';
  var m = window.DiskBrowser.makeElement;
  var isLibMode = (window.DiskBrowser.browserMode === 'library');

  var files = window.DiskBrowser.flatFilesList || [];
  var dirs = window.DiskBrowser.directoriesList || [];
  var query = (window.DiskBrowser.searchQuery || '').toLowerCase().trim();

  if (query) {
    files = files.filter(function(f) {
      return f.name.toLowerCase().includes(query) || f.relativePath.toLowerCase().includes(query);
    });
    dirs = dirs.filter(function(d) {
      return d.relativePath.toLowerCase().includes(query);
    });
  }

  var sortedFiles = window.DiskBrowser.sortItems(files, window.DiskBrowser.sortBy, window.DiskBrowser.sortDirection);

  // Sorting Control Bar
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
          background: window.DiskBrowser.sortBy === 'size' ? '#238636' : '#0d1117',
          color: window.DiskBrowser.sortBy === 'size' ? '#fff' : '#8b949e',
          border: '1px solid ' + (window.DiskBrowser.sortBy === 'size' ? '#3fb950' : '#30363d')
        },
        onclick: function() {
          if (window.DiskBrowser.sortBy === 'size') {
            window.DiskBrowser.sortDirection = window.DiskBrowser.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            window.DiskBrowser.sortBy = 'size';
            window.DiskBrowser.sortDirection = 'desc';
          }
          window.DiskBrowser.renderFlatLayout(container, queryTarget);
        }
      }, '📦 Size ' + (window.DiskBrowser.sortBy === 'size' ? (window.DiskBrowser.sortDirection === 'desc' ? '▼' : '▲') : '')),
      m('button', {
        style: {
          padding: '0.2rem 0.5rem',
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          borderRadius: '4px',
          cursor: 'pointer',
          background: window.DiskBrowser.sortBy === 'name' ? '#238636' : '#0d1117',
          color: window.DiskBrowser.sortBy === 'name' ? '#fff' : '#8b949e',
          border: '1px solid ' + (window.DiskBrowser.sortBy === 'name' ? '#3fb950' : '#30363d')
        },
        onclick: function() {
          if (window.DiskBrowser.sortBy === 'name') {
            window.DiskBrowser.sortDirection = window.DiskBrowser.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            window.DiskBrowser.sortBy = 'name';
            window.DiskBrowser.sortDirection = 'asc';
          }
          window.DiskBrowser.renderFlatLayout(container, queryTarget);
        }
      }, '🔤 Name ' + (window.DiskBrowser.sortBy === 'name' ? (window.DiskBrowser.sortDirection === 'desc' ? '▼' : '▲') : ''))
    ),
    m('span', { style: { fontSize: '0.72rem', color: '#00f2fe', fontWeight: 'bold' } },
      sortedFiles.length + ' file(s) | ' + dirs.length + ' folder(s)'
    )
  );

  // Files Flat List Section
  var filesHeader = m('div', {
    style: { fontSize: '0.78rem', fontWeight: 'bold', color: '#00f2fe', margin: '0.4rem 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }
  }, '📄 Flat Files in [' + (queryTarget || 'Project') + ']:');

  var fileRows = sortedFiles.map(function(file) {
    var tailPath = window.DiskBrowser.formatTailPath(file.relativePath, 26);

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
        window.DiskBrowser.openFileEditorModal(file.relativePath);
      }
    },
      m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', flex: 1, minWidth: 0 } },
        m('strong', { style: { color: isLibMode ? '#d2a8ff' : '#f0f6fc', fontSize: '0.8rem', whiteSpace: 'nowrap' } }, file.name),
        tailPath ? m('span', {
          style: { color: '#6e7681', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 },
          title: file.relativePath
        }, tailPath) : null
      ),
      m('div', { style: { display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 } },
        m('span', { style: { color: '#8b949e', fontSize: '0.7rem', fontFamily: 'monospace' } }, window.DiskBrowser.formatBytes(file.size)),
        m('button', {
          style: { padding: '0.2rem 0.45rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' },
          title: 'Send file to Outbox',
          onclick: function(e) {
            e.stopPropagation();
            window.DiskBrowser.pushSingleFileToOutbox(file.relativePath);
          }
        }, '📤')
      )
    );
  });

  var filesContainer = m('div', {
    style: { display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '360px', overflowY: 'auto', marginBottom: '0.75rem' }
  }, fileRows.length > 0 ? fileRows : m('div', { style: { padding: '0.8rem', color: '#8b949e', fontSize: '0.75rem', textAlign: 'center' } }, 'No files matched your filter.'));

  // Directories Section (Underneath)
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
}

static openFileEditorModal(filePath) {
  window.DiskBrowser.showToast('Opening ' + filePath + ' in dialog editor...', 'info', '📝');
}
