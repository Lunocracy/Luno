class LunoProjectTemplates {
  constructor() {}

  static TEMPLATES = [
    {
      id: 'blank',
      name: '🌱 Blank Starter Web App',
      desc: 'Single-page web application template with standalone vanilla JS architecture and error boundary.',
      files: {
        'luno.json': '{\n  "name": "Starter Web App",\n  "version": "1.0.0",\n  "description": "Custom Luno web application",\n  "type": "luno-web-app",\n  "mainClass": "App",\n  "main": ["src/App.js"],\n  "library": [],\n  "styles": ["css/style.css"]\n}',
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Starter App</title>\n  <link rel="stylesheet" href="css/style.css">\n  <script>\n    window.addEventListener("error", function(e) {\n      var box = document.getElementById("app-container") || document.body;\n      var errMsg = e.message + " (" + (e.filename || "app") + ":" + e.lineno + ")";\n      box.innerHTML = "<div style=\'padding:1.25rem; background:#161b22; border:2px solid #da3633; border-radius:8px; color:#ff7b72; font-family:monospace;\'>" +\n        "<h3 style=\'margin-top:0; color:#f85149;\'>⚠️ Application Runtime Error</h3>" +\n        "<pre style=\'font-size:12px; white-space:pre-wrap; color:#c9d1d9;\'>" + errMsg + "</pre>" +\n        "<button style=\'margin-top:0.6rem; padding:0.4rem 0.8rem; background:#8257e5; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-family:monospace;\' onclick=\'if(window.parent && window.parent.postMessage) window.parent.postMessage({type:\"LUNO_SEND_INBOX\", payload:{rawText:\"Error Report:\\n\" + \"" + errMsg.replace(/"/g, "") + "\"}}, \"*\"); this.textContent=\"✓ Sent to Outbox!\";\'>📤 Send Error to AI Outbox</button>" +\n        "</div>";\n    });\n  <' + '/script>\n</head>\n<body>\n  <div id="app-container"></div>\n  <script src="/app/acorn.js"><' + '/script>\n  <script src="/app/LunoLoader.js"><' + '/script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      if (typeof LunoLoader !== "undefined") {\n        LunoLoader.loadApp("app-container");\n      }\n    });\n  <' + '/script>\n</body>\n</html>',
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
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>3D Canvas App</title>\n  <link rel="stylesheet" href="css/app3d.css">\n  <script>\n    window.addEventListener("error", function(e) {\n      var box = document.getElementById("app-container") || document.body;\n      var errMsg = e.message + " (" + (e.filename || "app") + ":" + e.lineno + ")";\n      box.innerHTML = "<div style=\'padding:1.25rem; background:#161b22; border:2px solid #da3633; border-radius:8px; color:#ff7b72; font-family:monospace;\'>" +\n        "<h3 style=\'margin-top:0; color:#f85149;\'>⚠️ 3D Viewport Error</h3>" +\n        "<pre style=\'font-size:12px; white-space:pre-wrap; color:#c9d1d9;\'>" + errMsg + "</pre>" +\n        "<button style=\'margin-top:0.6rem; padding:0.4rem 0.8rem; background:#8257e5; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-family:monospace;\' onclick=\'if(window.parent && window.parent.postMessage) window.parent.postMessage({type:\"LUNO_SEND_INBOX\", payload:{rawText:\"Error Report:\\n\" + \"" + errMsg.replace(/"/g, "") + "\"}}, \"*\"); this.textContent=\"✓ Sent to Outbox!\";\'>📤 Send Error to AI Outbox</button>" +\n        "</div>";\n    });\n  <' + '/script>\n</head>\n<body>\n  <div id="app-container"></div>\n  <script src="/app/acorn.js"><' + '/script>\n  <script src="/app/LunoLoader.js"><' + '/script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      if (typeof LunoLoader !== "undefined") {\n        LunoLoader.loadApp("app-container");\n      }\n    });\n  <' + '/script>\n</body>\n</html>',
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

        const headerBox = m('div', {
          style: { background: '#161b22', border: '2px solid #00f2fe', borderRadius: '10px', padding: '1rem', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: '0 4px 16px rgba(0,242,254,0.15)' }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' } },
            m('h2', { style: { color: '#00f2fe', fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🚀 Workspace Projects & Deploy Hub'),
            m('span', { style: { fontSize: '0.72rem', color: '#3fb950', background: '#0d2818', border: '1px solid #238636', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Active Target: ' + currentTarget)
          ),
          m('p', { style: { fontSize: '0.78rem', color: '#8b949e', margin: 0, lineHeight: '1.4' } },
            'Manage, preview, fork, and deploy workspace applications across ' + (parentDir || 'your workspace') + '. Tap <strong style="color:#00f2fe;">👁️ Preview</strong> to peek at any app in a tab, or <strong style="color:#3fb950;">⚡ Set Target</strong> to direct patches and code bundles to that app.'
          )
        );

        // Global GitHub Token Card
        const savedToken = (typeof LunoDeployEngine !== 'undefined') ? LunoDeployEngine.getGithubToken() : '';
        const tokenInput = m('input', {
          type: 'password',
          value: savedToken,
          placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx (Optional for auto-creating repos on GitHub)',
          style: { flex: 1, minWidth: '220px', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none' },
          oninput: function(e) {
            if (typeof LunoDeployEngine !== 'undefined') LunoDeployEngine.setGithubToken(e.target.value);
          }
        });

        const tokenCard = m('div', {
          style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }
        },
          m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' } },
            m('strong', { style: { color: '#d2a8ff', fontSize: '0.82rem' } }, '🔑 GitHub Token / 1-Click Auto-Create:'),
            m('a', { href: 'https://github.com/settings/tokens/new?scopes=repo', target: '_blank', style: { color: '#58a6ff', fontSize: '0.72rem', textDecoration: 'none' } }, 'Generate Token on GitHub ↗')
          ),
          m('div', { style: { display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' } },
            tokenInput,
            m('button', {
              style: { padding: '0.45rem 0.75rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
              onclick: function() {
                if (typeof LunoDeployEngine !== 'undefined') {
                  LunoDeployEngine.setGithubToken(tokenInput.value);
                  if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
                    ClientApp.showToast('Saved GitHub Personal Access Token!', 'success', '🔑');
                  }
                }
              }
            }, 'Save Token')
          )
        );

        const userProjects = projects.filter(p => !p.isLibrary && p.name !== 'Library');

        // Pinned top-3 sort: BasicsWithDialogBox -> Basic3D -> Luno -> alphabetical
        userProjects.sort((a, b) => {
          const order = { 'BasicsWithDialogBox': 1, 'Basic3D': 2, 'Luno': 3 };
          const rankA = order[a.name] || 999;
          const rankB = order[b.name] || 999;
          if (rankA !== rankB) return rankA - rankB;
          return (a.name || '').localeCompare(b.name || '');
        });

        const projectCards = userProjects.map(p => LunoProjectTemplates.buildProjectCard(p, container));

        const userProjectsHeader = m('strong', { style: { color: '#00f2fe', fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' } }, '📁 Workspace Applications (' + userProjects.length + ')');

        const listContainer = m('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.5rem' }
        }, ...projectCards);

        container.appendChild(headerBox);
        container.appendChild(tokenCard);
        container.appendChild(userProjectsHeader);
        container.appendChild(listContainer);
      }

  static buildProjectCard(p, container) {
        const el = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
          ? LunoUIComponents.makeElement
          : function(tag, attrs) {
              const e = document.createElement(tag || 'div');
              if (attrs && typeof attrs === 'object') Object.assign(e, attrs);
              for (let i = 2; i < arguments.length; i++) {
                const c = arguments[i];
                if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
              }
              return e;
            };

        const isLib = p.isLibrary || p.name === 'Library';
        const isCore = (p.name === 'Luno');
        const currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : '';
        const isActive = (p.name === currentTarget);
        const isExpanded = LunoProjectTemplates.expandedProjects.has(p.name);

        // Outer Card Container
        const card = el('div', {
          className: 'luno-project-card',
          dataset: { projectName: p.name },
          style: {
            background: isActive ? '#0d2818' : '#0d1117',
            border: '1px solid ' + (isActive ? '#238636' : (isLib ? '#8257e5' : '#30363d')),
            borderRadius: '8px',
            padding: '0.75rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: isActive ? '0 0 12px rgba(35,134,54,0.3)' : 'none',
            transition: 'border-color 0.15s ease, background-color 0.15s ease'
          }
        });

        // Expand / Collapse Chevron
        const arrow = el('span', {
          style: {
            fontSize: '0.8rem',
            color: isExpanded ? '#00f2fe' : '#8b949e',
            fontWeight: 'bold',
            marginLeft: '0.35rem',
            cursor: 'pointer',
            userSelect: 'none'
          }
        }, isExpanded ? '▲' : '▼');

        // Status Badge Element
        const statusBadge = el('span', {
          className: 'project-status-badge',
          style: {
            fontSize: '0.68rem',
            fontWeight: 'bold',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: isActive ? '#238636' : '#21262d',
            color: isActive ? '#fff' : '#8b949e'
          }
        }, isActive ? '✓ Active Target' : (isLib ? 'Shared Library' : (isCore ? 'Self-Improve' : 'Project')));

        // Action Buttons: Luno Core hides the recursive preview button
        const btnPreview = el('button', {
          style: {
            display: isCore ? 'none' : 'inline-block',
            padding: '0.3rem 0.6rem',
            background: '#161b22',
            color: '#00f2fe',
            border: '1px solid #00f2fe',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          },
          onclick: (e) => {
            e.stopPropagation();
            if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
              ClientApp.setTargetProject(p.name, { openTab: true });
            }
            if (typeof LunoSpaDock !== 'undefined') {
              LunoSpaDock.mountView('app_' + p.name);
            }
          }
        }, '👁️ Preview');

        const btnSetTarget = el('button', {
          className: 'btn-set-project-target',
          style: {
            display: !isActive ? 'inline-block' : 'none',
            padding: '0.3rem 0.6rem',
            background: '#238636',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          },
          onclick: (e) => {
            e.stopPropagation();
            if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
              ClientApp.setTargetProject(p.name);
              if (typeof ClientApp.showToast === 'function') {
                ClientApp.showToast('Active Target switched to ' + p.name, 'success', '📁');
              }
            }

            // Update cards in-place without collapsing open panels
            const allCards = document.querySelectorAll('.luno-project-card');
            allCards.forEach(c => {
              const cName = c.dataset.projectName;
              const isNowActive = (cName === p.name);
              c.style.background = isNowActive ? '#0d2818' : '#0d1117';
              c.style.borderColor = isNowActive ? '#238636' : (cName === 'Library' ? '#8257e5' : '#30363d');
              c.style.boxShadow = isNowActive ? '0 0 12px rgba(35,134,54,0.3)' : 'none';

              const sBadge = c.querySelector('.project-status-badge');
              if (sBadge) {
                sBadge.style.background = isNowActive ? '#238636' : '#21262d';
                sBadge.style.color = isNowActive ? '#fff' : '#8b949e';
                sBadge.textContent = isNowActive ? '✓ Active Target' : (cName === 'Library' ? 'Shared Library' : (cName === 'Luno' ? 'Self-Improve' : 'Project'));
              }

              const targetBtn = c.querySelector('.btn-set-project-target');
              if (targetBtn) {
                targetBtn.style.display = isNowActive ? 'none' : 'inline-block';
              }
            });
          }
        }, '⚡ Set Target');

        // Compact Top Row (Always Visible)
        const topRow = el('div', {
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '0.4rem' },
          onclick: async (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT') return;
            const nowExpanded = !LunoProjectTemplates.expandedProjects.has(p.name);
            if (nowExpanded) {
              LunoProjectTemplates.expandedProjects.add(p.name);
            } else {
              LunoProjectTemplates.expandedProjects.delete(p.name);
            }
            arrow.textContent = nowExpanded ? '▲' : '▼';
            arrow.style.color = nowExpanded ? '#00f2fe' : '#8b949e';
            expandPanel.style.display = nowExpanded ? 'flex' : 'none';

            if (nowExpanded && !expandPanel.dataset.loaded) {
              expandPanel.dataset.loaded = 'true';
              if (!isLib && typeof LunoDeployEngine !== 'undefined' && LunoDeployEngine.renderProjectDeployPanel) {
                await LunoDeployEngine.renderProjectDeployPanel(p.name, el, deploySlot);
              }
            }
          }
        },
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' } },
            el('strong', { style: { color: isActive ? '#3fb950' : (isLib ? '#d2a8ff' : '#00f2fe'), fontSize: '0.95rem' } },
              (isLib ? '📚 ' : '📁 ') + p.name + ' ',
              el('span', { style: { fontWeight: 'normal', fontSize: '0.72rem', color: '#8b949e' } }, '(' + (p.version || '1.0.0') + ')')
            ),
            statusBadge
          ),
          el('div', { style: { display: 'flex', gap: '0.35rem', alignItems: 'center' } },
            btnPreview,
            btnSetTarget,
            arrow
          )
        );

        // Expandable Details & Deploy Sub-Panel
        const deploySlot = el('div', { style: { width: '100%' } });
        const expandPanel = el('div', {
          className: 'luno-project-expand-panel',
          style: {
            display: isExpanded ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '0.35rem',
            paddingTop: '0.45rem',
            borderTop: '1px solid #21262d'
          }
        },
          el('div', { style: { fontSize: '0.78rem', color: '#c9d1d9', lineHeight: '1.35' } }, p.description || 'Workspace project folder.'),
          el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#8b949e', flexWrap: 'wrap', gap: '0.4rem' } },
            el('span', {}, '📊 ' + (p.fileCount || 0) + ' file(s)'),
            el('div', { style: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' } },
              (!isCore && !isLib) ? el('button', {
                style: { padding: '0.25rem 0.55rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'monospace' },
                title: 'Fork and duplicate this project with full asset preservation and class renaming',
                onclick: (e) => {
                  e.stopPropagation();
                  LunoProjectTemplates.forkProject(p.name, container);
                }
              }, '🍴 Fork') : null,
              (!isCore && !isLib) ? el('button', {
                style: { padding: '0.25rem 0.55rem', background: '#21262d', color: '#ff7b72', border: '1px solid #da3633', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'monospace' },
                title: 'Safely delete project directory from disk',
                onclick: (e) => {
                  e.stopPropagation();
                  LunoProjectTemplates.deleteProject(p.name, container);
                }
              }, '🗑️ Delete') : null
            )
          ),
          deploySlot
        );

        // Initial mount check if already expanded
        if (isExpanded) {
          expandPanel.dataset.loaded = 'true';
          if (!isLib && typeof LunoDeployEngine !== 'undefined' && LunoDeployEngine.renderProjectDeployPanel) {
            LunoDeployEngine.renderProjectDeployPanel(p.name, el, deploySlot);
          }
        }

        card.appendChild(topRow);
        card.appendChild(expandPanel);

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

      const data = await LunoApiClient.savePayload(serverScriptObj, projectName);

      if (data && data.success) {
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
        alert('Delete failed: ' + ((data && data.error) || 'Storage error'));
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

    filesList.push({
      filePath: cleanName + '/.nojekyll',
      content: '',
      action: 'direct'
    });

    try {
      if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
        ClientApp.setTargetProject(cleanName, { openTab: true });
      }

      await LunoApiClient.savePayload({ files: filesList, serverScript: '', project: cleanName }, cleanName);

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
      var data = await LunoApiClient.forkProject(sourceProjectName, cleanNewName);

      if (data && data.success) {
        if (typeof ClientApp !== 'undefined' && ClientApp.setTargetProject) {
          ClientApp.setTargetProject(cleanNewName, { openTab: true });
          if (ClientApp.showToast) {
            ClientApp.showToast('Successfully forked [' + sourceProjectName + '] into [' + cleanNewName + ']! (' + (data.copiedFilesCount || 0) + ' files preserved, class renamed to ' + (data.entrypointClass || 'App') + ')', 'success', '🚀');
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

  static expandedProjects = new Set();
}

globalThis.LunoProjectTemplates = LunoProjectTemplates;
if (typeof module !== "undefined" && module.exports) module.exports = LunoProjectTemplates;