const fs = require("fs");
const path = require("path");

class LunoServer {
  /**
   * ⚙️ METHOD: getRootDir()
   * Dynamic root directory resolution based on environment variables or process location.
   */
  static getRootDir() {
    if (!LunoServer._rootDir) {
      const envRoot = process.env.LUNO_ROOT || process.env.WORKSPACE_ROOT;
      if (envRoot && fs.existsSync(envRoot)) {
        LunoServer._rootDir = path.resolve(envRoot);
      } else {
        const defaultRoot = path.resolve(__dirname, "..");
        LunoServer._rootDir = fs.existsSync(defaultRoot) ? defaultRoot : process.cwd();
      }
    }
    return LunoServer._rootDir;
  }

  static setRootDir(val) {
    if (val) {
      LunoServer._rootDir = path.resolve(val);
    }
  }

  /**
   * ⚙️ METHOD: resolveProjectBaseDir(projectName)
   * Canonical project directory resolver: resolves workspace-relative folder names
   * against the workspace parent directory, falling back to the global active root.
   */
  static resolveProjectBaseDir(projectName) {
    if (!projectName || typeof projectName !== 'string' || !projectName.trim()) {
      return LunoServer.getRootDir();
    }
    const workspaceParent = path.dirname(LunoServer.getRootDir());
    return path.resolve(workspaceParent, projectName.trim());
  }

  /**
   * ⚙️ METHOD: getGitRootDir()
   * Walks up parent directories looking for .git folder.
   */
  static getGitRootDir() {
    let curr = LunoServer.getRootDir();
    while (curr && curr !== path.parse(curr).root) {
      if (fs.existsSync(path.join(curr, ".git"))) return curr;
      const parent = path.dirname(curr);
      if (parent === curr) break;
      curr = parent;
    }
    return LunoServer.getRootDir();
  }

  static get VERSION() {
    try {
      const lunoJsonPath = path.join(LunoServer.getRootDir(), "luno.json");
      if (fs.existsSync(lunoJsonPath)) {
        const meta = JSON.parse(fs.readFileSync(lunoJsonPath, "utf8"));
        if (meta.version) return "v" + meta.version.replace(/^v/, "");
      }
    } catch (e) {}
    return "v3.6.0";
  }

  static sendJSON(res, status, data) {
    if (res.headersSent) return;
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    });
    res.end(JSON.stringify(data));
  }

  /**
   * ⚙️ METHOD: isWritableWorkspacePath(targetFullPath)
   * Validates target paths against active project root and workspace parent directory.
   */
  static isWritableWorkspacePath(targetFullPath) {
    if (!targetFullPath || typeof targetFullPath !== "string") return false;
    const norm = targetFullPath.replace(/\\/g, "/");
    const activeRoot = LunoServer.getRootDir().replace(/\\/g, "/");
    const parentDir = path.dirname(activeRoot).replace(/\\/g, "/");
    const normCwd = process.cwd().replace(/\\/g, "/");

    if (norm.startsWith(activeRoot) || norm.startsWith(parentDir) || norm.startsWith(normCwd)) {
      return true;
    }
    return false;
  }

  static getAllFiles(dir, fileList = [], ignoreDirs = ["node_modules", ".git", "dist", "build", ".checkpoints", "_claude_salvage", "simpleVersion"], maxDepth = 5, currentDepth = 0) {
    if (currentDepth > maxDepth || !fs.existsSync(dir)) return fileList;
    try {
      const items = fs.readdirSync(dir);
      for (const name of items) {
        if (name.endsWith('.bak')) continue;
        const fullPath = path.join(dir, name);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (ignoreDirs.includes(name) || name.startsWith('.') || name.startsWith('_')) continue;
            LunoServer.getAllFiles(fullPath, fileList, ignoreDirs, maxDepth, currentDepth + 1);
          } else if (stat.isFile()) {
            const relPath = path.relative(LunoServer.getRootDir(), fullPath).replace(/\\/g, "/");
            fileList.push({ fullPath, relPath, name, size: stat.size });
          }
        } catch (statErr) {}
      }
    } catch (e) {}
    return fileList;
  }

  /**
   * ⚙️ METHOD: sanitizeAndResolvePath(relPath, baseDir)
   * Portable path resolution without hardcoded Termux strings.
   */
  static sanitizeAndResolvePath(relPath, baseDir) {
    const root = baseDir || LunoServer.getRootDir();
    if (!relPath || typeof relPath !== 'string' || !relPath.trim()) return root;
    let normalized = relPath.replace(/\\/g, '/').trim();

    if (path.isAbsolute(normalized)) {
      if (fs.existsSync(normalized)) return path.resolve(normalized);
    }

    const relResolved = path.resolve(root, normalized);
    if (fs.existsSync(relResolved)) return relResolved;

    const parentWorkspace = path.dirname(root);
    const candidates = [
      relResolved,
      path.resolve(parentWorkspace, normalized),
      path.resolve(parentWorkspace, 'Library', normalized),
      path.resolve(process.cwd(), normalized)
    ];

    for (const cand of candidates) {
      try {
        if (fs.existsSync(cand)) return cand;
      } catch(e) {}
    }
    return relResolved;
  }

  static async parseAndSaveFiles(bodyText, projectOverride) {
    let filesToWrite = [];
    let serverScript = "";
    let projectName = projectOverride || "";

    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.files)) filesToWrite = parsed.files;
        if (typeof parsed.serverScript === "string") serverScript = parsed.serverScript;
        if (!projectName && typeof parsed.project === "string") projectName = parsed.project;
      }
    } catch (e) {
      return {
        success: false,
        error: "Invalid JSON payload sent to server. All payload parsing must occur client-side.",
        llmFeedback: "❌ SAVE FAILED: Server expected structured JSON payload from browser client."
      };
    }

    const savedFiles = [];
    let modifiedCount = 0;
    const fileDetails = [];

    const baseDir = LunoServer.resolveProjectBaseDir(projectName);
    const patchLogPath = path.join(baseDir, 'LunoPatchLog.html');
    const patchJournalBlocks = [];

    for (const f of filesToWrite) {
      const filePath = f.filePath || f.relPath;
      if (!filePath) continue;

      const action = (f.action || 'write').toLowerCase();
      const ext = filePath.split('.').pop().toLowerCase();
      const isJs = ext === 'js' || ext === 'mjs';

      // Non-JS files (HTML, CSS, JSON, SVG) and direct writes ALWAYS write directly to disk
      if (!isJs || filePath === 'luno.json' || filePath === 'files.json' || filePath === 'LunoPatchLog.html' || action === 'direct') {
        const fullPath = LunoServer.sanitizeAndResolvePath(filePath, baseDir);
        if (fullPath && LunoServer.isWritableWorkspacePath(fullPath)) {
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, f.content, "utf8");
          savedFiles.push(filePath);
          modifiedCount++;
          fileDetails.push("  • " + filePath + " [Direct disk write]");
        }
        continue;
      }

      const methodSpec = f.methodSpec || '';
      const tagWord = 'script';

      let block = '';
      if (action === 'delete') {
        block = `<${tagWord} data-file="${filePath}" data-action="delete"></${tagWord}>`;
      } else if (methodSpec) {
        block = `<${tagWord} data-file="${filePath}" data-method="${methodSpec}" data-action="patch">\n${f.content}\n</${tagWord}>`;
      } else {
        block = `<${tagWord} data-file="${filePath}">\n${f.content}\n</${tagWord}>`;
      }

      patchJournalBlocks.push(block);
      savedFiles.push(filePath);
      modifiedCount++;
      fileDetails.push("  • " + filePath + " [Appended to LunoPatchLog.html]");
    }

    if (patchJournalBlocks.length > 0) {
      const existingJournal = fs.existsSync(patchLogPath) ? fs.readFileSync(patchLogPath, 'utf8').trimEnd() : '';
      const newJournalText = (existingJournal ? existingJournal + '\n\n' : '') + patchJournalBlocks.join('\n\n') + '\n';
      fs.writeFileSync(patchLogPath, newJournalText, 'utf8');
    }

    let serverExecutionFeedback = "";
    if (serverScript && serverScript.trim()) {
      serverExecutionFeedback = await LunoServer.executeServerScript(serverScript, baseDir);
    }

    if (modifiedCount > 0) {
      LunoServer.updateLunoMetadata(savedFiles, modifiedCount, baseDir);
    }

    let summaryText = "";
    if (savedFiles.length === 0 && !serverScript) {
      summaryText = "⚠️ No file targets or server scripts found in JSON payload.";
    } else if (savedFiles.length === 0 && serverScript) {
      summaryText = "⚡ Server Script Executed (0 file write targets).";
    } else {
      const modWord = modifiedCount === 1 ? "1 file processed" : (modifiedCount + " files processed");
      const targetLabel = projectName ? ` [Target: ${projectName}]` : "";
      summaryText = "✅ " + modWord + targetLabel + ":\n" + fileDetails.join("\n");
    }

    return {
      success: true,
      count: savedFiles.length,
      modifiedCount,
      files: savedFiles,
      project: projectName || path.basename(baseDir),
      llmFeedback: (serverExecutionFeedback + "\n" + summaryText).trim()
    };
  }

  static updateLunoMetadata(savedFiles, modifiedCount, baseDir) {
    try {
      const targetDir = baseDir || LunoServer.getRootDir();
      const lunoJsonPath = path.join(targetDir, 'luno.json');
      let lunoMeta = {};
      if (fs.existsSync(lunoJsonPath)) {
        try { lunoMeta = JSON.parse(fs.readFileSync(lunoJsonPath, 'utf8')); } catch(e){}
      }
      lunoMeta.processedCountSinceCheckpoint = (lunoMeta.processedCountSinceCheckpoint || 0) + modifiedCount;
      lunoMeta.changedMethods = lunoMeta.changedMethods || {};
      const nowIso = new Date().toISOString();
      for (const fPath of savedFiles) {
        lunoMeta.changedMethods[fPath] = nowIso;
      }
      fs.writeFileSync(lunoJsonPath, JSON.stringify(lunoMeta, null, 2), 'utf8');
    } catch (metaErr) {
      console.error('[LunoServer Metadata Write Notice]', metaErr.message);
    }
  }

  static async executeServerScript(rawCode, baseDir) {
    if (!rawCode || !rawCode.trim()) return '';

    const targetDir = baseDir || LunoServer.getRootDir();
    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    };

    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const env = {
        require,
        console: customConsole,
        process,
        Buffer,
        LunoServer,
        path: require('path'),
        fs: require('fs'),
        rootDir: targetDir,
        baseDir: targetDir
      };

      const fn = new AsyncFunction('require', 'console', 'process', 'Buffer', 'LunoServer', 'env', rawCode);
      let result = await fn(require, customConsole, process, Buffer, LunoServer, env);

      if (typeof result === 'function') {
        result = await result();
      }

      let outputParts = [];
      if (logs.length > 0) {
        outputParts.push('--- Console Logs ---\n' + logs.join('\n'));
      }
      if (result !== undefined && result !== null) {
        const formattedResult = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        outputParts.push('--- Return Value ---\n' + formattedResult);
      }

      const finalOutput = outputParts.length > 0 ? outputParts.join('\n\n') : 'Server script executed successfully with no output.';
      return "⚡ SERVER SCRIPT OUTPUT:\n" + finalOutput + "\n\n";
    } catch (err) {
      return "❌ SERVER SCRIPT ERROR:\n" + (err.stack || err.message) + "\n\n";
    }
  }

  static async handleContextRequest(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        let requests = [];
        try {
          const jsonBody = JSON.parse(body || '{}');
          if (jsonBody && Array.isArray(jsonBody.requests)) {
            requests = jsonBody.requests;
          }
        } catch (e) {}

        const fulfilled = [];
        const outputParts = [];

        for (const reqItem of requests) {
          const relPath = reqItem.filePath || reqItem.path;
          const fullPath = LunoServer.sanitizeAndResolvePath(relPath);
          if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            fulfilled.push({ filePath: relPath, status: 'error', error: 'File not found on disk' });
            continue;
          }

          const fileContent = fs.readFileSync(fullPath, 'utf8');
          outputParts.push(fileContent);
          fulfilled.push({ filePath: relPath, kind: 'FILE', lines: fileContent.split('\n').length });
        }

        const bundledText = outputParts.join('\n\n');
        LunoServer.sendJSON(res, 200, {
          success: true,
          fulfilledCount: fulfilled.filter(f => f.status !== 'error').length,
          fulfilled: fulfilled,
          bundledText: bundledText,
          estTokens: Math.ceil(bundledText.length / 4)
        });
      } catch (err) {
        LunoServer.sendJSON(res, 400, { success: false, error: err.message });
      }
    });
  }

  static handleVendorAcorn(req, res, url) {
    try {
      const acornPath = require.resolve('acorn');
      if (fs.existsSync(acornPath)) {
        res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=86400" });
        return res.end(fs.readFileSync(acornPath));
      }
    } catch (e) {}
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("// Local acorn module not found");
  }

  static handleVendorThree(req, res, url) {
    try {
      let threePath = null;
      try { threePath = require.resolve('three/build/three.module.js'); } catch (e) {
        try { threePath = require.resolve('three'); } catch (e2) {}
      }

      if (threePath && fs.existsSync(threePath)) {
        res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=86400" });
        return res.end(fs.readFileSync(threePath));
      }
    } catch (e) {}

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("// Local node_modules three package not installed");
  }

  static handleAppPreview(req, res, url) {
    const targetProj = url.searchParams.get('project');
    const baseDir = LunoServer.resolveProjectBaseDir(targetProj);
    const indexFile = path.join(baseDir, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      return res.end(fs.readFileSync(indexFile));
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end("<!DOCTYPE html><html><body style='background:#0d1117;color:#c9d1d9;font-family:monospace;padding:2rem;'><h2>📱 Active Project View: " + path.basename(baseDir) + "</h2><p>No index.html found in: " + baseDir + "</p></body></html>");
  }

  /**
   * ⚙️ METHOD: handleProjectsList(req, res)
   * Portable project listing from active workspace parent directory.
   */
  static handleProjectsList(req, res) {
    const activeRoot = LunoServer.getRootDir();
    const parentDir = process.env.LUNO_WORKSPACE_DIR || path.dirname(activeRoot);
    const projectList = [];
    try {
      if (fs.existsSync(parentDir)) {
        const items = fs.readdirSync(parentDir);
        for (const item of items) {
          if (item.startsWith('.') || item.startsWith('_') || item === 'node_modules' || item === 'simpleVersion') continue;
          const fullPath = path.join(parentDir, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              const normFull = fullPath.replace(/\\/g, '/');
              const normActive = activeRoot.replace(/\\/g, '/');
              let metadata = { name: item, version: '1.0.0', description: 'Workspace project', type: 'web-app' };
              const lunoJsonPath = path.join(fullPath, 'luno.json');
              const pkgJsonPath = path.join(fullPath, 'package.json');

              if (fs.existsSync(lunoJsonPath)) {
                try { metadata = Object.assign({}, metadata, JSON.parse(fs.readFileSync(lunoJsonPath, 'utf8'))); } catch (e) {}
              } else if (fs.existsSync(pkgJsonPath)) {
                try { metadata = Object.assign({}, metadata, JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))); } catch (e) {}
              }

              let fileCount = 0;
              let totalBytes = 0;
              let latestTime = stat.mtimeMs;

              try {
                const pFiles = LunoServer.getAllFiles(fullPath);
                fileCount = pFiles.length;
                for (const pf of pFiles) {
                  try {
                    const pfStat = fs.statSync(pf.fullPath);
                    totalBytes += pfStat.size;
                    if (pfStat.mtimeMs > latestTime) latestTime = pfStat.mtimeMs;
                  } catch(e) {}
                }
              } catch (e) {}

              projectList.push({
                name: item,
                path: normFull,
                isActive: normFull === normActive,
                isLibrary: item.toLowerCase() === 'library',
                description: metadata.description || 'Workspace development project',
                version: metadata.version || '1.0.0',
                type: metadata.type || (item.toLowerCase() === 'library' ? 'shared-library' : 'project'),
                fileCount: fileCount,
                totalSizeKb: Math.round(totalBytes / 1024),
                lastModified: new Date(latestTime).toISOString()
              });
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
    return LunoServer.sendJSON(res, 200, {
      success: true,
      parentDir: parentDir,
      activeRootDir: activeRoot.replace(/\\/g, '/'),
      projects: projectList
    });
  }

  static handleFsLs(req, res, url) {
    const reqPath = url.searchParams.get('path') || '';
    const reqProj = url.searchParams.get('project') || '';
    const isRecursive = url.searchParams.get('recursive') === 'true' || url.searchParams.get('recursive') === '1';
    const baseDir = LunoServer.resolveProjectBaseDir(reqProj);
    const targetDir = reqPath ? LunoServer.sanitizeAndResolvePath(reqPath, baseDir) : baseDir;
    if (!targetDir || !fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return LunoServer.sendJSON(res, 404, { error: 'Directory not found: ' + reqPath });
    }

    const normTarget = targetDir.replace(/\\/g, '/');
    const parentDir = path.dirname(normTarget).replace(/\\/g, '/');

    if (isRecursive) {
      const fileList = LunoServer.getAllFiles(targetDir);
      const items = fileList.map(item => {
        let stat = null;
        try { stat = fs.statSync(item.fullPath); } catch(e) {}
        return {
          name: item.name,
          relativePath: path.relative(targetDir, item.fullPath).replace(/\\/g, '/'),
          fullPath: item.fullPath.replace(/\\/g, '/'),
          isDirectory: false,
          size: stat ? stat.size : 0,
          mtimeMs: stat ? stat.mtimeMs : 0
        };
      });
      return LunoServer.sendJSON(res, 200, {
        success: true,
        currentPath: normTarget,
        parentPath: parentDir,
        items: items
      });
    }

    const items = fs.readdirSync(targetDir).map(name => {
      const fullPath = path.join(targetDir, name);
      let stat = null;
      try { stat = fs.statSync(fullPath); } catch(e) {}
      const relPath = path.relative(LunoServer.getRootDir(), fullPath).replace(/\\/g, '/');
      return {
        name: name,
        relativePath: relPath,
        fullPath: fullPath.replace(/\\/g, '/'),
        isDirectory: stat ? stat.isDirectory() : false,
        size: stat ? stat.size : 0,
        mtimeMs: stat ? stat.mtimeMs : 0
      };
    }).filter(item => !item.name.startsWith('.') && item.name !== 'node_modules' && !item.name.endsWith('.bak'));

    return LunoServer.sendJSON(res, 200, {
      success: true,
      currentPath: normTarget,
      parentPath: parentDir,
      items: items
    });
  }

  static handleFsRead(req, res, url) {
    const reqPath = url.searchParams.get('path') || '';
    const reqProj = url.searchParams.get('project') || '';
    if (!reqPath) return LunoServer.sendJSON(res, 400, { error: 'Missing path parameter' });
    const baseDir = LunoServer.resolveProjectBaseDir(reqProj);
    const fullPath = LunoServer.sanitizeAndResolvePath(reqPath, baseDir);
    if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return LunoServer.sendJSON(res, 404, { error: 'File not found: ' + reqPath });
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return LunoServer.sendJSON(res, 200, {
      success: true,
      relativePath: reqPath,
      fullPath: fullPath.replace(/\\/g, '/'),
      content: content,
      lines: content.split('\n').length,
      size: content.length
    });
  }

  static handleAllCode(req, res, url) {
    const projectName = (url && url.searchParams) ? (url.searchParams.get('project') || '') : '';
    const targetDir = LunoServer.resolveProjectBaseDir(projectName);
    const TEXT_EXTS = ['.js', '.json', '.html', '.css', '.md', '.txt', '.svg'];

    const files = [];
    if (fs.existsSync(targetDir)) {
      function scan(dir, depth) {
        if (depth > 5) return;
        const items = fs.readdirSync(dir);
        for (const name of items) {
          if (
            name.endsWith('.bak') ||
            name.includes('.old_') ||
            name.includes('Copy') ||
            name === 'bundle.js' ||
            name === 'standalone_bundler.js' ||
            name.startsWith('.') ||
            name.startsWith('_') ||
            name === 'node_modules' ||
            name === 'simpleVersion'
          ) continue;
          const fullPath = path.join(dir, name);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              scan(fullPath, depth + 1);
            } else if (stat.isFile() && stat.size < 500000) {
              const ext = path.extname(name).toLowerCase();
              if (TEXT_EXTS.includes(ext)) {
                const relPath = path.relative(targetDir, fullPath).replace(/\\/g, "/");
                files.push({ fullPath, relPath, name, size: stat.size });
              }
            }
          } catch (e) {}
        }
      }
      scan(targetDir, 0);
    }

    const manifest = [];
    const filesMap = {};
    for (const item of files) {
      try {
        const content = fs.readFileSync(item.fullPath, 'utf8');
        manifest.push(item.relPath);
        filesMap[item.relPath] = content;
      } catch(e) {}
    }
    return LunoServer.sendJSON(res, 200, {
      success: true,
      activeProjectName: path.basename(targetDir),
      activeRootDir: targetDir.replace(/\\/g, '/'),
      manifest: manifest,
      filesMap: filesMap
    });
  }

  static serveAsset(req, res, relPath) {
    if (res.headersSent) return;
    try {
      const reqUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
      let targetProj = reqUrl.searchParams.get('project') || '';
      if (!targetProj && req.headers && req.headers.referer) {
        try {
          const refUrl = new URL(req.headers.referer);
          targetProj = refUrl.searchParams.get('project') || '';
        } catch(e) {}
      }
      const baseDir = LunoServer.resolveProjectBaseDir(targetProj);
      const fullPath = LunoServer.sanitizeAndResolvePath(relPath, baseDir);

      if (fullPath && fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const content = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase();
          const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.mjs': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.writeHead(200, { "Content-Type": contentType, "Content-Length": content.length, "Cache-Control": "no-cache, no-store, must-revalidate" });
          return res.end(content);
        }
      }
    } catch (e) {}

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found: " + relPath);
  }

  static async handle(req, res) {
    try {
      const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
      const method = req.method.toUpperCase();

      if (method === 'GET' && url.pathname === '/vendor/acorn.js') {
        return LunoServer.handleVendorAcorn(req, res, url);
      }

      if (method === 'GET' && (url.pathname === '/vendor/three.module.js' || url.pathname === '/vendor/three.js')) {
        return LunoServer.handleVendorThree(req, res, url);
      }

      if (method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/full' || url.pathname === '/ui/1' || url.pathname === '/ui/full')) {
        return LunoServer.serveIndex(req, res);
      }

      if (method === 'GET' && (url.pathname === '/app-preview' || url.pathname === '/app-preview/index.html')) {
        return LunoServer.handleAppPreview(req, res, url);
      }

      if (method === 'GET' && url.pathname === '/api/ping') {
        return LunoServer.sendJSON(res, 200, { status: "online", pid: process.pid, rootDir: LunoServer.getRootDir(), version: LunoServer.VERSION });
      }

      if (method === 'GET' && url.pathname === '/api/projects/list') {
        return LunoServer.handleProjectsList(req, res);
      }

      if (method === 'GET' && url.pathname === '/api/fs/ls') {
        return LunoServer.handleFsLs(req, res, url);
      }

      if (method === 'GET' && url.pathname === '/api/fs/read') {
        return LunoServer.handleFsRead(req, res, url);
      }

      if (method === 'POST' && url.pathname === '/api/context/request') {
        return LunoServer.handleContextRequest(req, res);
      }

      if (method === 'POST' && url.pathname === '/api/fs/set-root') {
        let b = '';
        req.on('data', c => { b += c; });
        req.on('end', () => {
          try {
            const body = JSON.parse(b || '{}');
            if (!body.rootPath) return LunoServer.sendJSON(res, 400, { error: 'Missing rootPath' });
            const resolved = path.resolve(body.rootPath);
            if (!fs.existsSync(resolved)) return LunoServer.sendJSON(res, 400, { error: 'Directory does not exist: ' + resolved });
            LunoServer.setRootDir(resolved);
            LunoServer.sendJSON(res, 200, { success: true, rootDir: LunoServer.getRootDir().replace(/\\/g, '/') });
          } catch (err) {
            LunoServer.sendJSON(res, 400, { error: err.message });
          }
        });
        return;
      }

      if (method === 'GET' && url.pathname === '/api/all-code') {
        return LunoServer.handleAllCode(req, res, url);
      }

      if (method === 'POST' && url.pathname === '/api/fs/consolidate') {
        return LunoServer.sendJSON(res, 200, {
          success: true,
          note: "Server consolidation endpoint is deprecated. All AST consolidation executes in browser client."
        });
      }

      if (method === 'POST' && url.pathname === '/api/save') {
        let b = '';
        const projectParam = url.searchParams.get('project') || '';
        req.on('data', c => { b += c; });
        req.on('end', async () => {
          try {
            const r = await LunoServer.parseAndSaveFiles(b, projectParam);
            LunoServer.sendJSON(res, 200, r);
          } catch(e) {
            LunoServer.sendJSON(res, 400, { success: false, error: e.message });
          }
        });
        return;
      }

      if (method === 'GET') {
        return LunoServer.serveAsset(req, res, url.pathname.slice(1));
      }

      LunoServer.sendJSON(res, 404, { error: 'Route not found' });
    } catch (err) {
      LunoServer.sendJSON(res, 500, { error: err.message });
    }
  }

  static serveIndex(req, res) {
    if (res.headersSent) return;
    const indexFile = path.join(LunoServer.getRootDir(), 'index.html');
    const spaFile = path.join(LunoServer.getRootDir(), 'spa.html');
    const fileToServe = fs.existsSync(indexFile) ? indexFile : (fs.existsSync(spaFile) ? spaFile : null);

    if (fileToServe) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      return res.end(fs.readFileSync(fileToServe, 'utf8'));
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    res.end("<!DOCTYPE html><html><body style='background:#0d1117;color:#c9d1d9;font-family:monospace;padding:2rem;'><h2>🌙 Luno Workspace</h2><p>index.html online.</p></body></html>");
  }
}

globalThis.LunoServer = LunoServer;
if (typeof module !== "undefined" && module.exports) module.exports = LunoServer;