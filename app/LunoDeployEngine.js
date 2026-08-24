class LunoDeployEngine {
  constructor() {}

  static REPO_MAP_KEY = 'luno_github_repo_mappings_v1';
  static GITHUB_ORG = 'RecursiveSelfImprovement';

  static getRepoMappings() {
    var defaults = {
      'Luno': 'Luno',
      'Basic3D': 'Basic3D',
      'VideoEditor': 'VideoEditor',
      'guessTheNoteGame': 'guessTheNoteGame',
      'VideoPrepper': 'VideoPrepper',
      'BasicsWithDialogBox': 'BasicsWithDialogBox',
      'SimpleTest': 'SimpleTest',
      'Library': 'Library',
      'images': 'images',
      'MySituation': 'situation'
    };

    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(LunoDeployEngine.REPO_MAP_KEY);
        if (raw) return Object.assign(defaults, JSON.parse(raw));
      }
    } catch(e) {}
    return defaults;
  }

  static setRepoMapping(projectName, remoteRepoName) {
    if (!projectName) return;
    var mappings = LunoDeployEngine.getRepoMappings();
    mappings[projectName] = remoteRepoName.trim();
    try {
      localStorage.setItem(LunoDeployEngine.REPO_MAP_KEY, JSON.stringify(mappings));
    } catch(e) {}
  }

  static getRemoteRepoName(projectName) {
    var mappings = LunoDeployEngine.getRepoMappings();
    return mappings[projectName] || projectName;
  }

  static async checkProjectGitStatus(projectName) {
    var pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');

    try {
      var serverScript = [
        'const { execSync } = require("child_process");',
        'const fs = require("fs");',
        'const path = require("path");',
        'const projRoot = LunoServer.resolveProjectBaseDir("' + pName + '");',
        '',
        'if (!fs.existsSync(projRoot)) {',
        '  return { exists: false, error: "Project directory not found on disk: " + projRoot };',
        '}',
        '',
        'const gitDir = path.join(projRoot, ".git");',
        'const hasGit = fs.existsSync(gitDir);',
        'let remoteUrl = "";',
        'let currentBranch = "main";',
        'let statusText = "";',
        '',
        'if (hasGit) {',
        '  try {',
        '    remoteUrl = (execSync("git remote get-url origin", { cwd: projRoot, encoding: "utf8" }) || "").trim();',
        '  } catch(e) {}',
        '  try {',
        '    currentBranch = (execSync("git branch --show-current", { cwd: projRoot, encoding: "utf8" }) || "main").trim();',
        '  } catch(e) {}',
        '  try {',
        '    statusText = (execSync("git status --short", { cwd: projRoot, encoding: "utf8" }) || "").trim();',
        '  } catch(e) {}',
        '}',
        '',
        'const hasNoJekyll = fs.existsSync(path.join(projRoot, ".nojekyll"));',
        'const hasIndexHtml = fs.existsSync(path.join(projRoot, "index.html"));',
        '',
        'return {',
        '  exists: true,',
        '  projectName: "' + pName + '",',
        '  dirPath: projRoot,',
        '  hasGit: hasGit,',
        '  remoteUrl: remoteUrl,',
        '  currentBranch: currentBranch,',
        '  statusText: statusText,',
        '  hasNoJekyll: hasNoJekyll,',
        '  hasIndexHtml: hasIndexHtml',
        '};'
      ].join('\n');

      var res = await fetch('/api/save?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], serverScript: serverScript, project: pName })
      });
      var data = await res.json();
      return (data && data.llmFeedback) ? JSON.parse(data.llmFeedback.replace(/^⚡ SERVER SCRIPT OUTPUT:[\r\n]+(?:--- Return Value ---\s*)?/i, '').trim()) : data;
    } catch(e) {
      return { success: false, error: e.message };
    }
  }

  static async ensureGitHubPagesParity(projectName) {
    var pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');

    try {
      var serverScript = [
        'const fs = require("fs");',
        'const path = require("path");',
        'const projRoot = LunoServer.resolveProjectBaseDir("' + pName + '");',
        'let actions = [];',
        '',
        'const noJekyllPath = path.join(projRoot, ".nojekyll");',
        'if (!fs.existsSync(noJekyllPath)) {',
        '  fs.writeFileSync(noJekyllPath, "", "utf8");',
        '  actions.push("Created .nojekyll in " + path.basename(projRoot));',
        '}',
        '',
        'return actions.length > 0 ? actions.join("\\n") : "GitHub Pages assets verified cleanly.";'
      ].join('\n');

      var res = await fetch('/api/save?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], serverScript: serverScript, project: pName })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static async initializeGitRepo(projectName, remoteUrl) {
    var pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');

    try {
      var serverScript = [
        'const { execSync } = require("child_process");',
        'const fs = require("fs");',
        'const path = require("path");',
        'const projRoot = LunoServer.resolveProjectBaseDir("' + pName + '");',
        'let output = "";',
        '',
        'if (!fs.existsSync(path.join(projRoot, ".git"))) {',
        '  output += (execSync("git init -b main", { cwd: projRoot, encoding: "utf8" }) || "") + "\\n";',
        '}',
        '',
        'const targetRemote = "' + (remoteUrl || '').trim() + '";',
        'if (targetRemote) {',
        '  try {',
        '    execSync("git remote remove origin", { cwd: projRoot, encoding: "utf8" });',
        '  } catch(e) {}',
        '  output += (execSync("git remote add origin " + targetRemote, { cwd: projRoot, encoding: "utf8" }) || "") + "\\n";',
        '}',
        '',
        'return output.trim() || "Git initialized cleanly for [" + path.basename(projRoot) + "].";'
      ].join('\n');

      var res = await fetch('/api/save?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], serverScript: serverScript, project: pName })
      });
      var data = await res.json();
      return data;
    } catch(e) {
      return { success: false, error: e.message };
    }
  }

  static async deployProjectToGitHub(projectName, commitMsg, customRemoteUrl) {
    var pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
    var msg = commitMsg || `[${pName}] Automated deployment via Luno Workspace`;

    try {
      await LunoDeployEngine.ensureGitHubPagesParity(pName);

      if (customRemoteUrl) {
        await LunoDeployEngine.initializeGitRepo(pName, customRemoteUrl);
      }

      var res = await fetch('/api/deploy?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: pName, commitMsg: msg })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static async mountUI(container) {
    if (!container) return;
    container.innerHTML = '';

    var m = (typeof LunoUIComponents !== 'undefined' && LunoUIComponents.makeElement)
      ? LunoUIComponents.makeElement
      : function(tag, attrs) {
          var el = document.createElement(tag || 'div');
          if (attrs && typeof attrs === 'object') Object.assign(el, attrs);
          for (var i = 2; i < arguments.length; i++) {
            var c = arguments[i];
            if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
          }
          return el;
        };

    var currentTarget = (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject) ? ClientApp.getTargetProject() : 'Luno';

    var headerCard = m('div', {
      style: { background: 'linear-gradient(135deg, #0d2818 0%, #161b22 100%)', border: '2px solid #238636', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', boxShadow: '0 4px 16px rgba(35,134,54,0.25)', fontFamily: 'monospace' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.35rem' } },
        m('h2', { style: { color: '#3fb950', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🚀 GitHub Pages Multi-Repo Deployment Hub'),
        m('span', { style: { fontSize: '0.72rem', color: '#00f2fe', background: '#003847', border: '1px solid #00f2fe', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Org: ' + LunoDeployEngine.GITHUB_ORG)
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#c9d1d9', margin: 0, lineHeight: '1.4' } },
        'Deploy each sibling project to its own independent GitHub repository under <strong style="color:#00f2fe;">' + LunoDeployEngine.GITHUB_ORG + '</strong>. All shared libraries and media assets automatically interlink across GitHub Pages sites.'
      )
    );

    var listArea = m('div', { id: 'deploy-projects-list', style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
      m('div', { style: { padding: '1rem', color: '#00f2fe', textAlign: 'center' } }, '⚡ Inspecting sibling Git repositories...')
    );

    container.appendChild(headerCard);
    container.appendChild(listArea);

    var pData = null;
    try {
      if (typeof LunoApiClient !== 'undefined' && LunoApiClient.fetchProjectsList) {
        pData = await LunoApiClient.fetchProjectsList();
      } else {
        var resP = await fetch('/api/projects/list');
        pData = await resP.json();
      }
    } catch(e) {}

    var projects = (pData && Array.isArray(pData.projects)) ? pData.projects : [{ name: 'Library' }, { name: 'Basic3D' }, { name: 'guessTheNoteGame' }, { name: 'VideoEditor' }, { name: 'MySituation' }, { name: 'Luno' }, { name: 'images' }];

    listArea.innerHTML = '';
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var card = await LunoDeployEngine.renderProjectDeployCard(p.name, m);
      listArea.appendChild(card);
    }
  }

  static async renderProjectDeployCard(projectName, m) {
    var pName = projectName;
    var remoteName = LunoDeployEngine.getRemoteRepoName(pName);
    var gitInfo = await LunoDeployEngine.checkProjectGitStatus(pName);

    var hasGit = Boolean(gitInfo && gitInfo.hasGit);
    var remoteUrl = (gitInfo && gitInfo.remoteUrl) || `git@github.com:${LunoDeployEngine.GITHUB_ORG}/${remoteName}.git`;
    var statusText = (gitInfo && gitInfo.statusText) || '';
    var uncommitted = statusText ? statusText.split('\n').filter(Boolean).length : 0;

    var remoteInput = m('input', {
      type: 'text',
      value: remoteUrl,
      placeholder: `git@github.com:${LunoDeployEngine.GITHUB_ORG}/${remoteName}.git`,
      style: { flex: 1, minWidth: '220px', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none' }
    });

    var commitInput = m('input', {
      type: 'text',
      value: `[${pName}] Deploy to GitHub Pages`,
      placeholder: 'Commit message...',
      style: { width: '100%', background: '#0d1117', color: '#00f2fe', border: '1px solid #30363d', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }
    });

    var outputBox = m('pre', {
      style: { display: 'none', background: '#070a13', border: '1px solid #1e293b', padding: '0.55rem', borderRadius: '6px', color: '#7ee787', fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '140px', overflowY: 'auto' }
    });

    var btnDeploy = m('button', {
      style: { padding: '0.6rem 1rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 8px rgba(35,134,54,0.3)' },
      onclick: async function() {
        btnDeploy.disabled = true;
        btnDeploy.textContent = '🚀 Deploying...';
        outputBox.style.display = 'block';
        outputBox.style.color = '#00f2fe';
        outputBox.textContent = '⚡ Staging, committing, and pushing to ' + (remoteInput.value.trim() || 'origin/main') + '...';

        try {
          var targetRemote = remoteInput.value.trim();
          var res = await LunoDeployEngine.deployProjectToGitHub(pName, commitInput.value.trim(), targetRemote);
          if (res && res.success) {
            outputBox.style.color = '#7ee787';
            outputBox.textContent = (res.output || 'Deployment pushed cleanly to GitHub!') + `\n\n🌐 Live at: https://${LunoDeployEngine.GITHUB_ORG.toLowerCase()}.github.io/${remoteName}/`;
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast(`Deployed [${pName}] to GitHub Pages!`, 'success', '🚀');
            }
          } else {
            outputBox.style.color = '#ff7b72';
            outputBox.textContent = '❌ Deployment Error:\n' + ((res && res.error) || 'Failed to push to remote.');
          }
        } catch(err) {
          outputBox.style.color = '#ff7b72';
          outputBox.textContent = '❌ Exception: ' + err.message;
        } finally {
          btnDeploy.disabled = false;
          btnDeploy.textContent = '🚀 1-Tap Deploy to GitHub Pages';
        }
      }
    }, '🚀 1-Tap Deploy to GitHub Pages');

    var liveUrl = `https://${LunoDeployEngine.GITHUB_ORG.toLowerCase()}.github.io/${remoteName}/`;

    var card = m('div', {
      style: { background: '#161b22', border: '1px solid ' + (hasGit ? '#30363d' : '#8257e5'), borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontFamily: 'monospace' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' } },
        m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.95rem' } }, '📁 ' + pName),
          (pName !== remoteName) ? m('span', { style: { color: '#d2a8ff', fontSize: '0.72rem' } }, '(Remote: ' + remoteName + ')') : null,
          m('a', { href: liveUrl, target: '_blank', style: { color: '#58a6ff', fontSize: '0.72rem', textDecoration: 'none', marginLeft: '0.3rem' } }, '🌐 Open Live Site ↗')
        ),
        m('span', {
          style: {
            fontSize: '0.7rem',
            fontWeight: 'bold',
            padding: '0.15rem 0.5rem',
            borderRadius: '10px',
            background: hasGit ? '#0d2818' : '#271052',
            color: hasGit ? '#3fb950' : '#d2a8ff',
            border: '1px solid ' + (hasGit ? '#238636' : '#8257e5')
          }
        }, hasGit ? ('Git Active (' + uncommitted + ' modified)') : '🌱 Standalone Folder')
      ),

      m('div', { style: { display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' } },
        m('span', { style: { fontSize: '0.75rem', color: '#8b949e', fontWeight: 'bold' } }, 'Remote URL:'),
        remoteInput
      ),

      commitInput,
      btnDeploy,
      outputBox
    );

    return card;
  }
}

globalThis.LunoDeployEngine = LunoDeployEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoDeployEngine;