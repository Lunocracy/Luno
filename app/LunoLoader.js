class LunoLoader {
  constructor() {}

  static loadedScripts = new Set();
  static loadedStyles = new Set();

  /**
   * ⚙️ METHOD: getActiveProjectParam()
   * - Type: Static Method
   * - Modifier: sync
   */
  static getActiveProjectParam() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        var params = new URLSearchParams(window.location.search);
        return params.get('project') || '';
      }
    } catch (e) {}
    return '';
  }

  /**
   * ⚙️ METHOD: getPatchUrlParams()
   * - Type: Static Method
   * - Modifier: sync
   */
  static getPatchUrlParams() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        var params = new URLSearchParams(window.location.search);
        var skip = params.get('skipPatches') === 'true' || params.get('noPatches') === 'true';
        var limitRaw = params.get('patchLimit') || params.get('patches');
        var limit = limitRaw !== null ? parseInt(limitRaw, 10) : null;
        return {
          skip: skip,
          limit: (limit !== null && !isNaN(limit) && limit >= 0) ? limit : null
        };
      }
    } catch (e) {}
    return { skip: false, limit: null };
  }

  /**
   * ⚙️ METHOD: fetchConfig(configPath, projectOverride)
   * - Type: Static Method
   * - Modifier: async
   */
  static async fetchConfig(configPath, projectOverride) {
    try {
      var proj = projectOverride || LunoLoader.getActiveProjectParam() || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : '');
      var url = '/api/fs/read?path=' + encodeURIComponent(configPath) + (proj ? '&project=' + encodeURIComponent(proj) : '');
      var res = await fetch(url);
      var data = await res.json();
      if (res.ok && data && data.content) {
        return JSON.parse(data.content);
      }
    } catch (e) {}
    return null;
  }

  /**
   * ⚙️ METHOD: loadStyle(cssPath)
   * - Type: Static Method
   * - Modifier: async
   */
  static loadStyle(cssPath) {
    return new Promise(function(resolve, reject) {
      var proj = LunoLoader.getActiveProjectParam();
      var fullUrl = (cssPath.indexOf('/') === 0 || cssPath.indexOf('http') === 0)
        ? cssPath
        : ('/' + cssPath);
      if (proj && fullUrl.indexOf('project=') === -1 && fullUrl.indexOf('http') !== 0) {
        fullUrl += (fullUrl.indexOf('?') === -1 ? '?' : '&') + 'project=' + encodeURIComponent(proj);
      }
      if (LunoLoader.loadedStyles.has(fullUrl)) {
        return resolve({ url: fullUrl, cached: true });
      }
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fullUrl + (fullUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      link.onload = function() {
        LunoLoader.loadedStyles.add(fullUrl);
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.boot('Loaded Stylesheet', cssPath);
        }
        resolve({ url: fullUrl, cached: false });
      };
      link.onerror = function() {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.error('Failed Stylesheet Load', cssPath);
        }
        reject(new Error('Failed to load stylesheet: ' + cssPath));
      };
      document.head.appendChild(link);
    });
  }

  /**
   * ⚙️ METHOD: loadScript(jsPath)
   * - Type: Static Method
   * - Modifier: async
   */
  static loadScript(jsPath) {
    return new Promise(function(resolve, reject) {
      var proj = LunoLoader.getActiveProjectParam();
      var fullUrl = (jsPath.indexOf('/') === 0 || jsPath.indexOf('http') === 0)
        ? jsPath
        : ('/' + jsPath);
      if (proj && fullUrl.indexOf('project=') === -1 && fullUrl.indexOf('http') !== 0) {
        fullUrl += (fullUrl.indexOf('?') === -1 ? '?' : '&') + 'project=' + encodeURIComponent(proj);
      }
      if (LunoLoader.loadedScripts.has(fullUrl)) {
        return resolve({ url: fullUrl, cached: true });
      }
      var script = document.createElement('script');
      script.src = fullUrl + (fullUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      script.async = false;
      script.onload = function() {
        LunoLoader.loadedScripts.add(fullUrl);
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.boot('Loaded Startup Script', jsPath);
        }
        resolve({ url: fullUrl, cached: false });
      };
      script.onerror = function() {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.error('Failed Script Load', jsPath);
        }
        reject(new Error('Failed to load script: ' + jsPath));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * ⚙️ METHOD: applyPatchLog(projectOverride)
   * - Type: Static Method
   * - Modifier: async
   * Applies load-time JS patches from local LunoPatchLog.html to browser memory.
   */
  static async applyPatchLog(projectOverride) {
    try {
      var urlParams = LunoLoader.getPatchUrlParams();
      if (urlParams.skip) {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.warn('Skipping Patch Playback', '?skipPatches=true active');
        }
        return { appliedCount: 0, skipped: true };
      }

      var proj = projectOverride || LunoLoader.getActiveProjectParam() || (typeof ClientApp !== 'undefined' && ClientApp.getTargetProject ? ClientApp.getTargetProject() : '');
      var journalFile = 'LunoPatchLog.html';
      var readUrl = '/api/fs/read?path=' + encodeURIComponent(journalFile) + (proj ? '&project=' + encodeURIComponent(proj) : '');
      var res = await fetch(readUrl);
      var data = await res.json();

      if (!res.ok || !data || !data.content || !data.content.trim()) {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.boot('Patch Log Clean', 'LunoPatchLog.html is empty for ' + (proj || 'active project'));
        }
        return { appliedCount: 0 };
      }

      var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
      if (!parser || typeof parser.parsePatchLog !== 'function') {
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.warn('Parser Unavailable', 'LunoPatchLog playback skipped');
        }
        return { appliedCount: 0 };
      }

      var payloadObj = parser.parsePatchLog(data.content);
      var files = payloadObj.files || [];
      var totalAvailable = files.length;

      if (urlParams.limit !== null && urlParams.limit < files.length) {
        files = files.slice(0, urlParams.limit);
        if (typeof LunoPlaybackLogger !== 'undefined') {
          LunoPlaybackLogger.warn('Time-Travel Limit Active', 'Playback first ' + urlParams.limit + ' of ' + totalAvailable + ' patches');
        }
      }

      var fileLastFullWriteIdx = new Map();
      for (var k = 0; k < files.length; k++) {
        var item = files[k];
        if (item && item.filePath && item.action !== 'delete' && item.action !== 'patch' && !item.methodSpec) {
          fileLastFullWriteIdx.set(item.filePath, k);
        }
      }

      var appliedCount = 0;
      var supersededCount = 0;

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f || !f.filePath) continue;

        var normPath = f.filePath.replace(/\\/g, '/').replace(/["']/g, '').replace(/^\/+/, '').trim();

        // Safety check: Skip non-JavaScript files in LunoPatchLog.html
        if (!normPath.endsWith('.js') && !normPath.endsWith('.mjs')) {
          if (typeof LunoPlaybackLogger !== 'undefined') {
            LunoPlaybackLogger.warn('Skipped Non-JS Patch Log Item', normPath);
          }
          continue;
        }

        if (f.methodSpec && fileLastFullWriteIdx.has(f.filePath)) {
          var lastFullIdx = fileLastFullWriteIdx.get(f.filePath);
          if (i < lastFullIdx) {
            supersededCount++;
            if (typeof LunoPlaybackLogger !== 'undefined') {
              LunoPlaybackLogger.override('Skipped Superseded Patch', f.filePath + ' @ ' + f.methodSpec);
            }
            continue;
          }
        }

        try {
          if (f.methodSpec) {
            var specParts = f.methodSpec.split('.prototype.')[0].split('.')[0].replace(/^(?:globalThis|window)\./, '').trim();
            if (specParts && typeof globalThis[specParts] === 'undefined') {
              var targetMsg = 'Patch Target Missing: Class "' + specParts + '" not found on global scope for ' + f.filePath;
              if (typeof LunoPlaybackLogger !== 'undefined') {
                LunoPlaybackLogger.warn('Patch Target Missing', specParts + ' in ' + f.filePath);
              }
            }

            if (typeof LunoLinePatcher !== 'undefined' && LunoLinePatcher.appendPatch) {
              var resPatch = LunoLinePatcher.appendPatch('', f.methodSpec, f.content, { hotPatch: true });
              if (resPatch.appliedToRuntime) {
                appliedCount++;
                if (typeof LunoPlaybackLogger !== 'undefined') {
                  LunoPlaybackLogger.patch('Applied Method Patch', f.filePath + ' @ ' + f.methodSpec);
                }
              }
            }
          } else if (f.content) {
            var evalFn = new Function('globalThis', f.content);
            evalFn(globalThis);
            appliedCount++;
            if (typeof LunoPlaybackLogger !== 'undefined') {
              if (fileLastFullWriteIdx.get(f.filePath) === i) {
                LunoPlaybackLogger.override('Full-File Replacement Applied', f.filePath);
              } else {
                LunoPlaybackLogger.patch('Applied Full Script Patch', f.filePath);
              }
            }
          }
        } catch (evalErr) {
          var errDetail = f.filePath + ': ' + evalErr.message;
          if (typeof LunoPlaybackLogger !== 'undefined') {
            LunoPlaybackLogger.error('Patch Playback Exception', errDetail);
          }
        }
      }

      if (typeof LunoPlaybackLogger !== 'undefined') {
        LunoPlaybackLogger.boot('Patch Playback Complete', 'Applied ' + appliedCount + ' of ' + totalAvailable + ' JS patch(es) for ' + (proj || 'active project'));
      }

      return { appliedCount: appliedCount, totalAvailable: totalAvailable, supersededCount: supersededCount };
    } catch (err) {
      if (typeof LunoPlaybackLogger !== 'undefined') {
        LunoPlaybackLogger.error('Patch Playback Error', err.message);
      }
      return { appliedCount: 0, error: err.message };
    }
  }

  /**
   * ⚙️ METHOD: loadApp(containerId)
   */
  static async loadApp(containerId) {
    var targetContainer = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : (containerId || document.getElementById('app-container') || document.body);

    if (targetContainer) {
      targetContainer.innerHTML = '<div id="lunoloader-banner" style="padding:1.5rem; background:#0d1117; color:#00f2fe; font-family:monospace; font-size:13px;">' +
        '⚡ Initializing LunoLoader...<br><span id="lunoloader-log-status" style="color:#8b949e; font-size:12px;">Reading configuration...</span>' +
        '</div>';
    }

    var logEl = document.getElementById('lunoloader-log-status');
    function updateLog(msg) {
      if (logEl) logEl.textContent = msg;
    }

    var lunoMeta = await LunoLoader.fetchConfig('luno.json') || {};
    var filesMeta = await LunoLoader.fetchConfig('files.json') || {};

    var mergedConfig = {
      name: lunoMeta.name || filesMeta.name || 'Luno App',
      entrypoint: lunoMeta.entrypoint || null,
      mainClass: lunoMeta.mainClass || filesMeta.mainClass || null,
      main: [].concat(lunoMeta.main || filesMeta.main || []),
      files: [].concat(lunoMeta.files || lunoMeta.local || filesMeta.files || filesMeta.local || []),
      library: [].concat(lunoMeta.library || filesMeta.library || []),
      styles: [].concat(lunoMeta.styles || lunoMeta.css || filesMeta.styles || []),
      thirdParty: [].concat(lunoMeta.thirdParty || filesMeta.thirdParty || [])
    };

    var loadedSummary = { styles: [], scripts: [], libraries: [], errors: [] };

    // 1. Load Stylesheets
    updateLog('Loading stylesheets...');
    for (var i = 0; i < mergedConfig.styles.length; i++) {
      var stylePath = mergedConfig.styles[i];
      try {
        await LunoLoader.loadStyle(stylePath);
        loadedSummary.styles.push(stylePath);
      } catch (e) {
        loadedSummary.errors.push('Style Error: ' + e.message);
      }
    }

    // 2. Load Shared Libraries
    updateLog('Loading shared libraries...');
    for (var j = 0; j < mergedConfig.library.length; j++) {
      var libFile = mergedConfig.library[j];
      var libPath = libFile.indexOf('/') === 0 ? libFile : ('/Library/' + libFile.replace(/^Library\//i, ''));
      try {
        await LunoLoader.loadScript(libPath);
        loadedSummary.libraries.push(libFile);
      } catch (e) {
        loadedSummary.errors.push('Library Error (' + libFile + '): ' + e.message);
      }
    }

    // 3. Load Auxiliary & Third-Party Scripts
    updateLog('Loading auxiliary scripts...');
    var auxiliaryFiles = [].concat(mergedConfig.thirdParty, mergedConfig.files);
    for (var k = 0; k < auxiliaryFiles.length; k++) {
      var auxPath = auxiliaryFiles[k];
      if (auxPath.endsWith('.css')) {
        try { await LunoLoader.loadStyle(auxPath); loadedSummary.styles.push(auxPath); } catch (e) { loadedSummary.errors.push(e.message); }
      } else {
        try { await LunoLoader.loadScript(auxPath); loadedSummary.scripts.push(auxPath); } catch (e) { loadedSummary.errors.push(e.message); }
      }
    }

    // 4. Load Main Application Scripts
    updateLog('Loading main application scripts...');
    for (var m = 0; m < mergedConfig.main.length; m++) {
      var mainPath = mergedConfig.main[m];
      try {
        await LunoLoader.loadScript(mainPath);
        loadedSummary.scripts.push(mainPath);
      } catch (e) {
        loadedSummary.errors.push('Main Script Error (' + mainPath + '): ' + e.message);
      }
    }

    if (loadedSummary.errors.length > 0 && targetContainer) {
      targetContainer.innerHTML = '<div style="padding:1.5rem; background:#161b22; color:#ff7b72; border:1px solid #da3633; border-radius:8px; font-family:monospace;">' +
        '<h3>⚠️ LunoLoader Loading Errors Detected</h3>' +
        '<ul style="margin-top:0.5rem; padding-left:1.2rem; font-size:12px;">' +
        loadedSummary.errors.map(function(err) { return '<li>' + err + '</li>'; }).join('') +
        '</ul>' +
        '</div>';
      return { success: false, errors: loadedSummary.errors };
    }

    // 5. Playback Load-Time Patches from LunoPatchLog.html BEFORE running entrypoint
    updateLog('Playing back load-time patches from LunoPatchLog.html...');
    var patchResult = await LunoLoader.applyPatchLog();

    // Clear loading banner
    if (targetContainer) {
      var banner = document.getElementById('lunoloader-banner');
      if (banner && banner.parentNode === targetContainer) {
        targetContainer.innerHTML = '';
      }
    }

    // 6. Dynamically Resolve and Execute Manifest Entrypoint Class
    var mainClassName = (mergedConfig.entrypoint && mergedConfig.entrypoint.class) || mergedConfig.mainClass;
    var entryMethodName = (mergedConfig.entrypoint && mergedConfig.entrypoint.method) || 'init';

    if (!mainClassName && mergedConfig.entrypoint && mergedConfig.entrypoint.file) {
      mainClassName = mergedConfig.entrypoint.file.split('/').pop().replace(/\.[^/.]+$/, '');
    } else if (!mainClassName && mergedConfig.main.length > 0) {
      mainClassName = mergedConfig.main[0].split('/').pop().replace(/\.[^/.]+$/, '');
    }

    if (!mainClassName) {
      if (targetContainer) {
        targetContainer.innerHTML = '<div style="padding:1.5rem; background:#161b22; color:#00f2fe; border:1px solid #00f2fe; border-radius:8px; font-family:monospace;">' +
          '<h3>⚙️ No Entrypoint Defined in luno.json</h3>' +
          '<p style="margin-top:0.5rem; font-size:12px; color:#8b949e;">Please specify an entrypoint class in luno.json:</p>' +
          '<pre style="background:#0d1117; padding:0.5rem; border-radius:4px; color:#7ee787; font-size:11px;">"entrypoint": {\n  "file": "src/App.js",\n  "class": "App",\n  "method": "run"\n}</pre>' +
          '</div>';
      }
      return { success: false, error: 'No entrypoint class configured in luno.json' };
    }

    var AppClass = null;
    if (typeof window !== 'undefined') {
      if (typeof window[mainClassName] === 'function') {
        AppClass = window[mainClassName];
      } else {
        try {
          var evaluatedFn = eval(mainClassName);
          if (typeof evaluatedFn === 'function') {
            AppClass = evaluatedFn;
          }
        } catch (e) {}
      }
    }

    if (AppClass && typeof AppClass === 'function') {
      try {
        var envCtx = { container: targetContainer, config: mergedConfig, lunoMeta: lunoMeta, patchesApplied: patchResult.appliedCount };

        if (typeof AppClass[entryMethodName] === 'function') {
          await AppClass[entryMethodName](envCtx);
        } else {
          var instance = new AppClass();
          if (typeof instance[entryMethodName] === 'function') {
            await instance[entryMethodName](envCtx);
          } else if (typeof instance.run === 'function') {
            await instance.run(envCtx);
          } else if (typeof instance.init === 'function') {
            await instance.init(envCtx);
          } else if (typeof instance.mount === 'function') {
            await instance.mount(targetContainer);
          }
        }
      } catch (appErr) {
        if (targetContainer) {
          targetContainer.innerHTML = '<div style="padding:1.5rem; background:#161b22; color:#ff7b72; border:1px solid #da3633; border-radius:8px; font-family:monospace;">' +
            '<h3>⚠️ App Initialization Exception (' + mainClassName + ')</h3>' +
            '<pre style="margin-top:0.5rem; white-space:pre-wrap; font-size:12px;">' + (appErr.stack || appErr.message) + '</pre>' +
            '</div>';
        }
      }
    } else {
      if (targetContainer) {
        targetContainer.innerHTML = '<div style="padding:1.5rem; background:#161b22; color:#ff7b72; border:1px solid #da3633; border-radius:8px; font-family:monospace;">' +
          '<h3>⚠️ Entrypoint Class Not Found</h3>' +
          '<p style="margin-top:0.5rem; font-size:12px;">Class <strong>"' + mainClassName + '"</strong> was not found on global scope after loading scripts: ' + mergedConfig.main.join(', ') + '</p>' +
          '</div>';
      }
    }

    return { success: true, config: mergedConfig, loaded: loadedSummary, patchesApplied: patchResult.appliedCount };
  }
}

globalThis.LunoLoader = LunoLoader;
if (typeof module !== "undefined" && module.exports) module.exports = LunoLoader;