var LunoLoader = globalThis.LunoLoader = class LunoLoader {
  constructor() {}

  static loadedScripts = new Set([
    'LunoLoader.js',
    '/app/LunoLoader.js',
    './app/LunoLoader.js',
    'app/LunoLoader.js',
    '/Luno/app/LunoLoader.js',
    'Luno/app/LunoLoader.js',
    '/Library/LunoLoader.js',
    './Library/LunoLoader.js',
    './library/LunoLoader.js',
    'Library/LunoLoader.js',
    'library/LunoLoader.js'
  ]);
  static loadedStyles = new Set();

  /**
   * Detects if running on GitHub Pages, Cloudflare Pages, or static file protocol.
   */
  static isStaticHosting() {
    try {
      if (typeof window !== 'undefined' && window.location) {
        var host = window.location.hostname || '';
        return host.endsWith('github.io') || host.endsWith('pages.dev') || window.location.protocol === 'file:';
      }
    } catch (e) {}
    return false;
  }

  /**
   * Normalizes script paths:
   * - Local Node server: Preserves '/Luno/app/...' format expected by LunoServer.
   * - GitHub Pages: Strips redundant 'Luno/' prefix so it cleanly loads './app/...'.
   */
  static normalizeScriptPath(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '';
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath;

    var clean = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');

    if (LunoLoader.isStaticHosting()) {
      // In standalone GitHub repository, strip leading 'Luno/' prefix if present
      if (clean.startsWith('Luno/')) {
        clean = clean.slice(5);
      }
      if (!clean.startsWith('./') && !clean.startsWith('../')) {
        clean = './' + clean;
      }
      return clean;
    }

    // Local Node server mode: absolute slash path
    return clean.startsWith('/') ? clean : ('/' + clean);
  }

  static getLibraryRoot() {
    if (LunoLoader.isStaticHosting()) {
      return './library/';
    }
    return '/Library/';
  }

  static loadStyle(cssPath) {
    return new Promise(function(resolve) {
      var fullUrl = LunoLoader.normalizeScriptPath(cssPath);
      if (LunoLoader.loadedStyles.has(fullUrl)) return resolve({ url: fullUrl, cached: true });

      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fullUrl + (fullUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      link.onload = function() {
        LunoLoader.loadedStyles.add(fullUrl);
        resolve({ url: fullUrl, cached: false });
      };
      link.onerror = function() {
        console.warn('[LunoLoader] Optional stylesheet notice:', cssPath);
        resolve({ url: fullUrl, failed: true });
      };
      document.head.appendChild(link);
    });
  }

  static loadScript(jsPath) {
    return new Promise(function(resolve, reject) {
      var fullUrl = LunoLoader.normalizeScriptPath(jsPath);
      var cleanName = jsPath.split('?')[0].split('/').pop();

      if (cleanName === 'LunoLoader.js' && typeof globalThis.LunoLoader !== 'undefined') {
        LunoLoader.loadedScripts.add(fullUrl);
        return resolve({ url: fullUrl, cached: true });
      }

      if (LunoLoader.loadedScripts.has(fullUrl) || LunoLoader.loadedScripts.has(jsPath)) {
        return resolve({ url: fullUrl, cached: true });
      }

      var script = document.createElement('script');
      script.src = fullUrl + (fullUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      script.async = false;
      script.onload = function() {
        LunoLoader.loadedScripts.add(fullUrl);
        LunoLoader.loadedScripts.add(jsPath);
        resolve({ url: fullUrl, cached: false });
      };
      script.onerror = function() {
        // Fallback: If './subfolder/file.js' failed on static host, try './app/file.js'
        var altPath = './app/' + cleanName + '?v=' + Date.now();
        var altScript = document.createElement('script');
        altScript.src = altPath;
        altScript.async = false;
        altScript.onload = function() {
          LunoLoader.loadedScripts.add(fullUrl);
          LunoLoader.loadedScripts.add(jsPath);
          resolve({ url: altPath, fallback: true });
        };
        altScript.onerror = function() {
          reject(new Error('Failed to load script: ' + fullUrl));
        };
        document.head.appendChild(altScript);
      };
      document.head.appendChild(script);
    });
  }

  static async applyPatchLog(projectName) {
    if (LunoLoader.isStaticHosting()) {
      return { appliedCount: 0, note: 'Static hosting mode' };
    }

    try {
      var targetProj = projectName || 'Luno';
      var res = await fetch('/api/fs/read?path=LunoPatchLog.html&project=' + encodeURIComponent(targetProj) + '&v=' + Date.now());
      var data = await res.json();
      if (!res.ok || !data || !data.content || !data.content.trim()) return { appliedCount: 0, note: 'Patch log empty' };

      var parser = globalThis.LunoPayloadParser || globalThis.LunoContainerParser;
      if (!parser || typeof parser.parsePatchLog !== 'function') return { appliedCount: 0, error: 'Parser unavailable' };

      var parsed = parser.parsePatchLog(data.content);
      var files = parsed.files || [];
      var appliedCount = 0;

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f || !f.filePath) continue;

        var norm = f.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
        var isForTarget = (targetProj === 'Luno')
          ? (norm.startsWith('Luno/') || !norm.includes('/') || norm.startsWith('app/') || norm.startsWith('browser/') || norm.startsWith('core/') || norm.startsWith('docs/') || norm.startsWith('test/'))
          : (norm.startsWith(targetProj + '/') || norm.startsWith('Library/'));

        if (!isForTarget) continue;

        if (f.methodSpec && f.content) {
          var spec = f.methodSpec.replace(/^(?:globalThis|window)\./, '').trim();
          var parts = spec.split('.');
          var mName = parts.pop();
          var cName = parts.join('.');
          var targetClass = globalThis[cName] || (typeof window !== 'undefined' && window[cName]);
          if (targetClass) {
            try {
              var cleanCode = f.content.trim().replace(/^\s*(?:\/\/[^\r\n]*[\r\n]+|\/\*[\s\S]*?\*\/\s*)+/, '').trim();
              var firstBrace = cleanCode.indexOf('{');
              var body = firstBrace !== -1 ? cleanCode.slice(firstBrace).trim() : '{ ' + cleanCode + ' }';
              var isAsync = /\basync\b/.test(cleanCode.slice(0, firstBrace));
              var fn = new Function('return (' + (isAsync ? 'async function' : 'function') + '() ' + body + ');')();
              targetClass[mName] = fn;
              appliedCount++;
            } catch(e) {}
          }
        }
      }

      return { appliedCount: appliedCount, targetProject: targetProj };
    } catch(err) {
      return { appliedCount: 0, error: err.message };
    }
  }

  static async loadApp(containerId) {
    var targetContainer = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : (containerId || document.getElementById('app-root') || document.body);

    var bootStatusEl = document.getElementById('boot-status');
    var updateBootStatus = function(msg) {
      if (bootStatusEl) {
        var p = bootStatusEl.querySelector('p');
        if (p) p.textContent = msg;
      }
    };

    var lunoMeta = {};
    try {
      updateBootStatus('Reading luno.json manifest...');
      var manifestUrl = LunoLoader.isStaticHosting() ? './luno.json' : 'luno.json?v=' + Date.now();
      var res = await fetch(manifestUrl);
      if (res.ok) lunoMeta = await res.json();
    } catch(e) {
      console.warn('[LunoLoader] Manifest load notice:', e);
    }

    var libs = Array.isArray(lunoMeta.library) ? lunoMeta.library : [];
    var main = Array.isArray(lunoMeta.main) ? lunoMeta.main : [];
    var styles = Array.isArray(lunoMeta.styles) ? lunoMeta.styles : [];

    for (var s = 0; s < styles.length; s++) {
      await LunoLoader.loadStyle(styles[s]);
    }

    var libRoot = LunoLoader.getLibraryRoot();
    for (var l = 0; l < libs.length; l++) {
      var cleanLib = libs[l].replace(/^Library\//i, '').replace(/^library\//i, '').replace(/^\/+/, '');
      await LunoLoader.loadScript(libRoot + cleanLib);
    }

    if (typeof DomBasics !== 'undefined' && typeof DomBasics.run === 'function') {
      DomBasics.run();
    }

    for (var m = 0; m < main.length; m++) {
      var scriptName = main[m].split('/').pop();
      updateBootStatus('Loading [' + (m + 1) + '/' + main.length + ']: ' + scriptName);
      try {
        await LunoLoader.loadScript(main[m]);
      } catch (err) {
        console.error('[LunoLoader] Error loading module:', main[m], err);
        updateBootStatus('⚠️ Failed to load ' + scriptName + ': ' + err.message);
      }
    }

    try {
      await LunoLoader.applyPatchLog(lunoMeta.name || 'Luno');
    } catch(e) {}

    updateBootStatus('Launching ClientApp...');

    var entryClass = (lunoMeta.entrypoint && lunoMeta.entrypoint.class) || lunoMeta.mainClass || 'ClientApp';
    var entryMethod = (lunoMeta.entrypoint && lunoMeta.entrypoint.method) || 'init';

    var AppCls = window[entryClass] || globalThis[entryClass];
    if (typeof AppCls === 'function') {
      var envCtx = { container: targetContainer, config: lunoMeta, isStatic: LunoLoader.isStaticHosting() };
      if (typeof AppCls[entryMethod] === 'function') {
        await AppCls[entryMethod](envCtx);
      } else {
        var inst = new AppCls();
        if (typeof inst[entryMethod] === 'function') await inst[entryMethod](envCtx);
        else if (typeof inst.run === 'function') await inst.run(envCtx);
      }
    } else {
      if (bootStatusEl) {
        bootStatusEl.innerHTML = [
          '<h3 style="color:#ff7b72; margin-top:0;">⚠️ Boot Scope Notice</h3>',
          '<p style="font-size:12px; color:#c9d1d9;">Could not locate entrypoint class <strong>' + entryClass + '</strong>.</p>',
          '<button onclick="location.reload()" style="margin-top:0.5rem; padding:0.35rem 0.75rem; background:#238636; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; font-family:monospace;">🔄 Reload</button>'
        ].join('\n');
      }
    }
  }
};

if (typeof module !== "undefined" && module.exports) module.exports = LunoLoader;