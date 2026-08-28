class LunoProjectTemplates {
  constructor() {}

  static TEMPLATES = [
    {
      id: 'blank',
      name: '🌱 Blank Starter Web App',
      desc: 'Single-page web application template with standalone vanilla JS architecture and error boundary.',
      files: {
        'luno.json': '{\n  "name": "Starter Web App",\n  "version": "1.0.0",\n  "description": "Custom Luno web application",\n  "type": "luno-web-app",\n  "mainClass": "App",\n  "main": ["src/App.js"],\n  "library": [],\n  "styles": ["css/style.css"]\n}',
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Starter App</title>\n  <link rel="stylesheet" href="css/style.css">\n  <script>\n    window.addEventListener("error", function(e) {\n      var box = document.getElementById("app-container") || document.body;\n      var errMsg = e.message + " (" + (e.filename || "app") + ":" + e.lineno + ")";\n      box.innerHTML = "<div style=\'padding:1.25rem; background:#161b22; border:2px solid #da3633; border-radius:8px; color:#ff7b72; font-family:monospace;\'>" +\n        "<h3 style=\'margin-top:0; color:#f85149;\'>⚠️ Application Runtime Error</h3>" +\n        "<pre style=\'font-size:12px; white-space:pre-wrap; color:#c9d1d9;\'>" + errMsg + "</pre>" +\n        "<button style=\'margin-top:0.6rem; padding:0.4rem 0.8rem; background:#8257e5; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-family:monospace;\' onclick=\'if(window.parent && window.parent.postMessage) window.parent.postMessage({type:\"LUNO_SEND_INBOX\", payload:{rawText:\"Error Report:\\n\" + \"" + errMsg.replace(/"/g, "") + "\"}}, \"*\"); this.textContent=\"✓ Sent to Outbox!\";\'>📤 Send Error to AI Outbox</button>" +\n        "</div>";\n    });\n  <\/script>\n</head>\n<body>\n  <div id="app-container"></div>\n  <script src="/app/acorn.js"><\/script>\n  <script src="/app/LunoLoader.js"><\/script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      if (typeof LunoLoader !== "undefined") {\n        LunoLoader.loadApp("app-container");\n      }\n    });\n  <\/script>\n</body>\n</html>',
        'css/style.css': '* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { background: #0d1117; color: #c9d1d9; font-family: monospace; min-height: 100vh; padding: 1.5rem; }',
        'src/App.js': 'class App {\n  async run(env) {\n    const target = (env && env.container) || document.getElementById("app-container") || document.body;\n    target.innerHTML = "";\n    const card = document.createElement("div");\n    card.style.cssText = "padding: 2rem; background: #161b22; border: 2px solid #00f2fe; border-radius: 10px; text-align: center; font-family: monospace; color: #00f2fe; max-width: 600px; margin: 2rem auto; box-shadow: 0 4px 16px rgba(0,242,254,0.2);";\n    card.innerHTML = "<h2>🚀 Welcome to Your New Project</h2><p style=\'color: #8b949e; margin-top: 0.5rem; font-size: 0.85rem;\'>Initialized cleanly. Ready for rapid development in Luno!</p>";\n    target.appendChild(card);\n  }\n}\n\nglobalThis.App = App;\nif (typeof module !== "undefined" && module.exports) module.exports = App;'
      }
    },
    {
      id: '3d_app',
      name: '🎲 3D Canvas App',
      desc: 'Interactive 3D WebGL viewport starter with self-contained rotation animation.',
      files: {
        'luno.json': '{\n  "name": "3D Canvas App",\n  "version": "1.0.0",\n  "description": "3D Canvas Viewport",\n  "type": "luno-web-app",\n  "mainClass": "App3D",\n  "main": ["src/App3D.js"],\n  "library": [],\n  "styles": ["css/app3d.css"]\n}',
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>3D Canvas App</title>\n  <link rel="stylesheet" href="css/app3d.css">\n  <script>\n    window.addEventListener("error", function(e) {\n      var box = document.getElementById("app-container") || document.body;\n      var errMsg = e.message + " (" + (e.filename || "app") + ":" + e.lineno + ")";\n      box.innerHTML = "<div style=\'padding:1.25rem; background:#161b22; border:2px solid #da3633; border-radius:8px; color:#ff7b72; font-family:monospace;\'>" +\n        "<h3 style=\'margin-top:0; color:#f85149;\'>⚠️ 3D Viewport Error</h3>" +\n        "<pre style=\'font-size:12px; white-space:pre-wrap; color:#c9d1d9;\'>" + errMsg + "</pre>" +\n        "<button style=\'margin-top:0.6rem; padding:0.4rem 0.8rem; background:#8257e5; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-family:monospace;\' onclick=\'if(window.parent && window.parent.postMessage) window.parent.postMessage({type:\"LUNO_SEND_INBOX\", payload:{rawText:\"Error Report:\\n\" + \"" + errMsg.replace(/"/g, "") + "\"}}, \"*\"); this.textContent=\"✓ Sent to Outbox!\";\'>📤 Send Error to AI Outbox</button>" +\n        "</div>";\n    });\n  <\/script>\n</head>\n<body>\n  <div id="app-container"></div>\n  <script src="/app/acorn.js"><\/script>\n  <script src="/app/LunoLoader.js"><\/script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      if (typeof LunoLoader !== "undefined") {\n        LunoLoader.loadApp("app-container");\n      }\n    });\n  <\/script>\n</body>\n</html>',
        'css/app3d.css': '* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { background: #000; color: #00f2fe; font-family: monospace; overflow: hidden; height: 100vh; }',
        'src/App3D.js': 'class App3D {\n  async run(env) {\n    const target = (env && env.container) || document.getElementById("app-container") || document.body;\n    target.innerHTML = "";\n    const canvas = document.createElement("canvas");\n    canvas.width = window.innerWidth;\n    canvas.height = window.innerHeight;\n    target.appendChild(canvas);\n    const ctx = canvas.getContext("2d");\n    let angle = 0;\n    function render() {\n      ctx.fillStyle = "#070a13";\n      ctx.fillRect(0, 0, canvas.width, canvas.height);\n      ctx.save();\n      ctx.translate(canvas.width / 2, canvas.height / 2);\n      ctx.rotate(angle);\n      ctx.strokeStyle = "#00f2fe";\n      ctx.lineWidth = 3;\n      ctx.strokeRect(-60, -60, 120, 120);\n      ctx.restore();\n      angle += 0.02;\n      requestAnimationFrame(render);\n    }\n    render();\n  }\n}\n\nglobalThis.App3D = App3D;\nif (typeof module !== "undefined" && module.exports) module.exports = App3D;'
      }
    }
  ];

  static openTemplateWizard() {
    try { localStorage.setItem('luno_project_intent', 'create_project'); } catch(e){}
    if (typeof LunoSpaDock !== 'undefined' && LunoSpaDock.mountView) {
      LunoSpaDock.mountView('projects');
    } else {
      const mainRoot = document.getElementById('luno-spa-content-area') || document.getElementById('app-root') || document.body;
      LunoProjectTemplates.mountFullPageView(mainRoot);
    }
  }

  static async mountFullPageView(container) {
    if (!container) return;
    container.innerHTML = '';

    const el = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          const e = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(e, attrs);
          return e;
        };

    const loadingCard = el('div', {
      style: { padding: '1.5rem', background: '#161b22', border: '1px solid #00f2fe', borderRadius: '10px', color: '#00f2fe', textAlign: 'center', fontFamily: 'monospace' }
    }, '⚡ Discovering workspace projects...');

    container.appendChild(loadingCard);

    let projects = [];
    let parentDir = '';
    try {
      if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchProjectsList) {
        const data = await LunoApiClient.fetchProjectsList();
        projects = data.projects || [];
        parentDir = data.parentDir || '';
      } else {
        const res = await fetch('/api/projects/list');
        const data = await res.json();
        projects = data.projects || [];
        parentDir = data.parentDir || '';
      }
    } catch (err) {
      console.error('[Projects View Error]', err);
    }

    LunoProjectTemplates.renderFullPageUI(container, projects, parentDir);
  }

  static renderFullPageUI(container, projects = [], parentDir = '') {
    container.innerHTML = '';
    const m = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          const e = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(e, attrs);
          return e;
        };

    const currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

    let intent = '';
    try {
      intent = localStorage.getItem('luno_project_intent') || '';
      localStorage.removeItem('luno_project_intent');
    } catch(e){}

    const isCreateIntent = (intent === 'create_project');

    let guidanceBanner = null;
    if (isCreateIntent) {
      guidanceBanner = m('div', {
        style: { background: 'linear-gradient(135deg, #0d2d4a 0%, #161b22 100%)', border: '2px solid #58a6ff', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', boxShadow: '0 4px 16px rgba(88,166,255,0.25)' }
      },
        m('div', { style: { color: '#58a6ff', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🎯 Choose a Template to Start Your New Project'),
        m('p', { style: { fontSize: '0.78rem', color: '#c9d1d9', margin: 0, lineHeight: '1.4' } },
          'Select one of the starter templates below. Luno will automatically generate the directory structure and launch it as your active workspace!'
        )
      );
    }

    const headerBox = m('div', {
      style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: '0 4px 16px rgba(0,242,254,0.15)' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' } },
        m('h2', { style: { color: '#00f2fe', fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🚀 Workspace Projects Hub'),
        m('span', { style: { fontSize: '0.72rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Active Target: ' + currentTarget)
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
        'Switch target projects seamlessly across ' + (parentDir || 'your workspace') + '. Launching a project synchronizes the Outbox, Inbox, and App Preview.'
      )
    );

    const userProjects = projects.filter(p => !p.isLibrary && p.name !== 'Library');
    const projectCards = userProjects.map(p => LunoProjectTemplates.buildProjectCard(p, container));

    const starterTplSection = m('div', {
      style: { background: '#161b22', border: '2px solid #58a6ff', borderRadius: '10px', padding: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', boxShadow: '0 4px 16px rgba(88,166,255,0.15)' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        m('strong', { style: { color: '#58a6ff', fontSize: '0.95rem' } }, '🌱 Starter App Templates'),
        m('span', { style: { fontSize: '0.7rem', color: '#58a6ff', background: '#0d2d4a', border: '1px solid #0088cc', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 'bold' } }, 'Instant Setup')
      ),
      m('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.45rem' } },
        ...LunoProjectTemplates.TEMPLATES.map(t => m('div', {
          style: { background: '#0d1117', border: '1px solid #30363d', padding: '0.7rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s ease' },
          onclick: () => LunoProjectTemplates.createFromTemplate(t.id, parentDir)
        },
          m('div', {},
            m('strong', { style: { color: '#58a6ff', fontSize: '0.85rem', display: 'block', marginBottom: '0.15rem' } }, t.name),
            m('span', { style: { fontSize: '0.72rem', color: '#8b949e' } }, t.desc)
          ),
          m('span', { style: { color: '#3fb950', fontSize: '0.78rem', fontWeight: 'bold', flexShrink: 0, background: '#0d2818', border: '1px solid #238636', padding: '0.25rem 0.6rem', borderRadius: '6px' } }, 'Select Template ➔')
        ))
      )
    );

    const userProjectsHeader = m('strong', { style: { color: '#00f2fe', fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' } }, '📁 Existing Workspace Applications');

    const listContainer = m('div', {
      style: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.5rem' }
    }, ...projectCards);

    container.appendChild(headerBox);
    if (guidanceBanner) container.appendChild(guidanceBanner);
    container.appendChild(starterTplSection);
    container.appendChild(userProjectsHeader);
    container.appendChild(listContainer);
  }

  static buildProjectCard(p, container) {
    const el = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          const e = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(e, attrs);
          return e;
        };
  
    const isLib = p.isLibrary;
    const isCore = (p.name === 'Luno');
    const currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '';
    const isActive = (p.name === currentTarget);
  
    const card = el('div', {
      style: {
        background: isActive ? '#0d2818' : '#0d1117',
        border: '1px solid ' + (isActive ? '#238636' : (isLib ? '#8257e5' : '#30363d')),
        borderRadius: '8px',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        boxShadow: isActive ? '0 0 12px rgba(35,134,54,0.3)' : 'none'
      }
    },
      el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        el('strong', { style: { color: isActive ? '#3fb950' : (isLib ? '#d2a8ff' : '#00f2fe'), fontSize: '0.95rem' } },
          (isLib ? '📚 ' : '📁 ') + p.name + ' ',
          el('span', { style: { fontWeight: 'normal', fontSize: '0.72rem', color: '#8b949e' } }, '(' + (p.version || '1.0.0') + ')')
        ),
        el('span', {
          style: {
            fontSize: '0.7rem',
            fontWeight: 'bold',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            background: isActive ? '#238636' : '#21262d',
            color: isActive ? '#fff' : '#8b949e'
          }
        }, isActive ? '✓ Active Target' : (isLib ? 'Shared Library' : (isCore ? 'Core System' : 'Project')))
      ),
      el('div', { style: { fontSize: '0.78rem', color: '#c9d1d9', lineHeight: '1.35' } }, p.description || 'Workspace project folder.'),
      el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem', fontSize: '0.72rem', color: '#8b949e', flexWrap: 'wrap', gap: '0.4rem' } },
        el('span', {}, '📊 ' + (p.fileCount || 0) + ' file(s) (' + (p.totalSizeKb || 0) + ' KB)'),
        el('div', { style: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' } },
          el('button', {
            style: { padding: '0.3rem 0.6rem', background: '#161b22', color: '#00f2fe', border: '1px solid #00f2fe', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace' },
            onclick: () => {
              if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
                ClientApp.setTargetProject(p.name, { openTab: true });
              }
              if (typeof LunoSpaDock !== 'undefined') {
                LunoSpaDock.mountView('app_' + p.name);
              }
            }
          }, '👁️ Preview'),
          !isActive ? el('button', {
            style: { padding: '0.3rem 0.6rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace' },
            onclick: () => {
              if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
                ClientApp.setTargetProject(p.name);
                if (typeof ClientApp.showToast === 'function') {
                  ClientApp.showToast('Active Target switched to ' + p.name, 'success', '📁');
                }
              }
              LunoProjectTemplates.mountFullPageView(container);
            }
          }, '⚡ Set Target ➔') : null,
          (!isCore && !isLib) ? el('button', {
            style: { padding: '0.3rem 0.6rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace' },
            title: 'Fork and duplicate this project with full binary asset preservation and class renaming',
            onclick: () => LunoProjectTemplates.forkProject(p.name, container)
          }, '🍴 Fork') : null,
          (!isCore && !isLib) ? el('button', {
            style: { padding: '0.3rem 0.55rem', background: '#21262d', color: '#ff7b72', border: '1px solid #da3633', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'monospace' },
            title: 'Safely delete project directory from disk',
            onclick: () => LunoProjectTemplates.deleteProject(p.name, container)
          }, '🗑️') : null
        )
      )
    );
  
    return card;
  }

  static async deleteProject(projectName, container) {
    if (!projectName || projectName === 'Luno' || projectName.toLowerCase() === 'library') {
      alert('Cannot delete core system or shared library folders.');
      return;
    }

    const confirmDelete = confirm('⚠️ Are you sure you want to permanently delete project [' + projectName + '] from disk? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      const serverScriptObj = {
        files: [],
        serverScript: [
          'const fs = require("fs");',
          'const path = require("path");',
          'const projRoot = LunoServer.resolveProjectBaseDir("' + projectName + '");',
          'const webRoot = LunoServer.getWebRootDir();',
          'if (projRoot && projRoot.startsWith(webRoot) && projRoot !== webRoot && !projRoot.endsWith("Luno")) {',
          '  fs.rmSync(projRoot, { recursive: true, force: true });',
          '  return "Deleted project folder: " + projRoot;',
          '} else {',
          '  throw new Error("Invalid project deletion path target.");',
          '}'
        ].join('\n')
      };

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverScriptObj)
      });
      const data = await res.json();

      if (res.ok && data && data.success) {
        if (typeof ClientApp !== 'undefined') {
          if (ClientApp.getTargetProject() === projectName) {
            ClientApp.setTargetProject('Luno');
          }
          if (ClientApp.showToast) {
            ClientApp.showToast('Deleted project [' + projectName + '] from disk', 'info', '🗑️');
          }
        }
        LunoProjectTemplates.mountFullPageView(container);
      } else {
        alert('Delete failed: ' + ((data && data.error) || 'Server error'));
      }
    } catch (e) {
      alert('Delete network exception: ' + e.message);
    }
  }

    static async createFromTemplate(templateId, parentDir) {
      const tpl = LunoProjectTemplates.TEMPLATES.find(t => t.id === templateId);
      if (!tpl) return;
  
      const rawName = prompt('Enter new project name (letters, numbers, underscores):', 'my_new_app');
      if (!rawName) return;
  
      const cleanName = rawName.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
      if (!cleanName) {
        alert('Invalid project name. Please use alphanumeric characters, dashes, or underscores.');
        return;
      }
  
      let filesList = [];
      for (const [relFile, content] of Object.entries(tpl.files)) {
        filesList.push({
          filePath: cleanName + '/' + relFile,
          content: content,
          action: 'direct'
        });
      }
  
      // Ensure .nojekyll for instant GitHub Pages support
      filesList.push({
        filePath: cleanName + '/.nojekyll',
        content: '',
        action: 'direct'
      });
  
      try {
        if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
          ClientApp.setTargetProject(cleanName, { openTab: true });
        }
        await fetch('/api/save?project=' + encodeURIComponent(cleanName), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: filesList, serverScript: '', project: cleanName })
        });
        if (typeof LunoSpaDock !== 'undefined') {
          LunoSpaDock.mountView('app_' + cleanName);
        }
        if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
          ClientApp.showToast('Created project [' + cleanName + '] from template!', 'success', '🌱');
        }
      } catch (e) {
        alert('Error creating project: ' + e.message);
      }
    }

    static async forkProject(sourceProjectName, container) {
    if (!sourceProjectName) return;
  
    var defaultNewName = sourceProjectName + '_fork';
    var rawName = prompt('Enter name for your new project fork (cloning ' + sourceProjectName + '):', defaultNewName);
    if (!rawName) return;
  
    var cleanNewName = rawName.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanNewName) {
      alert('Invalid project name. Please use alphanumeric characters, dashes, or underscores.');
      return;
    }
  
    if (cleanNewName === sourceProjectName) {
      alert('Fork name must be different from the source project name.');
      return;
    }
  
    if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
      ClientApp.showToast('Forking [' + sourceProjectName + '] into [' + cleanNewName + '] (with all media & class renaming)...', 'info', '🍴');
    }
  
    try {
      var res = await fetch('/api/projects/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProject: sourceProjectName,
          newProjectName: cleanNewName
        })
      });
  
      var data = await res.json();
  
      if (res.ok && data && data.success) {
        if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
          ClientApp.setTargetProject(cleanNewName, { openTab: true });
          if (ClientApp.showToast) {
            ClientApp.showToast('Successfully forked [' + sourceProjectName + '] into [' + cleanNewName + ']! (' + (data.copiedFilesCount || 0) + ' files preserved, class renamed to ' + (data.targetClassName || 'App') + ')', 'success', '🚀');
          }
        }
  
        if (typeof LunoSpaDock !== 'undefined') {
          LunoSpaDock.mountView('app_' + cleanNewName);
        } else if (container) {
          LunoProjectTemplates.mountFullPageView(container);
        }
      } else {
        throw new Error((data && data.error) || 'Failed to fork project on server');
      }
    } catch (err) {
      console.error('[Fork Project Error]', err);
      alert('Error forking project: ' + err.message);
    }
  }
}

globalThis.LunoProjectTemplates = LunoProjectTemplates;
if (typeof module !== "undefined" && module.exports) module.exports = LunoProjectTemplates;