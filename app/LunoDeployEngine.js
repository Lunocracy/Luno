class LunoDeployEngine {
  constructor() {}

  static REPO_MAP_KEY = 'luno_github_repo_mappings_v1';
  static GITHUB_TOKEN_KEY = 'luno_github_pat_token';
  static GITHUB_ORG = 'Lunocracy';

  static getGithubToken() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(LunoDeployEngine.GITHUB_TOKEN_KEY) || '';
      }
    } catch(e) {}
    return '';
  }

  static setGithubToken(token) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LunoDeployEngine.GITHUB_TOKEN_KEY, (token || '').trim());
      }
    } catch(e) {}
  }

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

  static async createRemoteRepoOnGitHub(repoName) {
    var token = LunoDeployEngine.getGithubToken();
    if (!token) return { success: false, noToken: true };

    try {
      var res = await fetch('https://api.github.com/orgs/' + LunoDeployEngine.GITHUB_ORG + '/repos', {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: 'Standalone repository for ' + repoName + ' - deployed via Luno Workspace',
          homepage: 'https://' + LunoDeployEngine.GITHUB_ORG.toLowerCase() + '.github.io/' + repoName + '/',
          private: false,
          has_issues: true,
          has_projects: false,
          has_wiki: false
        })
      });

      var data = await res.json();
      if (res.ok) {
        return { success: true, repoUrl: data.html_url, sshUrl: data.ssh_url };
      } else {
        if (data.errors && data.errors.some(function(e) { return e.message && e.message.includes('already exists'); })) {
          return { success: true, alreadyExists: true, message: 'Repository already exists on GitHub.' };
        }
        return { success: false, error: data.message || 'GitHub API error' };
      }
    } catch(err) {
      return { success: false, error: err.message };
    }
  }

  static async enableGitHubPages(repoName) {
    var token = LunoDeployEngine.getGithubToken();
    if (!token) return { success: false };

    try {
      var res = await fetch('https://api.github.com/repos/' + LunoDeployEngine.GITHUB_ORG + '/' + repoName + '/pages', {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: {
            branch: 'main',
            path: '/'
          }
        })
      });
      return await res.json();
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
        'const webRoot = LunoServer.getWebRootDir();',
        'const libraryRoot = path.join(webRoot, "Library");',
        'let actions = [];',
        '',
        '// 1. Ensure .nojekyll in project root',
        'const noJekyllPath = path.join(projRoot, ".nojekyll");',
        'if (!fs.existsSync(noJekyllPath)) {',
        '  fs.writeFileSync(noJekyllPath, "", "utf8");',
        '  actions.push("Created .nojekyll in " + path.basename(projRoot));',
        '}',
        '',
        '// 2. Ensure central Library/ in workspace root has canonical LunoLoader.js and DomBasics.js',
        'const coreLunoLoader = path.join(webRoot, "Luno", "app", "LunoLoader.js");',
        'const centralLunoLoader = path.join(libraryRoot, "LunoLoader.js");',
        'if (fs.existsSync(coreLunoLoader) && fs.existsSync(libraryRoot)) {',
        '  fs.copyFileSync(coreLunoLoader, centralLunoLoader);',
        '}',
        '',
        '// 3. Self-Contained Library Copy into Target Sibling Project (Single Lowercase library/ folder)',
        'const lunoJsonPath = path.join(projRoot, "luno.json");',
        'if (fs.existsSync(lunoJsonPath) && pName !== "Library") {',
        '  try {',
        '    const meta = JSON.parse(fs.readFileSync(lunoJsonPath, "utf8"));',
        '    const libs = Array.isArray(meta.library) ? meta.library.slice() : [];',
        '    if (!libs.includes("LunoLoader.js")) libs.push("LunoLoader.js");',
        '    if (!libs.includes("DomBasics.js")) libs.push("DomBasics.js");',
        '    ',
        '    const localLibDir = path.join(projRoot, "library");',
        '    fs.mkdirSync(localLibDir, { recursive: true });',
        '    ',
        '    const legacyCapLib = path.join(projRoot, "Library");',
        '    if (fs.existsSync(legacyCapLib) && legacyCapLib !== projRoot) {',
        '      try { fs.rmSync(legacyCapLib, { recursive: true, force: true }); } catch(e){}',
        '    }',
        '    ',
        '    for (const lib of libs) {',
        '      const cleanLib = lib.replace(/^Library\\//i, "").replace(/^library\\//i, "");',
        '      let srcFile = path.join(libraryRoot, cleanLib);',
        '      if (!fs.existsSync(srcFile) && cleanLib === "LunoLoader.js") {',
        '        srcFile = coreLunoLoader;',
        '      }',
        '      if (fs.existsSync(srcFile)) {',
        '        fs.copyFileSync(srcFile, path.join(localLibDir, cleanLib));',
        '        actions.push("Bundled library/" + cleanLib + " into [" + pName + "]");',
        '      }',
        '    }',
        '  } catch(e) {}',
        '}',
        '',
        '// 4. Ensure index.html uses relative library/ paths',
        'const indexPath = path.join(projRoot, "index.html");',
        'if (fs.existsSync(indexPath)) {',
        '  try {',
        '    let idxContent = fs.readFileSync(indexPath, "utf8");',
        '    if (idxContent.includes("/Library/") || idxContent.includes("/library/")) {',
        '      idxContent = idxContent.replace(/src=["\']\\/Library\\//gi, \'src="library/\');',
        '      idxContent = idxContent.replace(/src=["\']\\/library\\//gi, \'src="library/\');',
        '      fs.writeFileSync(indexPath, idxContent, "utf8");',
        '      actions.push("Normalized index.html script tags to relative paths in [" + pName + "]");',
        '    }',
        '  } catch(e) {}',
        '}',
        '',
        '// 5. Generate deploy-time files.json manifest for static hosting bulk-discovery',
        'const allFiles = LunoServer.getAllFiles(projRoot);',
        'const manifestItems = allFiles.map(f => ({',
        '  path: f.relPath,',
        '  size: f.size,',
        '  name: f.name',
        '}));',
        'fs.writeFileSync(path.join(projRoot, "files.json"), JSON.stringify(manifestItems, null, 2) + "\\n", "utf8");',
        'actions.push("Generated files.json with " + manifestItems.length + " entries in [" + pName + "]");',
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
    var remoteName = LunoDeployEngine.getRemoteRepoName(pName);
    var msg = commitMsg || ('[' + pName + '] Automated deployment via Luno Workspace');

    try {
      if (LunoDeployEngine.getGithubToken()) {
        try {
          await LunoDeployEngine.createRemoteRepoOnGitHub(remoteName);
        } catch(e) {}
      }

      await LunoDeployEngine.ensureGitHubPagesParity(pName);

      var targetRemote = customRemoteUrl || ('git@github.com:' + LunoDeployEngine.GITHUB_ORG + '/' + remoteName + '.git');
      await LunoDeployEngine.initializeGitRepo(pName, targetRemote);

      var res = await fetch('/api/deploy?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: pName, commitMsg: msg })
      });
      var deployData = await res.json();

      if (deployData && deployData.success && LunoDeployEngine.getGithubToken()) {
        try {
          await LunoDeployEngine.enableGitHubPages(remoteName);
        } catch(e) {}
      }

      return deployData;
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
    var savedToken = LunoDeployEngine.getGithubToken();

    var tokenInput = m('input', {
      type: 'password',
      value: savedToken,
      placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx (Optional for auto-creating repos on GitHub)',
      style: { flex: 1, minWidth: '220px', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none' },
      oninput: function(e) {
        LunoDeployEngine.setGithubToken(e.target.value);
      }
    });

    var tokenCard = m('div', {
      style: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        m('strong', { style: { color: '#d2a8ff', fontSize: '0.82rem' } }, '🔑 GitHub Token / 1-Click Auto-Create:'),
        m('a', { href: 'https://github.com/settings/tokens/new?scopes=repo', target: '_blank', style: { color: '#58a6ff', fontSize: '0.72rem', textDecoration: 'none' } }, 'Generate Token on GitHub ↗')
      ),
      m('div', { style: { display: 'flex', gap: '0.4rem', alignItems: 'center' } },
        tokenInput,
        m('button', {
          style: { padding: '0.45rem 0.75rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
          onclick: function() {
            LunoDeployEngine.setGithubToken(tokenInput.value);
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast('Saved GitHub Personal Access Token!', 'success', '🔑');
            }
          }
        }, 'Save Token')
      ),
      m('span', { style: { fontSize: '0.7rem', color: '#8b949e', lineHeight: '1.3' } },
        'With a token saved, tapping "Deploy" creates missing repositories on GitHub and activates GitHub Pages automatically.'
      )
    );

    var headerCard = m('div', {
      style: { background: 'linear-gradient(135deg, #0d2818 0%, #161b22 100%)', border: '2px solid #238636', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', boxShadow: '0 4px 16px rgba(35,134,54,0.25)', fontFamily: 'monospace' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.35rem' } },
        m('h2', { style: { color: '#3fb950', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' } }, '🚀 GitHub Pages Multi-Repo Deployment Hub'),
        m('span', { style: { fontSize: '0.72rem', color: '#00f2fe', background: '#003847', border: '1px solid #00f2fe', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' } }, 'Org: ' + LunoDeployEngine.GITHUB_ORG)
      ),
      m('p', { style: { fontSize: '0.78rem', color: '#c9d1d9', margin: 0, lineHeight: '1.4' } },
        'Deploy each sibling project to its own independent GitHub repository under <strong style="color:#00f2fe;">' + LunoDeployEngine.GITHUB_ORG + '</strong>. Required libraries and files.json manifests are automatically bundled during deployment.'
      )
    );

    var listArea = m('div', { id: 'deploy-projects-list', style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
      m('div', { style: { padding: '1rem', color: '#00f2fe', textAlign: 'center' } }, '⚡ Inspecting sibling Git repositories...')
    );

    container.appendChild(headerCard);
    container.appendChild(tokenCard);
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

    var projects = (pData && Array.isArray(pData.projects)) ? pData.projects : [{ name: 'Basic3D' }, { name: 'guessTheNoteGame' }, { name: 'VideoEditor' }, { name: 'MySituation' }, { name: 'Luno' }, { name: 'Library' }, { name: 'images' }];

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
    var remoteUrl = (gitInfo && gitInfo.remoteUrl) || ('git@github.com:' + LunoDeployEngine.GITHUB_ORG + '/' + remoteName + '.git');
    var statusText = (gitInfo && gitInfo.statusText) || '';
    var uncommitted = statusText ? statusText.split('\n').filter(Boolean).length : 0;

    var remoteInput = m('input', {
      type: 'text',
      value: remoteUrl,
      placeholder: 'git@github.com:' + LunoDeployEngine.GITHUB_ORG + '/' + remoteName + '.git',
      style: { flex: 1, minWidth: '220px', background: '#0d1117', color: '#7ee787', border: '1px solid #30363d', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none' }
    });

    var commitInput = m('input', {
      type: 'text',
      value: '[' + pName + '] Deploy to GitHub Pages',
      placeholder: 'Commit message...',
      style: { width: '100%', background: '#0d1117', color: '#00f2fe', border: '1px solid #30363d', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }
    });

    var outputBox = m('pre', {
      style: { display: 'none', background: '#070a13', border: '1px solid #1e293b', padding: '0.55rem', borderRadius: '6px', color: '#7ee787', fontSize: '0.72rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '180px', overflowY: 'auto' }
    });

    var newRepoWebUrl = 'https://github.com/organizations/' + LunoDeployEngine.GITHUB_ORG + '/repositories/new?name=' + encodeURIComponent(remoteName);
    var settingsPagesUrl = 'https://github.com/' + LunoDeployEngine.GITHUB_ORG + '/' + remoteName + '/settings/pages';
    var liveUrl = 'https://' + LunoDeployEngine.GITHUB_ORG.toLowerCase() + '.github.io/' + remoteName + '/';

    var btnCreateRemote = m('button', {
      style: { padding: '0.45rem 0.75rem', background: '#271052', color: '#d2a8ff', border: '1px solid #8257e5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' },
      title: 'Auto-create empty repository on GitHub via API or manual link',
      onclick: async function() {
        btnCreateRemote.disabled = true;
        btnCreateRemote.textContent = 'Creating...';
        outputBox.style.display = 'block';

        var token = LunoDeployEngine.getGithubToken();
        if (token) {
          outputBox.textContent = '⚡ Calling GitHub REST API to create repository [' + remoteName + '] under ' + LunoDeployEngine.GITHUB_ORG + '...';
          var res = await LunoDeployEngine.createRemoteRepoOnGitHub(remoteName);
          if (res.success) {
            outputBox.style.color = '#7ee787';
            outputBox.textContent = '✅ Created repository on GitHub: ' + (res.repoUrl || remoteName) + '\nReady to push!';
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast('Created repo [' + remoteName + '] on GitHub!', 'success', '✨');
            }
          } else {
            outputBox.style.color = '#ff7b72';
            outputBox.textContent = '❌ Could not create repo via API: ' + res.error + '\nOpening GitHub manual create page...';
            window.open(newRepoWebUrl, '_blank');
          }
        } else {
          outputBox.style.color = '#d2a8ff';
          outputBox.textContent = 'Opening GitHub create page for [' + remoteName + '] in new tab... (Or enter your Personal Access Token in the box above to create automatically)';
          window.open(newRepoWebUrl, '_blank');
        }

        btnCreateRemote.disabled = false;
        btnCreateRemote.textContent = '✨ Create Remote on GitHub';
      }
    }, '✨ Create Remote on GitHub');

    var btnDeploy = m('button', {
      style: { padding: '0.6rem 1rem', background: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 8px rgba(35,134,54,0.3)' },
      onclick: async function() {
        btnDeploy.disabled = true;
        btnDeploy.textContent = '🚀 Deploying...';
        outputBox.style.display = 'block';
        outputBox.style.color = '#00f2fe';
        outputBox.textContent = '⚡ Bundling library dependencies, generating files.json manifest, staging, committing, and pushing to ' + (remoteInput.value.trim() || 'origin/main') + '...';

        try {
          var targetRemote = remoteInput.value.trim();
          var res = await LunoDeployEngine.deployProjectToGitHub(pName, commitInput.value.trim(), targetRemote);
          if (res && res.success) {
            outputBox.style.color = '#7ee787';
            var tokenPresent = Boolean(LunoDeployEngine.getGithubToken());
            var msg = (res.output || 'Deployment pushed cleanly to GitHub!') + '\n\n🌐 Live URL: ' + liveUrl;
            if (!tokenPresent) {
              msg += '\n\nℹ️ FIRST TIME DEPLOYMENT NOTE:\nIf this is your first push to a new repo, activate Pages once here:\n👉 ' + settingsPagesUrl + ' (Branch: main, /root -> Save)';
            }
            outputBox.textContent = msg;
            if (typeof ClientApp !== 'undefined' && ClientApp.showToast) {
              ClientApp.showToast('Pushed [' + pName + '] to GitHub!', 'success', '🚀');
            }
          } else {
            outputBox.style.color = '#ff7b72';
            var errMsg = (res && res.error) || 'Failed to push to remote.';
            if (errMsg.includes('Repository not found') || errMsg.includes('does not exist')) {
              outputBox.textContent = '⚠️ Repository [' + remoteName + '] does not exist on GitHub yet.\nOpening creation page in a new tab...';
              window.open(newRepoWebUrl, '_blank');
            } else {
              outputBox.textContent = '❌ Deployment Error:\n' + errMsg;
            }
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

    var card = m('div', {
      style: { background: '#161b22', border: '1px solid ' + (hasGit ? '#30363d' : '#8257e5'), borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontFamily: 'monospace' }
    },
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' } },
        m('div', { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' } },
          m('strong', { style: { color: '#00f2fe', fontSize: '0.95rem' } }, '📁 ' + pName),
          (pName !== remoteName) ? m('span', { style: { color: '#d2a8ff', fontSize: '0.72rem' } }, '(Remote: ' + remoteName + ')') : null,
          m('a', { href: liveUrl, target: '_blank', style: { color: '#58a6ff', fontSize: '0.72rem', textDecoration: 'none', marginLeft: '0.3rem' } }, '🌐 Open Live Site ↗'),
          m('a', { href: settingsPagesUrl, target: '_blank', style: { color: '#d2a8ff', fontSize: '0.72rem', textDecoration: 'none', marginLeft: '0.3rem' } }, '⚙️ Pages Settings ↗')
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
      m('div', { style: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' } },
        btnDeploy,
        btnCreateRemote
      ),
      outputBox
    );

    return card;
  }
}

globalThis.LunoDeployEngine = LunoDeployEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoDeployEngine;