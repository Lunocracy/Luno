class LunoLoader {
  constructor() {}

  static loadedScripts = new Set();
  static loadedStyles = new Set();

  static getActiveProjectParam() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        var params = new URLSearchParams(window.location.search);
        return params.get('project') || '';
      }
    } catch (e) {}
    return '';
  }

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

  static async applyPatchLog(projectOverride) {
    try {
      var urlParams = LunoLoader.getPatchUrlParams();
      if (urlParams.skip) {
        return { appliedCount: 0, skipped: true };
      }

      var currentProj = projectOverride || LunoLoader.getActiveProjectParam() || '';
      var readUrl = '/api/fs/read?path=LunoPatchLog.html' + (currentProj ? '&project=' + encodeURIComponent(currentProj) : '');
      var res = await fetch(readUrl);
      var data = await res.json();

      if (!res.ok || !data || !data.content || !data.content.trim()) {
        return { appliedCount: 0 };
      }

      var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
      if (!parser || typeof parser.parsePatchLog !== 'function') {
        return { appliedCount: 0 };
      }

      var payloadObj = parser.parsePatchLog(data.content);
      var files = payloadObj.files || [];
      var appliedCount = 0;

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f || !f.filePath) continue;

        var normPath = f.filePath.replace(/\\/g, '/').replace(/["']/g, '').replace(/^\/+/, '').trim();
        if (!normPath.endsWith('.js') && !normPath.endsWith('.mjs')) continue;

        if (currentProj && currentProj !== 'Luno') {
          var isForThisProj = normPath.startsWith(currentProj + '/') || normPath.startsWith('Library/') || !normPath.includes('/');
          if (!isForThisProj) continue;
        }

        try {
          if (f.methodSpec) {
            if (typeof LunoLinePatcher !== 'undefined' && LunoLinePatcher.appendPatch) {
              var resPatch = LunoLinePatcher.appendPatch('', f.methodSpec, f.content, { hotPatch: true });
              if (resPatch.appliedToRuntime) appliedCount++;
            }
          } else if (f.content) {
            var evalFn = new Function('globalThis', f.content);
            evalFn(globalThis);
            appliedCount++;
          }
        } catch (evalErr) {}
      }

      return { appliedCount: appliedCount, totalAvailable: files.length };
    } catch (err) {
      return { appliedCount: 0, error: err.message };
    }
  }

  static async loadApp(containerId) {
    var targetContainer = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : (containerId || document.getElementById('app-container') || document.body);

    var lunoMeta = await LunoLoader.fetchConfig('luno.json') || {};
    var filesMeta = await LunoLoader.fetchConfig('files.json') || {};

    // Canonical priority: luno.json wins, files.json used as legacy fallback
    var mergedConfig = {
      name: lunoMeta.name || filesMeta.name || 'Luno App',
      entrypoint: lunoMeta.entrypoint || null,
      mainClass: lunoMeta.mainClass || filesMeta.mainClass || null,
      main: (Array.isArray(lunoMeta.main) && lunoMeta.main.length > 0) ? lunoMeta.main : (filesMeta.main || []),
      files: (Array.isArray(lunoMeta.files) && lunoMeta.files.length > 0) ? lunoMeta.files : (filesMeta.files || filesMeta.local || []),
      library: (Array.isArray(lunoMeta.library) && lunoMeta.library.length > 0) ? lunoMeta.library : (filesMeta.library || []),
      styles: (Array.isArray(lunoMeta.styles) && lunoMeta.styles.length > 0) ? lunoMeta.styles : (filesMeta.styles || []),
      thirdParty: (Array.isArray(lunoMeta.thirdParty) && lunoMeta.thirdParty.length > 0) ? lunoMeta.thirdParty : (filesMeta.thirdParty || [])
    };

    var loadedSummary = { styles: [], scripts: [], libraries: [], errors: [] };

    // 1. Load Stylesheets
    for (var i = 0; i < mergedConfig.styles.length; i++) {
      var stylePath = mergedConfig.styles[i];
      if (stylePath && typeof stylePath === 'string') {
        try {
          await LunoLoader.loadStyle(stylePath);
          loadedSummary.styles.push(stylePath);
        } catch (e) {
          loadedSummary.errors.push('Style Error: ' + e.message);
        }
      }
    }

    // 2. Load Shared Libraries
    for (var j = 0; j < mergedConfig.library.length; j++) {
      var libFile = mergedConfig.library[j];
      if (libFile && typeof libFile === 'string') {
        var libPath = libFile.indexOf('/') === 0 ? libFile : ('/Library/' + libFile.replace(/^Library\//i, ''));
        try {
          await LunoLoader.loadScript(libPath);
          loadedSummary.libraries.push(libFile);
        } catch (e) {
          loadedSummary.errors.push('Library Error (' + libFile + '): ' + e.message);
        }
      }
    }

    // 3. Load Auxiliary Scripts
    var auxiliaryFiles = [].concat(mergedConfig.thirdParty, mergedConfig.files);
    for (var k = 0; k < auxiliaryFiles.length; k++) {
      var auxPath = auxiliaryFiles[k];
      if (!auxPath || typeof auxPath !== 'string') continue;

      if (auxPath.endsWith('.css')) {
        try {
          await LunoLoader.loadStyle(auxPath);
          loadedSummary.styles.push(auxPath);
        } catch (e) {
          loadedSummary.errors.push(e.message);
        }
      } else if (auxPath.endsWith('.js') || auxPath.endsWith('.mjs')) {
        try {
          await LunoLoader.loadScript(auxPath);
          loadedSummary.scripts.push(auxPath);
        } catch (e) {
          loadedSummary.errors.push(e.message);
        }
      }
    }

    // 4. Load Main Application Scripts
    for (var m = 0; m < mergedConfig.main.length; m++) {
      var mainPath = mergedConfig.main[m];
      if (!mainPath || typeof mainPath !== 'string') continue;

      if (mainPath.endsWith('.css')) {
        try {
          await LunoLoader.loadStyle(mainPath);
          loadedSummary.styles.push(mainPath);
        } catch (e) {
          loadedSummary.errors.push('Main Style Error (' + mainPath + '): ' + e.message);
        }
      } else if (mainPath.endsWith('.js') || mainPath.endsWith('.mjs')) {
        try {
          await LunoLoader.loadScript(mainPath);
          loadedSummary.scripts.push(mainPath);
        } catch (e) {
          loadedSummary.errors.push('Main Script Error (' + mainPath + '): ' + e.message);
        }
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

    // 5. Playback Load-Time Patches
    var patchResult = await LunoLoader.applyPatchLog();

    // 6. Resolve and Execute Manifest Entrypoint Class
    var mainClassName = (mergedConfig.entrypoint && mergedConfig.entrypoint.class) || mergedConfig.mainClass;
    var entryMethodName = (mergedConfig.entrypoint && mergedConfig.entrypoint.method) || 'init';

    if (!mainClassName && mergedConfig.entrypoint && mergedConfig.entrypoint.file) {
      mainClassName = mergedConfig.entrypoint.file.split('/').pop().replace(/\.[^/.]+$/, '');
    } else if (!mainClassName && mergedConfig.main.length > 0) {
      for (var p = 0; p < mergedConfig.main.length; p++) {
        if (mergedConfig.main[p].endsWith('.js')) {
          mainClassName = mergedConfig.main[p].split('/').pop().replace(/\.[^/.]+$/, '');
          break;
        }
      }
    }

    if (!mainClassName) {
      if (targetContainer) {
        targetContainer.innerHTML = '<div style="padding:1.5rem; background:#161b22; color:#00f2fe; border:1px solid #00f2fe; border-radius:8px; font-family:monospace;">' +
          '<h3>⚙️ No Entrypoint Defined in luno.json</h3>' +
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
    }

    return { success: true, config: mergedConfig, loaded: loadedSummary, patchesApplied: patchResult.appliedCount };
  }
}

globalThis.LunoLoader = LunoLoader;
if (typeof module !== "undefined" && module.exports) module.exports = LunoLoader;