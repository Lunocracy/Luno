class LunoDeployEngine {
  constructor() {}

  /**
   * ⚙️ METHOD: ensureGitHubPagesParity(projectName)
   * Verifies or scaffolds .nojekyll and a standalone index.html loader shell.
   */
  static async ensureGitHubPagesParity(projectName) {
    const pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');

    try {
      const serverScript = [
        'const fs = require("fs");',
        'const path = require("path");',
        'const projRoot = LunoServer.resolveProjectBaseDir("' + pName + '");',
        'let actions = [];',
        '',
        '// 1. Ensure .nojekyll',
        'const noJekyllPath = path.join(projRoot, ".nojekyll");',
        'if (!fs.existsSync(noJekyllPath)) {',
        '  fs.writeFileSync(noJekyllPath, "", "utf8");',
        '  actions.push("Created .nojekyll in " + path.basename(projRoot));',
        '}',
        '',
        '// 2. Ensure index.html loader shell exists',
        'const indexPath = path.join(projRoot, "index.html");',
        'if (!fs.existsSync(indexPath)) {',
        '  const htmlContent = `<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '  <title>' + pName + '</title>',
        '  <script src="../Library/DomBasics.js"><\\/script>',
        '  <script src="../Luno/app/LunoLoader.js"><\\/script>',
        '</head>',
        '<body>',
        '  <div id="app-root"></div>',
        '  <script>',
        '    document.addEventListener("DOMContentLoaded", function() {',
        '      if (typeof LunoLoader !== "undefined") {',
        '        LunoLoader.loadApp("app-root");',
        '      }',
        '    });',
        '  <\\/script>',
        '</body>',
        '</html>`;',
        '  fs.writeFileSync(indexPath, htmlContent, "utf8");',
        '  actions.push("Generated standalone index.html loader shell");',
        '}',
        '',
        'return actions.length > 0 ? actions.join("\\n") : "GitHub Pages assets verified cleanly.";'
      ].join('\n');

      const res = await fetch('/api/save?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], serverScript: serverScript, project: pName })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * ⚙️ METHOD: deployProjectToGitHub(projectName, commitMsg)
   * Generalizes 1-tap Git push across any project directory.
   */
  static async deployProjectToGitHub(projectName, commitMsg) {
    const pName = projectName || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : 'Luno');
    const msg = commitMsg || `[${pName}] Automated deployment via Luno Workspace`;

    try {
      await LunoDeployEngine.ensureGitHubPagesParity(pName);

      const res = await fetch('/api/deploy?project=' + encodeURIComponent(pName), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: pName, commitMsg: msg })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

globalThis.LunoDeployEngine = LunoDeployEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = LunoDeployEngine;